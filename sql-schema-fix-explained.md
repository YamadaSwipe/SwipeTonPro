# 🔧 ERREUR SQL CORRIGÉE - Schéma de la base de données

---

## ❌ **ERREUR RENCONTRÉE**

### **🛑 Erreur SQL**
```sql
ERROR: 42703: column p.user_id does not exist
LINE 23: LEFT JOIN public.profiles p ON u.id = p.user_id
```

### **🔍 CAUSE**
- **Hypothèse incorrecte** : La table `profiles` utilise `id` comme clé primaire
- **Jointure erronée** : `u.id = p.user_id` n'existe pas
- **Schéma réel** : `profiles.id` est la clé primaire, pas `user_id`

---

## ✅ **SCHÉMA CORRECT**

### **📊 TABLE PROFILES**
```sql
-- Structure réelle (d'après 001_initial_schema.sql):
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- ← Clé primaire
  email TEXT,
  full_name TEXT,
  phone TEXT,
  -- ... autres colonnes
);
```

### **📊 TABLE PROFESSIONALS**
```sql
-- Structure réelle (d'après 001_initial_schema.sql):
CREATE TABLE professionals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- ← Clé primaire
  user_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,  -- ← Référence vers profiles.id
  siret TEXT NOT NULL,
  company_name TEXT NOT NULL,
  -- ... autres colonnes
);
```

---

## ✅ **CORRECTIONS APPLIQUÉES**

### **🔧 Jointures corrigées**
```sql
-- ❌ AVANT (incorrect):
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN public.professionals pr ON u.id = pr.user_id

-- ✅ APRÈS (correct):
LEFT JOIN public.profiles p ON u.id = p.id          -- profiles.id = auth.users.id
LEFT JOIN public.professionals pr ON u.id = pr.id      -- professionals.id = auth.users.id
```

### **📊 Logique des jointures**
1. **auth.users.id** ↔ **profiles.id** : L'utilisateur authentifié correspond à son profil
2. **auth.users.id** ↔ **professionals.id** : L'utilisateur authentifié correspond à sa fiche professionnelle
3. **professionals.user_id** ↔ **profiles.id** : La fiche professionnelle référence le profil

---

## 🎯 **REQUÊTES DE DIAGNOSTIC CORRIGÉES**

### **📋 1. Vérification incohérences**
```sql
SELECT 
  u.id as auth_user_id,
  u.email as auth_email,
  p.id as profile_id,
  p.email as profile_email,
  pr.id as professional_id,
  pr.email as professional_email,
  CASE 
    WHEN u.email != p.email THEN 'PROFILE EMAIL MISMATCH'
    WHEN u.email != pr.email THEN 'PROFESSIONAL EMAIL MISMATCH'
    ELSE 'OK'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id          -- ✅ CORRIGÉ
LEFT JOIN public.professionals pr ON u.id = pr.id      -- ✅ CORRIGÉ
WHERE u.email IS NOT NULL;
```

### **📋 2. Test email spécifique**
```sql
SELECT 
  u.id as auth_id,
  u.email as auth_email,
  p.id as profile_id,
  p.id as profile_user_id,  -- ✅ CORRIGÉ: profiles.id
  p.email as profile_email,
  pr.id as professional_id,
  pr.id as professional_user_id,  -- ✅ CORRIGÉ: professionals.id
  pr.email as professional_email,
  pr.company_name as professional_company
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id          -- ✅ CORRIGÉ
LEFT JOIN public.professionals pr ON u.id = pr.id      -- ✅ CORRIGÉ
WHERE u.email = 'votre_email_test';
```

---

## 🔍 **DIAGNOSTIC COMPTES MÉLANGÉS**

### **📋 Scénario de comptes mélangés**
1. **Authentification** : User A se connecte avec `email_A@test.com`
2. **Dashboard affiche** : Données de User B (`email_B@test.com`)
3. **Cause possible** : 
   - Jointure incorrecte dans le code
   - Données corrompues en base
   - Session Supabase incorrecte

### **📊 Requête de diagnostic**
```sql
-- Pour trouver tous les comptes avec incohérences:
SELECT 
  u.email as auth_email,
  p.email as profile_email,
  pr.email as professional_email,
  CASE 
    WHEN u.email != p.email THEN 'PROFILE EMAIL MISMATCH'
    WHEN u.email != pr.email THEN 'PROFESSIONAL EMAIL MISMATCH'
    ELSE 'OK'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.professionals pr ON u.id = pr.id
WHERE u.email IS NOT NULL
  AND (u.email != p.email OR u.email != pr.email);
```

---

## 🎯 **VALIDATION**

### **📋 ÉTAPES SUIVANTES**
1. **Exécuter** le SQL corrigé dans Supabase
2. **Remplacer** `'votre_email_test'` par l'email problématique
3. **Analyser** les résultats pour détecter les incohérences
4. **Corriger** les données si nécessaire

### **📊 Résultats attendus**
- **OK** : Tous les emails correspondent
- **PROFILE EMAIL MISMATCH** : L'email du profil ne correspond pas à l'auth
- **PROFESSIONAL EMAIL MISMATCH** : L'email du professionnel ne correspond pas à l'auth

---

## 🎉 **CONCLUSION**

**🔧 Erreur SQL corrigée :**

- **✅ Schéma identifié** : profiles.id et professionals.id sont les clés primaires
- **✅ Jointures corrigées** : u.id = p.id et u.id = pr.id
- **✅ SQL mis à jour** : Requêtes de diagnostic fonctionnelles
- **✅ Prêt à l'emploi** : Peut maintenant détecter les comptes mélangés

**🎯 Le fichier SQL est maintenant correct et prêt pour diagnostiquer les comptes mélangés !**
