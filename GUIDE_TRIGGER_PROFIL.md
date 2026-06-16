# 📋 Guide d'Utilisation - Trigger Automatique de Création de Profil

## 🎯 Objectif

Ce guide explique comment configurer et utiliser le trigger PostgreSQL qui crée automatiquement un profil utilisateur dans votre base de données dès qu'un utilisateur s'inscrit via Supabase Auth.

---

## ✨ Fonctionnalités

✅ **Création automatique du profil** lors de l'inscription  
✅ **Attribution intelligente du rôle** (artisan ou recruteur)  
✅ **Création automatique dans la table `professionals`** pour les artisans  
✅ **Attribution de 3 crédits gratuits** aux nouveaux professionnels  
✅ **Gestion des erreurs** sans bloquer l'inscription  
✅ **Support des emails admin** (@swipetonpro.fr/com)

---

## 📦 Installation

### Option 1 : Via Migration Supabase (Recommandé)

Le fichier de migration est déjà créé dans votre projet :

```
supabase/migrations/20260616120000_auto_create_profile_with_role.sql
```

**Pour l'appliquer :**

1. Si vous utilisez Supabase CLI :
   ```bash
   supabase db push
   ```

2. Si vous utilisez l'interface Supabase :
   - Allez dans votre projet Supabase
   - Cliquez sur "Database" → "Migrations"
   - La migration sera automatiquement détectée et appliquée

### Option 2 : Application Manuelle via SQL Editor

1. Ouvrez le fichier `TRIGGER_AUTO_PROFIL.sql`
2. Copiez tout le contenu
3. Connectez-vous à votre projet Supabase
4. Allez dans **SQL Editor**
5. Collez le script et cliquez sur **Run**

---

## 🔧 Comment ça fonctionne ?

### Schéma de fonctionnement

```
Inscription utilisateur (auth.users)
         ↓
    TRIGGER activé
         ↓
Fonction handle_new_user()
         ↓
    ┌─────────────────────┐
    │ Analyse métadonnées │
    └─────────────────────┘
         ↓
    ┌─────────────────────┐
    │ Détermine le rôle   │
    └─────────────────────┘
         ↓
    ┌─────────────────────┐
    │ Crée profil (profiles)│
    └─────────────────────┘
         ↓
    Si rôle = professional
         ↓
    ┌─────────────────────┐
    │ Crée entrée         │
    │ (professionals)     │
    │ + 3 crédits gratuits│
    └─────────────────────┘
```

### Logique d'attribution des rôles

Le trigger détermine le rôle selon cet ordre de priorité :

1. **Rôle explicite** dans les métadonnées (`role`)
2. **Type d'utilisateur** dans les métadonnées (`user_type`) :
   - `'professional'`, `'artisan'`, `'professionnel'` → rôle `professional`
   - `'client'`, `'recruteur'`, `'particulier'` → rôle `client`
3. **Email admin** :
   - `@swipetonpro.fr` ou `@swipetonpro.com` → rôle `admin`
   - Emails spécifiques → rôle `super_admin`
4. **Par défaut** → rôle `client`

---

## 💻 Utilisation dans votre Code

### Inscription d'un Artisan/Professionnel

```javascript
import { supabase } from './supabaseClient';

const inscriptionArtisan = async () => {
  const { data, error } = await supabase.auth.signUp({
    email: 'artisan@example.com',
    password: 'MotDePasseSecurise123!',
    options: {
      data: {
        user_type: 'professional',      // ← Important : définit le type
        full_name: 'Jean Dupont',
        phone: '0612345678',
        company_name: 'Entreprise Dupont SARL',
        siret: '12345678901234'
      }
    }
  });

  if (error) {
    console.error('Erreur inscription:', error.message);
    return;
  }

  console.log('Artisan inscrit avec succès !', data);
  // Le profil et l'entrée professionals sont créés automatiquement
  // L'artisan reçoit 3 crédits gratuits
};
```

### Inscription d'un Recruteur/Client

```javascript
import { supabase } from './supabaseClient';

const inscriptionClient = async () => {
  const { data, error } = await supabase.auth.signUp({
    email: 'client@example.com',
    password: 'MotDePasseSecurise123!',
    options: {
      data: {
        user_type: 'client',           // ← Important : définit le type
        full_name: 'Marie Martin',
        phone: '0698765432'
      }
    }
  });

  if (error) {
    console.error('Erreur inscription:', error.message);
    return;
  }

  console.log('Client inscrit avec succès !', data);
  // Le profil est créé automatiquement avec le rôle 'client'
};
```

### Exemple avec React/Next.js

```typescript
// src/pages/inscription.tsx
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function InscriptionPage() {
  const [userType, setUserType] = useState<'professional' | 'client'>('client');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    company_name: '',
    siret: ''
  });

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    const signUpData: any = {
      user_type: userType,
      full_name: formData.full_name,
      phone: formData.phone
    };

    // Ajouter les données spécifiques aux professionnels
    if (userType === 'professional') {
      signUpData.company_name = formData.company_name;
      signUpData.siret = formData.siret;
    }

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: { data: signUpData }
    });

    if (error) {
      alert('Erreur : ' + error.message);
      return;
    }

    alert('Inscription réussie ! Vérifiez votre email.');
  };

  return (
    <form onSubmit={handleSignUp}>
      {/* Formulaire d'inscription */}
      <select value={userType} onChange={(e) => setUserType(e.target.value as any)}>
        <option value="client">Je suis un particulier/recruteur</option>
        <option value="professional">Je suis un artisan</option>
      </select>
      {/* Autres champs du formulaire */}
    </form>
  );
}
```

---

## 🔍 Vérification de l'Installation

### Vérifier que le trigger est installé

Exécutez cette requête SQL dans le SQL Editor de Supabase :

```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

**Résultat attendu :** Une ligne avec les informations du trigger.

### Vérifier que la fonction existe

```sql
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';
```

**Résultat attendu :** Une ligne avec le nom de la fonction et son code source.

### Tester le trigger

1. Inscrivez un utilisateur test via votre application
2. Vérifiez dans la table `profiles` :

```sql
SELECT id, email, full_name, role 
FROM profiles 
WHERE email = 'votre-email-test@example.com';
```

3. Si c'est un professionnel, vérifiez dans `professionals` :

```sql
SELECT user_id, company_name, credits_balance, status 
FROM professionals 
WHERE user_id = (SELECT id FROM profiles WHERE email = 'votre-email-test@example.com');
```

---

## 🛠️ Dépannage

### Problème : Le profil n'est pas créé automatiquement

**Solutions :**

1. Vérifiez que le trigger est bien installé (voir section Vérification)
2. Consultez les logs PostgreSQL pour voir les erreurs :
   ```sql
   SELECT * FROM pg_stat_statements WHERE query LIKE '%handle_new_user%';
   ```
3. Vérifiez que les métadonnées sont bien passées lors de l'inscription

### Problème : Le rôle n'est pas correct

**Solutions :**

1. Vérifiez que vous passez bien `user_type` dans les métadonnées
2. Vérifiez l'orthographe : `'professional'`, `'client'`, etc.
3. Consultez les logs avec :
   ```sql
   SELECT * FROM auth.users WHERE email = 'votre-email@example.com';
   ```
   Puis vérifiez la colonne `raw_user_meta_data`

### Problème : L'entrée professionals n'est pas créée

**Solutions :**

1. Vérifiez que `user_type` est bien `'professional'` ou `'artisan'`
2. Vérifiez les contraintes de la table `professionals` (SIRET unique, etc.)
3. Consultez les warnings PostgreSQL

---

## 📊 Données Créées Automatiquement

### Pour un Artisan/Professionnel

**Table `profiles` :**
- `id` : UUID de l'utilisateur
- `email` : Email fourni
- `full_name` : Nom complet
- `phone` : Téléphone
- `role` : `'professional'`

**Table `professionals` :**
- `user_id` : Référence vers profiles.id
- `siret` : SIRET fourni ou `'EN_ATTENTE'`
- `company_name` : Nom de l'entreprise
- `status` : `'pending'` (en attente de validation)
- `credits_balance` : `3` (crédits gratuits)

### Pour un Client/Recruteur

**Table `profiles` :**
- `id` : UUID de l'utilisateur
- `email` : Email fourni
- `full_name` : Nom complet
- `phone` : Téléphone
- `role` : `'client'`

---

## 🔐 Sécurité

- La fonction utilise `SECURITY DEFINER` pour s'exécuter avec les privilèges du créateur
- Les erreurs sont loggées mais ne bloquent pas l'inscription
- Un profil de secours est créé en cas d'erreur critique
- Les métadonnées sont validées avant utilisation

---

## 📝 Notes Importantes

1. **Métadonnées obligatoires** : Assurez-vous de toujours passer `user_type` lors de l'inscription
2. **Crédits gratuits** : Les professionnels reçoivent automatiquement 3 crédits
3. **Statut initial** : Les professionnels sont en statut `'pending'` par défaut
4. **Emails admin** : Les emails @swipetonpro.fr/com sont automatiquement admin

---

## 🆘 Support

Si vous rencontrez des problèmes :

1. Consultez les logs PostgreSQL dans Supabase
2. Vérifiez la section Dépannage ci-dessus
3. Consultez la documentation Supabase : https://supabase.com/docs

---

## 📄 Fichiers Associés

- **Migration** : `supabase/migrations/20260616120000_auto_create_profile_with_role.sql`
- **Script SQL** : `TRIGGER_AUTO_PROFIL.sql`
- **Guide** : `GUIDE_TRIGGER_PROFIL.md` (ce fichier)

---

**Dernière mise à jour** : 16 juin 2026  
**Version** : 1.0
