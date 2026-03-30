# 🗑️ ÉTAPE 1 - NETTOYAGE COMPTES .COM

---

## 📋 **OBJECTIF DE L'ÉTAPE 1**

**Nettoyer les comptes .com admin/support/moderator et créer les comptes .fr correspondants**

---

## 🔍 **ANALYSE PRÉALABLE**

### **Comptes à supprimer**
- `admin@swipetonpro.com`
- `team@swipetonpro.com`
- `support@swipetonpro.com`
- `moderator@swipetonpro.com`

### **Comptes à créer**
- `admin@swipetonpro.fr`
- `team@swipetonpro.fr`
- `support@swipetonpro.fr`
- `moderator@swipetonpro.fr`

### **Tables concernées**
- `auth.users` (table Supabase Auth)
- `public.profiles` (table des profils)
- `public.professionals` (table des professionnels - si applicable)

---

## 🛡️ **ANALYSE DE SÉCURITÉ**

### **Risques identifiés**
1. **Perte de données** si suppression incorrecte
2. **Impact sur les permissions** existantes
3. **Références orphelines** dans d'autres tables
4. **Accès administrateur** temporairement indisponible

### **Mesures de sécurité**
1. **Backup préalable** des données
2. **Vérification des dépendances**
3. **Transaction SQL** pour atomicité
4. **Validation post-suppression**
5. **Test des nouveaux comptes** avant finalisation

---

## 📊 **VÉRIFICATION ACTUELLE**

### **Diagnostic des comptes existants**
```sql
-- Vérifier les comptes .com existants
SELECT 
  u.id,
  u.email,
  u.created_at,
  u.email_confirmed_at,
  p.role,
  p.full_name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email LIKE '%@swipetonpro.com'
AND u.email IN (
  'admin@swipetonpro.com', 
  'team@swipetonpro.com', 
  'support@swipetonpro.com', 
  'moderator@swipetonpro.com'
)
ORDER BY u.created_at;

-- Vérifier les dépendances
SELECT 
  'profiles' as table_name,
  COUNT(*) as count
FROM public.profiles 
WHERE email LIKE '%@swipetonpro.com'
AND email IN (
  'admin@swipetonpro.com', 
  'team@swipetonpro.com', 
  'support@swipetonpro.com', 
  'moderator@swipetonpro.com'
)

UNION ALL

SELECT 
  'professionals' as table_name,
  COUNT(*) as count
FROM public.professionals pr
JOIN auth.users u ON pr.user_id = u.id
WHERE u.email LIKE '%@swipetonpro.com'
AND u.email IN (
  'admin@swipetonpro.com', 
  'team@swipetonpro.com', 
  'support@swipetonpro.com', 
  'moderator@swipetonpro.com'
);
```

---

## 🔧 **PROCÉDURE DE NETTOYAGE**

### **Étape 1.1 - Backup des données**
```sql
-- Créer une table de backup
CREATE TABLE IF NOT EXISTS backup_comptes_nettoyage (
  id UUID PRIMARY KEY,
  email TEXT,
  role TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  backup_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  table_source TEXT
);

-- Backup des comptes à supprimer
INSERT INTO backup_comptes_nettoyage (id, email, role, full_name, created_at, table_source)
SELECT 
  u.id,
  u.email,
  p.role,
  p.full_name,
  u.created_at,
  'auth.users'
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email LIKE '%@swipetonpro.com'
AND u.email IN (
  'admin@swipetonpro.com', 
  'team@swipetonpro.com', 
  'support@swipetonpro.com', 
  'moderator@swipetonpro.com'
);

-- Vérification du backup
SELECT * FROM backup_comptes_nettoyage;
```

### **Étape 1.2 - Suppression sécurisée**
```sql
-- Commencer une transaction
BEGIN;

-- Supprimer les entrées dans professionals (si existantes)
DELETE FROM public.professionals 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email LIKE '%@swipetonpro.com'
  AND email IN (
    'admin@swipetonpro.com', 
    'team@swipetonpro.com', 
    'support@swipetonpro.com', 
    'moderator@swipetonpro.com'
  )
);

-- Supprimer les profils correspondants
DELETE FROM public.profiles 
WHERE email LIKE '%@swipetonpro.com'
AND email IN (
  'admin@swipetonpro.com', 
  'team@swipetonpro.com', 
  'support@swipetonpro.com', 
  'moderator@swipetonpro.com'
);

-- Supprimer les utilisateurs auth
DELETE FROM auth.users 
WHERE email LIKE '%@swipetonpro.com'
AND email IN (
  'admin@swipetonpro.com', 
  'team@swipetonpro.com', 
  'support@swipetonpro.com', 
  'moderator@swipetonpro.com'
);

-- Valider la transaction
COMMIT;
```

### **Étape 1.3 - Vérification post-suppression**
```sql
-- Vérifier qu'aucun compte .com n'existe plus
SELECT COUNT(*) as comptes_com_restants
FROM auth.users 
WHERE email LIKE '%@swipetonpro.com'
AND email IN (
  'admin@swipetonpro.com', 
  'team@swipetonpro.com', 
  'support@swipetonpro.com', 
  'moderator@swipetonpro.com'
);

-- Vérifier les comptes restants
SELECT email, role 
FROM public.profiles 
WHERE email LIKE '%@swipetonpro.com';
```

---

## 👥 **CRÉATION DES COMPTES .FR**

### **Étape 1.4 - Préparation des nouveaux comptes**
```sql
-- Préparation des données pour les nouveaux comptes
WITH new_accounts AS (
  SELECT 
    'admin@swipetonpro.fr' as email,
    'Administrateur SwipeTonPro' as full_name,
    'admin' as role,
    'PasswordAdmin2024!' as password
  UNION ALL
  SELECT 
    'team@swipetonpro.fr' as email,
    'Équipe SwipeTonPro' as full_name,
    'team' as role,
    'PasswordTeam2024!' as password
  UNION ALL
  SELECT 
    'support@swipetonpro.fr' as email,
    'Support SwipeTonPro' as full_name,
    'support' as role,
    'PasswordSupport2024!' as password
  UNION ALL
  SELECT 
    'moderator@swipetonpro.fr' as email,
    'Modérateur SwipeTonPro' as full_name,
    'moderator' as role,
    'PasswordModerator2024!' as password
)
SELECT * FROM new_accounts;
```

### **Étape 1.5 - Création via API Supabase**
```sql
-- Note: La création doit se faire via l'API Supabase Admin
-- car la table auth.users n'est pas directement modifiable

-- Script pour la création via l'API (à exécuter dans le code)
/*
import { supabase } from '@/integrations/supabase/client';

const accounts = [
  { email: 'admin@swipetonpro.fr', fullName: 'Administrateur SwipeTonPro', role: 'admin', password: 'PasswordAdmin2024!' },
  { email: 'team@swipetonpro.fr', fullName: 'Équipe SwipeTonPro', role: 'team', password: 'PasswordTeam2024!' },
  { email: 'support@swipetonpro.fr', fullName: 'Support SwipeTonPro', role: 'support', password: 'PasswordSupport2024!' },
  { email: 'moderator@swipetonpro.fr', fullName: 'Modérateur SwipeTonPro', role: 'moderator', password: 'PasswordModerator2024!' }
];

for (const account of accounts) {
  // Créer l'utilisateur dans Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,
    user_metadata: {
      full_name: account.fullName,
      role: account.role
    }
  });

  if (authError) {
    console.error(`Erreur création ${account.email}:`, authError);
    continue;
  }

  // Créer le profil dans la table profiles
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      email: account.email,
      full_name: account.fullName,
      role: account.role,
      created_at: new Date()
    });

  if (profileError) {
    console.error(`Erreur profil ${account.email}:`, profileError);
  } else {
    console.log(`Compte créé avec succès: ${account.email}`);
  }
}
*/
```

---

## 🔒 **VALIDATION ET SÉCURISATION**

### **Étape 1.6 - Tests de connexion**
```sql
-- Vérifier que les nouveaux comptes existent
SELECT 
  u.id,
  u.email,
  u.created_at,
  u.email_confirmed_at,
  p.role,
  p.full_name,
  CASE 
    WHEN u.email_confirmed_at IS NOT NULL THEN '✅ Confirmé'
    ELSE '❌ Non confirmé'
  END as statut
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email LIKE '%@swipetonpro.fr'
ORDER BY u.created_at;
```

### **Étape 1.7 - Vérification des permissions**
```sql
-- Vérifier que les rôles sont corrects
SELECT 
  email,
  role,
  full_name,
  CASE 
    WHEN role IN ('admin', 'team', 'support', 'moderator') THEN '✅ Rôle valide'
    ELSE '❌ Rôle invalide'
  END as validation_role
FROM public.profiles 
WHERE email LIKE '%@swipetonpro.fr';
```

---

## 📋 **CHECKLIST DE VALIDATION**

### **✅ Avant de passer à l'étape 2**

- [ ] **Backup effectué** et vérifié
- [ ] **Comptes .com supprimés** complètement
- [ ] **Pas de références orphelines** dans les autres tables
- [ ] **Comptes .fr créés** avec succès
- [ ] **Emails confirmés** pour tous les comptes
- [ ] **Rôles assignés** correctement
- [ ] **Tests de connexion** réussis
- [ ] **Permissions vérifiées** pour chaque rôle
- [ ] **Documentation mise à jour** avec nouveaux comptes
- [ ] **Anciens mots de passe** sécurisés/changés

---

## 🚨 **PLAN DE ROLLBACK**

### **En cas de problème**
```sql
-- Restauration depuis le backup
INSERT INTO auth.users (id, email, created_at, email_confirmed_at)
SELECT id, email, created_at, email_confirmed_at
FROM backup_comptes_nettoyage
WHERE table_source = 'auth.users';

INSERT INTO public.profiles (id, email, role, full_name, created_at)
SELECT id, email, role, full_name, created_at
FROM backup_comptes_nettoyage
WHERE table_source = 'profiles';
```

---

## 📊 **RAPPORT D'EXÉCUTION**

### **À compléter après exécution**
- **Date d'exécution** : [À remplir]
- **Nombre de comptes supprimés** : [À remplir]
- **Nombre de comptes créés** : [À remplir]
- **Erreurs rencontrées** : [À remplir]
- **Tests validés** : [À remplir]
- **Statut final** : [À remplir]

---

## 🎯 **CRITÈRES DE SUCCÈS**

1. **Zéro compte .com** restant dans la base
2. **4 comptes .fr** créés et fonctionnels
3. **Tous les rôles** correctement assignés
4. **Connexions testées** avec succès
5. **Aucune donnée perdue** pendant le processus
6. **Système stable** après la migration

---

## ⚡ **PRÊT POUR L'EXÉCUTION ?**

**Cette étape est critique pour la sécurité du système. Une fois validée, nous pourrons passer à l'étape 2 avec confiance.**

**Voulez-vous que je commence l'exécution de cette étape 1 ?**
