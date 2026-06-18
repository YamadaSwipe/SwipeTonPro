# Guide de Configuration - Authentification Google OAuth

## 📋 Vue d'ensemble

Ce guide vous explique comment configurer l'authentification Google OAuth pour SwipeTonPro. Le code de l'application est déjà prêt, il ne reste plus qu'à configurer les services externes.

---

## 🔧 Étape 1 : Configuration Google Cloud Console

### 1.1 Créer/Sélectionner un projet

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Connectez-vous avec votre compte Google
3. En haut à gauche, cliquez sur le sélecteur de projet
4. Cliquez sur **"Nouveau projet"** ou sélectionnez un projet existant
5. Nommez le projet : **"SwipeTonPro"**
6. Cliquez sur **"Créer"**

### 1.2 Activer les APIs nécessaires

1. Dans le menu de gauche, allez dans **"APIs & Services"** > **"Library"**
2. Recherchez et activez les APIs suivantes :
   - **Google+ API** (ou Google People API)
   - **Google OAuth2 API**

### 1.3 Configurer l'écran de consentement OAuth

1. Allez dans **"APIs & Services"** > **"OAuth consent screen"**
2. Sélectionnez **"External"** (pour permettre à tous les utilisateurs de se connecter)
3. Cliquez sur **"Create"**
4. Remplissez les informations :

   **Informations de l'application :**
   - **App name** : `SwipeTonPro`
   - **User support email** : `support@swipetonpro.fr`
   - **App logo** : (optionnel, ajoutez votre logo)
   
   **Domaine de l'application :**
   - **Application home page** : `https://www.swipetonpro.fr`
   - **Application privacy policy link** : `https://www.swipetonpro.fr/legal/privacy`
   - **Application terms of service link** : `https://www.swipetonpro.fr/legal/terms`
   
   **Authorized domains :**
   - `swipetonpro.fr`
   - `supabase.co`
   
   **Developer contact information :**
   - Email : `admin@swipetonpro.fr`

5. Cliquez sur **"Save and Continue"**

6. **Scopes** : Ajoutez les scopes suivants :
   - `email`
   - `profile`
   - `openid`

7. Cliquez sur **"Save and Continue"**

8. **Test users** : (optionnel en mode développement)
   - Ajoutez quelques emails de test si nécessaire

9. Cliquez sur **"Save and Continue"** puis **"Back to Dashboard"**

### 1.4 Créer les identifiants OAuth 2.0

1. Allez dans **"APIs & Services"** > **"Credentials"**
2. Cliquez sur **"+ CREATE CREDENTIALS"** en haut
3. Sélectionnez **"OAuth client ID"**
4. Choisissez **"Web application"**
5. Configurez les paramètres :

   **Name :**
   ```
   SwipeTonPro Web Client
   ```

   **Authorized JavaScript origins :**
   ```
   https://www.swipetonpro.fr
   https://swipetonpro.fr
   http://localhost:3000
   ```

   **Authorized redirect URIs :**
   ```
   https://qhuvnpmqlucpjdslnfui.supabase.co/auth/v1/callback
   http://localhost:54321/auth/v1/callback
   ```

6. Cliquez sur **"Create"**

7. **IMPORTANT** : Une fenêtre s'affiche avec vos identifiants :
   - **Client ID** : Copiez-le (commence par quelque chose comme `123456789-abc...apps.googleusercontent.com`)
   - **Client Secret** : Copiez-le également

   ⚠️ **Conservez ces identifiants en lieu sûr !**

---

## 🔐 Étape 2 : Configuration Supabase

### 2.1 Accéder au Dashboard Supabase

1. Allez sur [Supabase Dashboard](https://supabase.com/dashboard/project/qhuvnpmqlucpjdslnfui)
2. Connectez-vous avec vos identifiants Supabase

### 2.2 Activer le provider Google

1. Dans le menu de gauche, cliquez sur **"Authentication"**
2. Cliquez sur l'onglet **"Providers"**
3. Trouvez **"Google"** dans la liste des providers
4. Cliquez sur **"Google"** pour ouvrir la configuration

### 2.3 Configurer Google OAuth

1. **Activez le toggle** "Enable Sign in with Google"

2. Remplissez les champs :
   - **Client ID (for OAuth)** : Collez le Client ID obtenu de Google Cloud Console
   - **Client Secret (for OAuth)** : Collez le Client Secret obtenu de Google Cloud Console

3. **Redirect URL** : Vérifiez que l'URL affichée est :
   ```
   https://qhuvnpmqlucpjdslnfui.supabase.co/auth/v1/callback
   ```

4. Cliquez sur **"Save"**

### 2.4 Vérifier la configuration

1. Allez dans **"Authentication"** > **"URL Configuration"**
2. Vérifiez que le **Site URL** est configuré :
   ```
   https://www.swipetonpro.fr
   ```

3. Vérifiez les **Redirect URLs** autorisées :
   ```
   https://www.swipetonpro.fr/**
   http://localhost:3000/**
   ```

---

## ✅ Étape 3 : Test de la configuration

### 3.1 Test en local

1. Démarrez votre serveur de développement :
   ```bash
   npm run dev
   ```

2. Ouvrez votre navigateur sur `http://localhost:3000`

3. Allez sur une page de connexion/inscription :
   - `/auth/login`
   - `/particulier/inscription`
   - `/professionnel/inscription`

4. Cliquez sur le bouton **"Se connecter avec Google"** ou **"S'inscrire avec Google"**

5. Vous devriez être redirigé vers la page de connexion Google

6. Après avoir autorisé l'application, vous devriez être redirigé vers `/auth/callback` puis vers le dashboard

### 3.2 Test en production

1. Déployez votre application sur `https://www.swipetonpro.fr`

2. Testez le même processus que ci-dessus

3. Vérifiez que :
   - La redirection vers Google fonctionne
   - L'autorisation est demandée
   - Le retour vers l'application fonctionne
   - Le profil utilisateur est créé
   - La redirection vers le dashboard fonctionne

---

## 🐛 Dépannage

### Erreur : "redirect_uri_mismatch"

**Cause** : L'URL de redirection n'est pas autorisée dans Google Cloud Console

**Solution** :
1. Vérifiez que l'URL de callback Supabase est bien ajoutée dans les "Authorized redirect URIs" de Google Cloud Console
2. L'URL doit être exactement : `https://qhuvnpmqlucpjdslnfui.supabase.co/auth/v1/callback`

### Erreur : "invalid_client"

**Cause** : Le Client ID ou Client Secret est incorrect

**Solution** :
1. Vérifiez que vous avez bien copié le Client ID et Client Secret depuis Google Cloud Console
2. Vérifiez qu'il n'y a pas d'espaces avant ou après les identifiants dans Supabase

### Le bouton ne fait rien

**Cause** : Le provider Google n'est pas activé dans Supabase

**Solution** :
1. Vérifiez que le toggle "Enable Sign in with Google" est bien activé dans Supabase
2. Vérifiez que les identifiants sont bien sauvegardés

### Erreur après la redirection

**Cause** : Problème avec la page de callback

**Solution** :
1. Vérifiez que la page `/auth/callback` existe et fonctionne
2. Vérifiez les logs de la console du navigateur pour plus de détails
3. Vérifiez que le trigger de création de profil fonctionne dans Supabase

---

## 📝 Checklist de configuration

- [ ] Projet Google Cloud créé
- [ ] APIs Google activées (Google+ API, OAuth2 API)
- [ ] Écran de consentement OAuth configuré
- [ ] Identifiants OAuth 2.0 créés
- [ ] Authorized JavaScript origins configurées
- [ ] Authorized redirect URIs configurées
- [ ] Client ID et Client Secret copiés
- [ ] Provider Google activé dans Supabase
- [ ] Client ID ajouté dans Supabase
- [ ] Client Secret ajouté dans Supabase
- [ ] Configuration sauvegardée dans Supabase
- [ ] Test en local réussi
- [ ] Test en production réussi

---

## 🔗 Liens utiles

- **Google Cloud Console** : https://console.cloud.google.com/
- **Supabase Dashboard** : https://supabase.com/dashboard/project/qhuvnpmqlucpjdslnfui
- **Documentation Supabase OAuth** : https://supabase.com/docs/guides/auth/social-login/auth-google
- **Documentation Google OAuth** : https://developers.google.com/identity/protocols/oauth2

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs dans la console du navigateur
2. Vérifiez les logs dans Supabase Dashboard > Logs
3. Consultez la documentation officielle
4. Contactez le support technique

---

## ⚠️ Notes importantes

1. **Sécurité** : Ne partagez jamais votre Client Secret publiquement
2. **Production** : Avant de passer en production, vérifiez que l'écran de consentement OAuth est publié (pas en mode test)
3. **Domaines** : Assurez-vous que tous les domaines utilisés sont autorisés dans Google Cloud Console
4. **HTTPS** : En production, utilisez toujours HTTPS pour les URLs autorisées

---

## 🎉 Félicitations !

Une fois la configuration terminée, vos utilisateurs pourront se connecter et s'inscrire avec leur compte Google en un seul clic !
