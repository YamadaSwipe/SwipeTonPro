# Diagnostic - Authentification Google

## Problème identifié
Le bouton de connexion/inscription avec Google existe mais ne fonctionne pas.

## Analyse du code

### 1. Composant GoogleAuthButton (`src/components/GoogleAuthButton.tsx`)
- ✅ Le composant est correctement implémenté
- ✅ Utilise `supabase.auth.signInWithOAuth()` avec le provider 'google'
- ✅ Gère la redirection vers `/auth/callback`
- ✅ Passe le paramètre `userType` dans l'URL de callback

### 2. Page de callback (`src/pages/auth/callback.tsx`)
- ✅ La page de callback existe et gère correctement la session
- ✅ Crée automatiquement le profil si nécessaire
- ✅ Redirige vers le dashboard après authentification

### 3. Configuration Supabase
- ✅ Les clés Supabase sont présentes dans `.env.local`
- ❌ **PROBLÈME IDENTIFIÉ** : Aucune configuration Google OAuth dans Supabase

## Causes probables

### Cause principale : Configuration Google OAuth manquante dans Supabase

Pour que l'authentification Google fonctionne, il faut :

1. **Créer un projet Google Cloud** et obtenir :
   - Client ID OAuth 2.0
   - Client Secret OAuth 2.0

2. **Configurer Supabase** avec ces identifiants :
   - Aller dans le dashboard Supabase
   - Authentication > Providers > Google
   - Activer Google et ajouter les identifiants

3. **Configurer les URLs autorisées** dans Google Cloud Console :
   - Authorized JavaScript origins : `https://www.swipetonpro.fr`
   - Authorized redirect URIs : `https://qhuvnpmqlucpjdslnfui.supabase.co/auth/v1/callback`

## Solution

### Étape 1 : Créer un projet Google Cloud

1. Aller sur https://console.cloud.google.com/
2. Créer un nouveau projet ou sélectionner un projet existant
3. Activer l'API Google+ (Google People API)

### Étape 2 : Créer des identifiants OAuth 2.0

1. Aller dans "APIs & Services" > "Credentials"
2. Cliquer sur "Create Credentials" > "OAuth client ID"
3. Choisir "Web application"
4. Configurer :
   - **Nom** : SwipeTonPro
   - **Authorized JavaScript origins** :
     - `https://www.swipetonpro.fr`
     - `http://localhost:3000` (pour le développement)
   - **Authorized redirect URIs** :
     - `https://qhuvnpmqlucpjdslnfui.supabase.co/auth/v1/callback`
     - `http://localhost:54321/auth/v1/callback` (pour le développement local)

5. Copier le **Client ID** et le **Client Secret**

### Étape 3 : Configurer Supabase

1. Aller sur https://supabase.com/dashboard/project/qhuvnpmqlucpjdslnfui
2. Aller dans "Authentication" > "Providers"
3. Trouver "Google" et cliquer sur "Enable"
4. Coller :
   - **Client ID** : (celui obtenu de Google Cloud)
   - **Client Secret** : (celui obtenu de Google Cloud)
5. Sauvegarder

### Étape 4 : Vérifier la configuration

Une fois configuré, le bouton Google devrait fonctionner et :
1. Rediriger vers la page de connexion Google
2. Demander l'autorisation d'accès
3. Revenir sur `/auth/callback`
4. Créer le profil utilisateur
5. Rediriger vers le dashboard

## URLs importantes

- **Dashboard Supabase** : https://supabase.com/dashboard/project/qhuvnpmqlucpjdslnfui
- **Google Cloud Console** : https://console.cloud.google.com/
- **Callback URL Supabase** : `https://qhuvnpmqlucpjdslnfui.supabase.co/auth/v1/callback`

## Notes

- Le code de l'application est correct et prêt à fonctionner
- Seule la configuration côté Supabase/Google Cloud est manquante
- Une fois configuré, aucune modification de code n'est nécessaire
