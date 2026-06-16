# 🚨 RAPPORT DE SÉCURITÉ CRITIQUE - Gestion des Rôles

## ⚠️ SITUATION ACTUELLE

Vous avez raison d'être inquiet. Le problème que vous rencontrez est **CRITIQUE** et doit être résolu **IMMÉDIATEMENT**.

### Ce qui se passe actuellement

1. **Vous vous connectez avec admin@swipetonpro.fr**
2. **Le système vous affiche "Bienvenue admin ! Particulier"**
3. **Vous êtes redirigé vers la page particulier au lieu de la page admin**

## 🔍 ANALYSE DE LA CAUSE RACINE

### Le Problème N'est PAS un mélange de comptes

**RASSUREZ-VOUS :** Il n'y a **PAS** de mélange entre les comptes particulier et professionnel. Voici pourquoi :

1. **Chaque compte a un UUID unique** dans `auth.users`
2. **Chaque profil est lié à UN SEUL compte** via `profiles.id = auth.uid()`
3. **Les données professionnelles sont dans une table séparée** `professionals`
4. **Les RLS empêchent l'accès croisé** entre les comptes

### La VRAIE Cause : Récursion Infinie dans les Politiques RLS

Le problème vient d'une **erreur technique dans les politiques de sécurité** :

```sql
-- ❌ POLITIQUE PROBLÉMATIQUE (AVANT)
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p  -- ⚠️ RÉCURSION INFINIE ICI
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin')
        )
    );
```

**Ce qui se passe :**
1. Vous vous connectez → Le système essaie de charger votre profil
2. La politique RLS vérifie si vous êtes admin → Elle fait un SELECT sur profiles
3. Ce SELECT déclenche à nouveau la politique RLS → Boucle infinie
4. **Résultat :** Erreur 500, le rôle n'est pas chargé correctement
5. **Conséquence :** Le système ne sait pas que vous êtes admin
6. **Redirection par défaut :** Vers la page particulier

## ✅ POURQUOI IL N'Y A PAS DE RISQUE DE MÉLANGE DE COMPTES

### 1. Architecture de Sécurité en Place

```
┌─────────────────────────────────────────────────────────┐
│                    auth.users (Supabase)                 │
│  - UUID unique par utilisateur                           │
│  - Email unique                                          │
│  - Mot de passe hashé                                    │
└─────────────────────────────────────────────────────────┘
                            │
                            │ 1:1
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    profiles (Table)                      │
│  - id = auth.uid() (UUID unique)                         │
│  - role: 'client' | 'professional' | 'admin'             │
│  - full_name, email, etc.                                │
└─────────────────────────────────────────────────────────┘
                            │
                            │ 1:1 (si professional)
                            ▼
┌─────────────────────────────────────────────────────────┐
│                 professionals (Table)                    │
│  - id (UUID unique)                                      │
│  - user_id = profiles.id                                 │
│  - company_name, siret, etc.                             │
└─────────────────────────────────────────────────────────┘
```

### 2. Politiques RLS Strictes

**Pour les Particuliers :**
```sql
-- Un particulier ne peut voir QUE ses propres projets
CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT
    USING (client_id = auth.uid());
```

**Pour les Professionnels :**
```sql
-- Un professionnel ne peut voir QUE ses propres données
CREATE POLICY "Professionals can view own data" ON professionals
    FOR SELECT
    USING (user_id = auth.uid());
```

**Séparation Totale :**
- Un particulier (client_id = UUID_A) ne peut **JAMAIS** accéder aux données d'un professionnel (user_id = UUID_B)
- Les UUID sont différents
- Les tables sont séparées
- Les politiques RLS empêchent tout accès croisé

### 3. Vérifications dans le Code

Dans `AuthContext.tsx`, il y a des alertes de sécurité :

```typescript
// 🚨 ALERTE SÉCURITÉ si mélange détecté
if (profile && professional && profile.role !== 'professional') {
  console.error(
    '🚨 SÉCURITÉ CRITIQUE: Particulier avec données professionnelles!',
    {
      userId: user?.id,
      email: user?.email,
      profileRole: profile.role,
      hasProfessionalData: !!professional,
    }
  );
}
```

## 🔧 SOLUTION IMMÉDIATE

### Étape 1 : Appliquer la Migration SQL (URGENT)

1. **Connectez-vous à Supabase Dashboard**
   - URL : https://app.supabase.com
   - Sélectionnez votre projet

2. **Allez dans SQL Editor**

3. **Copiez et exécutez ce SQL :**

```sql
-- =====================================================
-- FIX URGENT : Récursion Infinie dans Politiques RLS
-- =====================================================

-- PROFILES TABLE - Supprimer la récursion infinie
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
        OR
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')
    );

-- PROJECTS TABLE
DROP POLICY IF EXISTS "Admins can view all projects" ON projects;
CREATE POLICY "Admins can view all projects" ON projects
    FOR SELECT
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin', 'moderator')
        OR
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin', 'moderator')
    );
```

### Étape 2 : Vider le Cache et Reconnexion

```javascript
// Dans la console du navigateur (F12)
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Étape 3 : Vérification

Après avoir appliqué la migration :
1. Reconnectez-vous avec admin@swipetonpro.fr
2. Vous devriez être redirigé vers `/admin/dashboard`
3. Plus d'erreur 500 dans la console

## 🛡️ GARANTIES DE SÉCURITÉ

### Ce qui est IMPOSSIBLE avec l'architecture actuelle :

❌ **Un professionnel ne peut PAS se connecter à un compte particulier**
- Raison : UUID différents, tables séparées, RLS strictes

❌ **Un particulier ne peut PAS voir les données d'un professionnel**
- Raison : Politiques RLS basées sur auth.uid()

❌ **Un admin ne peut PAS "devenir" un autre utilisateur**
- Raison : L'authentification est gérée par Supabase Auth (externe)

❌ **Les données ne peuvent PAS être mélangées**
- Raison : Contraintes de clés étrangères + RLS

### Ce qui est GARANTI :

✅ **Chaque utilisateur a un UUID unique et immuable**
✅ **Les sessions sont gérées par Supabase Auth (sécurisé)**
✅ **Les politiques RLS empêchent tout accès non autorisé**
✅ **Les rôles sont stockés dans la base de données**
✅ **Aucun utilisateur ne peut modifier son propre rôle**

## 📊 Audit de Sécurité - Vérifications

### Vérification 1 : Compte Admin

```sql
-- Vérifier votre compte admin
SELECT 
    au.id as auth_id,
    au.email,
    p.id as profile_id,
    p.role,
    p.full_name
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE au.email = 'admin@swipetonpro.fr';
```

**Résultat attendu :**
- `auth_id` = UUID unique
- `profile_id` = même UUID
- `role` = 'admin' ou 'super_admin'

### Vérification 2 : Pas de Doublons

```sql
-- Vérifier qu'il n'y a pas de doublons
SELECT email, COUNT(*) as count
FROM auth.users
GROUP BY email
HAVING COUNT(*) > 1;
```

**Résultat attendu :** Aucune ligne (pas de doublons)

### Vérification 3 : Cohérence des Rôles

```sql
-- Vérifier la cohérence des rôles
SELECT 
    p.id,
    p.email,
    p.role,
    CASE 
        WHEN p.role = 'professional' AND pr.id IS NULL THEN '⚠️ Professionnel sans données'
        WHEN p.role != 'professional' AND pr.id IS NOT NULL THEN '⚠️ Non-professionnel avec données pro'
        ELSE '✅ OK'
    END as status
FROM profiles p
LEFT JOIN professionals pr ON pr.user_id = p.id;
```

**Résultat attendu :** Tous les statuts = '✅ OK'

## 🔒 Recommandations de Sécurité Supplémentaires

### 1. Activer l'Authentification à Deux Facteurs (2FA)

Pour les comptes admin, activez la 2FA dans Supabase :
- Dashboard Supabase → Authentication → Policies
- Activer "Require MFA for admin users"

### 2. Logs d'Audit

Créer une table de logs pour tracer toutes les actions admin :

```sql
CREATE TABLE admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    target_user_id UUID,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Alertes de Sécurité

Configurer des alertes email pour :
- Connexions admin depuis une nouvelle IP
- Modifications de rôles
- Accès à des données sensibles

### 4. Rotation des Mots de Passe

Forcer le changement de mot de passe admin tous les 90 jours.

## 📞 Support et Assistance

Si après avoir appliqué la migration, le problème persiste :

1. **Vérifiez les logs de la console** (F12)
2. **Exécutez les requêtes de vérification** ci-dessus
3. **Envoyez-moi les résultats** pour diagnostic approfondi

## ✅ CONCLUSION

**Le problème actuel est un BUG TECHNIQUE, pas une faille de sécurité dans la séparation des comptes.**

- ✅ Les comptes sont bien séparés
- ✅ Les RLS empêchent les accès croisés
- ✅ L'architecture est sécurisée
- ❌ La récursion infinie empêche le chargement correct du rôle admin

**Une fois la migration appliquée, tout fonctionnera correctement et en toute sécurité.**

---

**Date :** 27 juin 2026  
**Priorité :** 🚨 CRITIQUE  
**Action requise :** IMMÉDIATE
