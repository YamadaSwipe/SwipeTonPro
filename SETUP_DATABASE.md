# 🗄️ Configuration Base de Données Supabase

## 📋 État Actuel
- ✅ Connexion Supabase établie
- ✅ Variables d'environnement configurées
- ❌ Tables de données manquantes (erreur 404)

## 🚀 Solution Immédiate

### Option 1: Via l'interface Supabase (Recommandé)

1. **Allez sur votre dashboard** : https://supabase.com/dashboard
2. **Sélectionnez votre projet** : `qhuvnpmqlucpjdslnfui`
3. **Allez dans SQL Editor** dans le menu latéral
4. **Copiez-collez** le contenu du fichier : `supabase/migrations/001_initial_schema.sql`
5. **Cliquez sur "Run"** pour exécuter le script

### Option 2: Via CLI Supabase

```bash
# Installer la CLI si nécessaire
npm install -g supabase

# Se connecter
supabase login

# Lier le projet
supabase link --project-ref qhuvnpmqlucpjdslnfui

# Appliquer la migration
supabase db push
```

## 📊 Ce que le script crée :

### Tables principales :
- `profiles` : Profils utilisateurs
- `professionals` : Informations professionnels
- `projects` : Projets clients
- `bids` : Candidatures
- `conversations` : Messagerie
- `messages` : Messages
- `documents` : Documents vérification
- `credit_transactions` : Transactions crédits
- `reviews` : Avis clients

### Tables admin :
- `permissions` : Permissions admin
- `admin_actions` : Actions admin
- `platform_settings` : Paramètres plateforme
- `notifications` : Notifications

### Fonctionnalités incluses :
- ✅ Row Level Security (RLS)
- ✅ Indexes optimisés
- ✅ Triggers auto-update
- ✅ Données initiales
- ✅ Enums et contraintes

## ⚡ Après l'exécution :

1. **Redémarrez votre serveur** : `npm run dev`
2. **Testez la connexion** : http://localhost:3000/debug
3. **Créez un compte** sur la page d'inscription
4. **Vérifiez que tout fonctionne** sans erreurs 404

## 🔧 Si vous rencontrez des problèmes :

- **Erreur de permission** : Assurez-vous d'être admin sur le projet Supabase
- **Script trop long** : Exécutez par sections si nécessaire
- **Tables existantes** : Drop les tables avant de recréer

## 📞 Besoin d'aide ?

Le script est prêt à être exécuté. Une fois appliqué, toutes les erreurs 404 disparaîtront et votre application sera fully fonctionnelle !
