# 🔑 Instructions pour réinitialiser le mot de passe admin

## 🚨 Problèmes identifiés

1. **Conflit domaines** : `admin@swipetonpro.fr` vs `admin@swipetonpro.com`
2. **Erreur SQL** : `password_hash` n'existe pas dans `auth.users`

## ✅ Solution correcte

### Étape 1 : Nettoyer les comptes
Exécutez `FIX_ADMIN_CORRECT.sql` dans Supabase SQL Editor pour :
- Supprimer l'ancien compte `.com`
- Garder uniquement le compte `.fr`
- Vérifier les profils

### Étape 2 : Réinitialiser le mot de passe (Méthode officielle)

1. **Allez dans Supabase Dashboard**
2. **Authentication → Users**
3. **Cherchez :** `admin@swipetonpro.fr`
4. **Cliquez sur les 3 points → Reset Password**
5. **Nouveau mot de passe :** `Admin123!`
6. **Cochez "Send password reset email"** ou **"Set password manually"**

### Étape 3 : Confirmer l'accès

- **URL :** `http://localhost:3000/auth/login`
- **Email :** `admin@swipetonpro.fr`
- **Mot de passe :** `Admin123!`

## ⚠️ Pourquoi le SQL ne fonctionne pas

Supabase utilise `encrypted_password` mais cette colonne est gérée en interne.
La réinitialisation doit passer par l'interface Supabase ou l'API Auth.

## 🎯 Résultat attendu

- ✅ Un seul compte admin : `admin@swipotonpro.fr`
- ✅ Mot de passe : `Admin123!`
- ✅ Rôle : `super_admin`
- ✅ Accès dashboard admin fonctionnel
