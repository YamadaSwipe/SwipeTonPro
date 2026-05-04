# 🔧 Configuration Supabase Auth - Réinitialisation Mot de Passe

## Erreur 500 - Solutions

### 1. Vérifier les URL de redirection autorisées

Dans Supabase Dashboard :
1. Allez dans **Authentication > URL Configuration**
2. Vérifiez que ces URLs sont dans la liste **Redirect URLs** :
   ```
   http://localhost:3000/**
   https://www.swipetonpro.com/**
   ```

### 2. Vérifier la configuration Site URL

Dans **Authentication > URL Configuration** :
- **Site URL** : `http://localhost:3000` (dev) ou `https://www.swipetonpro.com` (prod)

### 3. Solution alternative - Réinitialisation manuelle SQL

Si l'email ne fonctionne pas, utilisez ce script SQL directement :

```sql
-- Vérifier l'utilisateur existe
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'admin@swipetonpro.fr';

-- Réinitialiser le mot de passe
UPDATE auth.users 
SET 
  password_hash = crypt('Admin123!', gen_salt('bf')),
  updated_at = NOW()
WHERE email = 'admin@swipetonpro.fr';

-- Confirmer l'email si pas déjà fait
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'admin@swipetonpro.fr';
```

### 4. Créer un nouveau compte admin (si tout échoue)

```sql
-- Supprimer l'ancien compte
DELETE FROM auth.users WHERE email = 'admin@swipetonpro.fr';
DELETE FROM profiles WHERE email = 'admin@swipetonpro.fr';

-- Créer via l'API Supabase ou utiliser le script SQL
```

### 5. Vérifier les logs Supabase

Dans Supabase Dashboard :
1. **Logs > Auth**
2. Cherchez les erreurs liées à `resetPasswordForEmail`

### 6. Test direct de l'API

Testez avec cURL :
```bash
curl -X POST 'https://qhuvnpmqlucpjdslnfui.supabase.co/auth/v1/recover' \
  -H 'apikey: VOTRE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "admin@swipetonpro.fr",
    "options": {
      "redirect_to": "http://localhost:3000/auth/reset-password"
    }
  }'
```

## 🔑 Identifiants de test

Après réinitialisation SQL :
- **Email** : `admin@swipetonpro.fr`
- **Mot de passe** : `Admin123!`
- **URL connexion** : `http://localhost:3000/auth/login`

## ⚠️ Erreurs fréquentes

| Erreur | Cause | Solution |
|--------|-------|----------|
| 500 Internal Server Error | URL non autorisée | Ajouter l'URL dans Supabase Auth settings |
| 400 Bad Request | Format email invalide | Vérifier l'email |
| "User not found" | Email inexistant | Vérifier l'email dans auth.users |
| "Invalid redirect URL" | Domaine non autorisé | Ajouter le domaine dans Redirect URLs |
