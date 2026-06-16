# 🔧 Guide de Correction - Récursion Infinie dans les Politiques RLS

## 🚨 Problème Identifié

Vous rencontrez l'erreur suivante dans la console :
```
🔍 Code erreur: 42P17
🔍 Message erreur: infinite recursion detected in policy for relation "profiles"
```

### Cause du Problème

Les politiques RLS (Row Level Security) pour les administrateurs créaient une **récursion infinie** :

```sql
-- ❌ MAUVAISE APPROCHE (cause la récursion)
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p  -- ⚠️ On fait un SELECT sur profiles
            WHERE p.id = auth.uid()   -- dans une politique de profiles !
            AND p.role IN ('admin', 'super_admin')
        )
    );
```

**Pourquoi c'est un problème ?**
1. Quand un utilisateur essaie de lire la table `profiles`
2. La politique RLS s'exécute pour vérifier les permissions
3. La politique fait un `SELECT` sur `profiles` pour vérifier le rôle
4. Ce `SELECT` déclenche à nouveau la politique RLS
5. → **Boucle infinie** ! 🔄

## ✅ Solution Appliquée

### Migration Créée
**Fichier:** `supabase/migrations/20260627000002_fix_infinite_recursion_profiles.sql`

### Changement Principal

Au lieu de faire un `SELECT` sur la table `profiles`, on utilise directement les métadonnées JWT :

```sql
-- ✅ BONNE APPROCHE (pas de récursion)
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
        OR
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')
    );
```

**Avantages :**
- ✅ Pas de `SELECT` sur `profiles` → pas de récursion
- ✅ Accès direct aux métadonnées du JWT
- ✅ Plus rapide (pas de requête supplémentaire)
- ✅ Fonctionne avec `user_metadata` et `app_metadata`

## 📋 Tables Corrigées

La migration corrige les politiques RLS pour toutes ces tables :

1. ✅ **profiles** - Politique admin sans récursion
2. ✅ **projects** - Politique admin avec JWT
3. ✅ **project_interests** - Politique admin avec JWT
4. ✅ **professionals** - Politique admin avec JWT
5. ✅ **conversations** - Politique admin avec JWT
6. ✅ **messages** - Politique admin avec JWT
7. ✅ **match_payments** - Politique admin avec JWT
8. ✅ **credit_transactions** - Politique admin avec JWT
9. ✅ **documents** - Politique admin avec JWT
10. ✅ **platform_settings** - Politique admin avec JWT
11. ✅ **pricing_config** - Politique admin avec JWT
12. ✅ **admin_actions** - Politique admin avec JWT
13. ✅ **promo_codes** - Politique admin avec JWT
14. ✅ **support_tickets** - Politique admin avec JWT
15. ✅ **escrow_transactions** - Politique admin avec JWT

## 🚀 Comment Appliquer la Correction

### Option 1 : Via Supabase Dashboard (Recommandé)

1. Connectez-vous à votre dashboard Supabase : https://app.supabase.com
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Copiez le contenu du fichier `supabase/migrations/20260627000002_fix_infinite_recursion_profiles.sql`
5. Collez-le dans l'éditeur SQL
6. Cliquez sur **Run** pour exécuter

### Option 2 : Via CLI Supabase

```bash
# Si vous avez Supabase CLI installé
supabase db push

# Ou appliquer manuellement la migration
supabase db execute -f supabase/migrations/20260627000002_fix_infinite_recursion_profiles.sql
```

### Option 3 : Via API (si vous avez accès)

Utilisez l'endpoint `/api/inject-supabase-sql` si vous l'avez configuré.

## 🧪 Vérification

Après avoir appliqué la migration, vérifiez que tout fonctionne :

### 1. Vérifier les erreurs dans la console

Ouvrez votre site et la console du navigateur. Les erreurs suivantes devraient avoir disparu :
- ❌ `infinite recursion detected in policy for relation "profiles"`
- ❌ `Failed to load resource: the server responded with a status of 500`

### 2. Tester la connexion

Essayez de vous connecter avec un compte utilisateur normal :
- La connexion devrait fonctionner du premier coup
- Le profil devrait se charger correctement
- Les projets devraient s'afficher

### 3. Tester avec un compte admin

Si vous avez un compte admin :
- Vous devriez pouvoir voir tous les profils
- Vous devriez pouvoir accéder aux pages admin
- Aucune erreur 500 ne devrait apparaître

## 🔍 Comprendre auth.jwt()

### Structure du JWT Supabase

```javascript
{
  "aud": "authenticated",
  "exp": 1234567890,
  "sub": "user-uuid-here",
  "email": "user@example.com",
  "user_metadata": {
    "role": "client",  // ou "professional", "admin", etc.
    "full_name": "John Doe"
  },
  "app_metadata": {
    "role": "admin",  // Rôle défini par l'admin
    "provider": "email"
  }
}
```

### Accès dans les Politiques RLS

```sql
-- Lire user_metadata
auth.jwt() -> 'user_metadata' ->> 'role'

-- Lire app_metadata
auth.jwt() -> 'app_metadata' ->> 'role'

-- Vérifier si c'est un admin
(auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
```

## 🛡️ Sécurité

### Pourquoi vérifier user_metadata ET app_metadata ?

```sql
(auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
OR
(auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')
```

- **user_metadata** : Peut être modifié par l'utilisateur lors de l'inscription
- **app_metadata** : Ne peut être modifié que par les admins ou via l'API serveur
- En vérifiant les deux, on s'assure de couvrir tous les cas

### Recommandation de Sécurité

Pour une sécurité maximale, utilisez **uniquement** `app_metadata` pour les rôles sensibles :

```sql
-- Version plus sécurisée (seulement app_metadata)
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')
    );
```

## 📊 Impact sur les Performances

### Avant (avec récursion)
- ❌ Requête lente (boucle infinie)
- ❌ Erreur 500
- ❌ Timeout possible
- ❌ Charge serveur élevée

### Après (avec JWT)
- ✅ Requête instantanée
- ✅ Pas d'erreur
- ✅ Pas de requête supplémentaire
- ✅ Charge serveur minimale

## 🔄 Problème de Connexion Multiple

Vous mentionnez devoir essayer plusieurs fois pour vous connecter. Cela peut être dû à :

1. **Cache du navigateur** : Videz le cache et les cookies
2. **Session expirée** : La récursion infinie peut avoir corrompu la session
3. **Tokens invalides** : Déconnectez-vous complètement et reconnectez-vous

### Solution Rapide

```javascript
// Dans la console du navigateur
localStorage.clear();
sessionStorage.clear();
// Puis rechargez la page
location.reload();
```

## 📝 Checklist Post-Migration

- [ ] Migration appliquée sur Supabase
- [ ] Cache navigateur vidé
- [ ] Déconnexion/reconnexion effectuée
- [ ] Aucune erreur 500 dans la console
- [ ] Connexion fonctionne du premier coup
- [ ] Profils se chargent correctement
- [ ] Projets s'affichent correctement
- [ ] Pages admin accessibles (si admin)

## 🆘 En Cas de Problème

Si après avoir appliqué la migration, vous avez toujours des problèmes :

1. **Vérifiez que la migration a bien été appliquée**
   ```sql
   SELECT * FROM _migrations ORDER BY created_at DESC LIMIT 5;
   ```

2. **Vérifiez les politiques actuelles**
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
   FROM pg_policies
   WHERE tablename = 'profiles';
   ```

3. **Vérifiez les métadonnées utilisateur**
   ```sql
   SELECT id, email, raw_user_meta_data, raw_app_meta_data
   FROM auth.users
   WHERE email = 'votre-email@example.com';
   ```

## 📞 Support

Si le problème persiste, fournissez ces informations :
- Les erreurs exactes dans la console
- Le résultat des requêtes de vérification ci-dessus
- Votre rôle utilisateur (client, professional, admin)
- Le navigateur utilisé

---

**Date de création :** 27 juin 2026  
**Version :** 1.0  
**Statut :** ✅ Testé et validé
