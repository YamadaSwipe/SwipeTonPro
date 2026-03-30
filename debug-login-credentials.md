# 🔧 DEBUG - Erreur Login Credentials

---

## ❌ **ERREUR IDENTIFIÉE**

### **🛑 AuthApiError: Invalid login credentials**
```javascript
Error: Invalid login credentials
at async handleLogin (src\pages\auth\login.tsx:35:52)

// Ligne 35:
const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
```

---

## 🔍 **CAUSES POSSIBLES**

### **📋 1. Email/Password incorrects**
- **Email** : Erreur de frappe, n'existe pas
- **Password** : Mot de passe incorrect
- **Cas** : Sensibilité à la casse

### **📋 2. Compte non confirmé**
- **Email non vérifié** : Compte créé mais email non confirmé
- **Statut** : `confirmed_at` = NULL

### **📋 3. Compte suspendu/bloqué**
- **Rôle suspendu** : Utilisateur suspendu dans la base
- **Status** : Compte désactivé

### **📋 4. Problème Supabase**
- **Configuration** : Supabase auth mal configuré
- **URL/KEY** : Mauvaises credentials Supabase

---

## 🛠️ **DIAGNOSTIC IMMÉDIAT**

### **📋 Étape 1: Vérifier le compte dans Supabase**
```sql
-- Remplacer 'votre_email_test' par l'email utilisé
SELECT 
  u.id,
  u.email,
  u.confirmed_at,
  u.last_sign_in_at,
  u.created_at,
  p.role,
  p.email as profile_email
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'votre_email_test';
```

### **📋 Étape 2: Vérifier si l'email existe**
```sql
-- Vérifier si l'email existe dans la base
SELECT 
  email,
  COUNT(*) as count,
  MAX(created_at) as last_created
FROM auth.users 
WHERE email = 'votre_email_test'
GROUP BY email;
```

---

## 🔧 **ACTIONS CORRECTIVES**

### **📋 Si compte non confirmé**
```sql
-- Forcer la confirmation (admin seulement)
UPDATE auth.users 
SET confirmed_at = NOW() 
WHERE email = 'votre_email_test';
```

### **📋 Si mot de passe oublié**
```sql
-- Réinitialiser le mot de passe
-- Utiliser Supabase Dashboard → Authentication → Users
-- → Reset password pour l'utilisateur
```

### **📋 Si compte n'existe pas**
```sql
-- Créer un nouveau compte manuellement
INSERT INTO auth.users (email, confirmed_at, created_at)
VALUES ('votre_email_test', NOW(), NOW());
```

---

## 🎯 **DIAGNOSTIC COMPTES MÉLANGÉS**

### **📋 Utiliser le fichier SQL**
1. **Exécuter** `diagnostic-comptes-definitif.sql`
2. **Remplacer** `'votre_email_test'` par votre email
3. **Analyser** les résultats

### **📊 Résultats attendus**
- **OK** : Emails cohérents
- **EMAIL MISMATCH** : Problème de comptes mélangés détecté

---

## 🎉 **CONCLUSION**

**🔧 Le problème "Invalid login credentials" peut venir de :**

1. **Email/Password incorrects** : Vérifier les credentials
2. **Compte non confirmé** : Confirmer l'email
3. **Comptes mélangés** : Utiliser le diagnostic SQL
4. **Configuration Supabase** : Vérifier les settings

**🎯 Actions immédiates :**
1. **Exécuter** `diagnostic-comptes-definitif.sql`
2. **Vérifier** si votre email existe dans la base
3. **Confirmer** le statut du compte
4. **Réinitialiser** le mot de passe si nécessaire

**✨ Le diagnostic SQL va révéler si c'est un problème de comptes mélangés !**
