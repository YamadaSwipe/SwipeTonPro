# Configuration Resend pour les emails de réinitialisation

## 🚨 Problème résolu
Le système de réinitialisation de mot de passe ne fonctionnait pas car Supabase n'avait pas de configuration SMTP. J'ai ajouté une solution avec Resend.

## 📋 Étapes de configuration

### 1. Créer un compte Resend
1. Allez sur [https://resend.com](https://resend.com)
2. Créez un compte gratuit
3. Vérifiez votre email

### 2. Configurer le domaine d'envoi
1. Dans Resend, allez dans "Domains"
2. Ajoutez `swipetonpro.fr`
3. Ajoutez les enregistrements DNS demandés :
   - TXT record pour la vérification
   - MX record pour la réception
   - DKIM et SPF records pour l'authentification

### 3. Obtenir la clé API
1. Allez dans "API Keys"
2. Créez une nouvelle clé API
3. Copiez la clé (elle commence par `re_`)

### 4. Ajouter la variable d'environnement
Dans votre dashboard Vercel :
1. Allez dans "Settings" → "Environment Variables"
2. Ajoutez :
   - **Name**: `RESEND_API_KEY`
   - **Value**: `re_votre_clé_api`
   - **Environment**: Production, Preview, Development

### 5. Déployer
```bash
git add .
git commit -m "Add Resend email configuration for password reset"
git push origin main
```

## 🧪 Tester

### En développement
1. Démarrez le serveur local : `npm run dev`
2. Allez sur `/auth/forgot-password`
3. Entrez votre email
4. Le lien de réinitialisation s'affichera à l'écran

### En production
1. Déployez sur Vercel
2. Allez sur `https://www.swipetonpro.fr/auth/forgot-password`
3. Entrez votre email
4. Vous devriez recevoir l'email immédiatement

## 🔍 Logs de débogage

Pour vérifier si les emails sont envoyés :
1. Allez dans les logs Vercel
2. Cherchez les messages avec `✅ Email de réinitialisation envoyé`
3. En cas d'erreur, cherchez `❌ Erreur Resend`

## 📧 Template email

L'email envoyé contient :
- Design professionnel avec les couleurs SwipeTonPro
- Bouton de réinitialisation cliquable
- Lien en copier-coller si le bouton ne fonctionne pas
- Avertissement de sécurité
- Mention de validité (1 heure)

## 🚀 Avantages

- **Fiabilité** : Resend est spécialisé dans l'envoi d'emails transactionnels
- **Deliverabilité** : Meilleure réputation IP que les solutions génériques
- **Analytics** : Suivi des ouvertures et clics
- **Simplicité** : Configuration simple, pas de serveur SMTP à gérer

## ⚠️ Notes importantes

- L'API Resend a une limite gratuite de 3000 emails/mois
- Les emails sont envoyés depuis `contact@swipetonpro.fr`
- Le domaine doit être vérifié avant l'envoi
- Les logs sont disponibles dans le dashboard Resend

## 🔧 Dépannage

### Si les emails n'arrivent pas :
1. Vérifiez la variable `RESEND_API_KEY` dans Vercel
2. Vérifiez que le domaine `swipetonpro.fr` est vérifié dans Resend
3. Vérifiez les logs Vercel pour les erreurs
4. Vérifiez le dossier spam

### Si le domaine n'est pas vérifié :
1. Attendez la propagation DNS (peut prendre 24-48h)
2. Vérifiez que tous les enregistrements DNS sont corrects
3. Contactez le support Resend si nécessaire

---

Une fois configuré, le système de réinitialisation de mot de passe fonctionnera parfaitement !
