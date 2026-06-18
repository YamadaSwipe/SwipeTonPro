# 🔧 Guide de Configuration Supabase pour la Réinitialisation de Mot de Passe

## 📋 Problème à résoudre

Les emails de réinitialisation de mot de passe sont envoyés par Supabase au lieu de notre système Resend personnalisé, ce qui crée des liens invalides ou expirés.

## ✅ Étapes de Configuration dans Supabase Dashboard

### 1. Configurer les URL de Redirection

1. Connectez-vous à votre dashboard Supabase: https://app.supabase.com
2. Sélectionnez votre projet: `qhuvnpmqlucpjdslnfui`
3. Allez dans **Authentication** → **URL Configuration**
4. Dans la section **Redirect URLs**, ajoutez les URLs suivantes:

```
https://www.swipetonpro.fr/auth/reset-password
https://www.swipetonpro.fr/**
https://swipetonpro.fr/auth/reset-password
https://swipetonpro.fr/**
http://localhost:3000/auth/reset-password
http://localhost:3000/**
```

5. Dans **Site URL**, configurez:
```
https://www.swipetonpro.fr
```

6. Cliquez sur **Save**

### 2. Désactiver les Emails Automatiques de Supabase

Pour forcer l'utilisation exclusive de Resend:

1. Allez dans **Authentication** → **Email Templates**
2. Trouvez le template **"Reset Password"** (ou "Change Email Request")
3. **Option A - Désactiver complètement:**
   - Décochez "Enable Email Confirmations" si disponible
   
4. **Option B - Modifier le template (si désactivation impossible):**
   - Remplacez le contenu par un message simple indiquant que l'email sera envoyé séparément
   - Ou laissez le template vide

### 3. Configurer les Paramètres d'Email

1. Allez dans **Project Settings** → **Auth**
2. Vérifiez les paramètres suivants:

**Email Auth:**
- ✅ Enable Email Confirmations: **Activé**
- ✅ Enable Email Change Confirmations: **Activé**
- ⚠️ **IMPORTANT:** Assurez-vous que "Secure email change" est **désactivé** pour éviter les doubles emails

**Email Rate Limits:**
- Ajustez si nécessaire pour éviter les blocages

### 4. Vérifier la Configuration SMTP (si utilisée)

Si vous utilisez un SMTP personnalisé dans Supabase:

1. Allez dans **Project Settings** → **Auth** → **SMTP Settings**
2. **RECOMMANDATION:** Laissez vide pour utiliser uniquement Resend via notre API
3. Si configuré, assurez-vous que les paramètres correspondent à votre configuration

## 🔍 Vérification de la Configuration

### Test 1: Vérifier que Resend est utilisé

1. Ouvrez les logs de votre application (Vercel ou local)
2. Demandez une réinitialisation de mot de passe
3. Vérifiez dans les logs:

```
✅ Logs attendus:
📧 Utilisation de Resend pour l'envoi d'email
🔗 URL de redirection configurée: https://www.swipetonpro.fr/auth/reset-password
📧 Envoi email de réinitialisation via Resend à: [email]
✅ Email envoyé avec succès via Resend
```

```
❌ Logs problématiques:
⚠️ RESEND_API_KEY non configurée, utilisation de Supabase (non recommandé)
```

### Test 2: Vérifier le lien reçu

Le lien dans l'email doit ressembler à:
```
✅ BON (lien direct):
https://www.swipetonpro.fr/auth/reset-password#access_token=...&type=recovery

❌ MAUVAIS (passe par Supabase):
https://qhuvnpmqlucpjdslnfui.supabase.co/auth/v1/verify?token=...&redirect_to=...
```

## 🔐 Configuration Resend (Vérification)

### 1. Vérifier la clé API Resend

Dans votre fichier `.env.local`:
```bash
RESEND_API_KEY=re_uDSUn6my_KFG7JVbrxmyMT1ztteQwpj16
```

### 2. Vérifier le domaine dans Resend

1. Connectez-vous à https://resend.com/domains
2. Vérifiez que `swipetonpro.fr` est:
   - ✅ Ajouté
   - ✅ Vérifié (DNS configuré)
   - ✅ Actif

### 3. Tester l'envoi via Resend

Utilisez le script de test:
```bash
node test-resend-email.js
```

## 🚨 Dépannage

### Problème: Les emails passent toujours par Supabase

**Solutions:**
1. Vérifiez que `RESEND_API_KEY` est bien définie dans les variables d'environnement de production (Vercel)
2. Redéployez l'application après avoir modifié les variables d'environnement
3. Vérifiez les logs pour voir quel chemin est emprunté

### Problème: Lien expiré ou invalide

**Solutions:**
1. Les liens de réinitialisation expirent après 1 heure par défaut
2. Vérifiez dans Supabase: **Authentication** → **Auth** → **JWT Expiry**
3. Augmentez si nécessaire (recommandé: 3600 secondes = 1 heure)

### Problème: Erreur "Invalid redirect URL"

**Solutions:**
1. Vérifiez que toutes les URLs sont bien ajoutées dans **Redirect URLs**
2. Assurez-vous qu'il n'y a pas d'espaces ou de caractères invisibles
3. Vérifiez que le protocole (http/https) correspond

## 📝 Checklist de Configuration

- [ ] URLs de redirection ajoutées dans Supabase
- [ ] Site URL configurée
- [ ] Template email Supabase désactivé ou modifié
- [ ] RESEND_API_KEY configurée dans .env.local
- [ ] RESEND_API_KEY configurée dans Vercel (production)
- [ ] Domaine vérifié dans Resend
- [ ] Test d'envoi réussi
- [ ] Logs vérifiés (utilisation de Resend confirmée)
- [ ] Lien reçu par email testé et fonctionnel

## 🎯 Résultat Attendu

Après configuration:
1. ✅ L'utilisateur clique sur "Mot de passe oublié"
2. ✅ Un email est envoyé via Resend (template personnalisé SwipeTonPro)
3. ✅ Le lien pointe directement vers `https://www.swipetonpro.fr/auth/reset-password#access_token=...`
4. ✅ L'utilisateur arrive sur la page de réinitialisation
5. ✅ Le token est valide et la session est créée
6. ✅ L'utilisateur peut changer son mot de passe
7. ✅ Redirection vers la page de connexion

## 📞 Support

Si le problème persiste après avoir suivi ce guide:
1. Vérifiez les logs de l'application
2. Vérifiez les logs Resend: https://resend.com/emails
3. Vérifiez les logs Supabase: Dashboard → Logs
4. Contactez le support si nécessaire
