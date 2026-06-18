# Guide de Configuration SMTP avec Resend

## ✅ Configuration Appliquée

La plateforme SwipeTonPro a été configurée pour utiliser **Resend** comme fournisseur SMTP pour l'envoi d'emails d'authentification et de notifications.

---

## 📋 Paramètres Configurés

### 1. Configuration Supabase (Dashboard)

Les paramètres SMTP suivants ont été configurés dans le dashboard Supabase :

**Détails de l'expéditeur :**
- **Adresse e-mail de l'expéditeur** : `noreply@swipetonpro.fr`
- **Nom de l'expéditeur** : `Noreply SwipeTonPro`

**Paramètres du fournisseur SMTP :**
- **Hôte** : `smtp.resend.com`
- **Port** : `465` (SSL/TLS)
- **Nom d'utilisateur** : `resend`
- **Mot de passe** : `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (Clé API Resend)
- **Intervalle minimum par utilisateur** : `1` seconde

### 2. Configuration Application (.env.local)

Les variables d'environnement suivantes ont été mises à jour :

```env
# ===========================================
# CONFIGURATION EMAIL SMTP (RESEND)
# ===========================================
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_SECURE=true

# Adresses email expéditeurs
SMTP_USER_NOREPLY=noreply@swipetonpro.fr
SMTP_USER_SUPPORT=support@swipetonpro.fr
SMTP_USER_TEAM=team@swipetonpro.fr
SMTP_USER_ADMIN=admin@swipetonpro.fr
SMTP_USER_CONTACT=contact@swipetonpro.fr

# Authentification Resend (nom d'utilisateur = "resend", mot de passe = clé API)
SMTP_USER=resend
SMTP_PASSWORD=re_6KxfpXwL_2XSWA7UeuEtqudv6Mdx3yogJ
```

### 3. Code Modifié

Le fichier `src/lib/email.ts` a été mis à jour pour utiliser Resend :

**Changements principaux :**
- Hôte par défaut : `smtp.resend.com` (au lieu de `ssl0.ovh.net`)
- Authentification : Utilise `SMTP_USER` (resend) au lieu de l'adresse email
- Port : `465` avec SSL/TLS activé

---

## 🔑 Informations Importantes

### Authentification Resend

Resend utilise un système d'authentification spécifique :
- **Username** : Toujours `resend`
- **Password** : Votre clé API Resend (commence par `re_`)

### Adresses Email Autorisées

Assurez-vous que les domaines suivants sont vérifiés dans votre compte Resend :
- `swipetonpro.fr`

Les adresses email configurées :
- `noreply@swipetonpro.fr` - Emails d'authentification et notifications
- `support@swipetonpro.fr` - Support client
- `admin@swipetonpro.fr` - Administration
- `contact@swipetonpro.fr` - Contact général
- `team@swipetonpro.fr` - Équipe interne

---

## 🧪 Test de la Configuration

### Script de Test Email

Créez un fichier `test-resend-email.js` pour tester l'envoi :

```javascript
const nodemailer = require('nodemailer');

async function testResendEmail() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.resend.com',
    port: 465,
    secure: true,
    auth: {
      user: 'resend',
      pass: 'YOUR_RESEND_API_KEY', // Remplacez par votre clé API
    },
  });

  try {
    const info = await transporter.sendMail({
      from: '"SwipeTonPro" <noreply@swipetonpro.fr>',
      to: 'test@example.com', // Remplacez par votre email de test
      subject: 'Test Email Resend',
      html: '<h1>Test réussi !</h1><p>Votre configuration Resend fonctionne correctement.</p>',
    });

    console.log('✅ Email envoyé avec succès !');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi:', error);
  }
}

testResendEmail();
```

### Exécution du Test

```bash
node test-resend-email.js
```

---

## 📊 Avantages de Resend

1. **Délivrabilité élevée** : Meilleure réputation IP et infrastructure optimisée
2. **API moderne** : Interface simple et documentation claire
3. **Analytiques** : Suivi des emails envoyés, ouverts, cliqués
4. **Tarification transparente** : Modèle de prix clair et prévisible
5. **Support DNS** : Configuration SPF, DKIM, DMARC facilitée

---

## 🔧 Dépannage

### Erreur : "Authentication failed"

**Cause** : Clé API incorrecte ou expirée

**Solution** :
1. Vérifiez que la clé API commence par `re_`
2. Générez une nouvelle clé API dans le dashboard Resend
3. Mettez à jour `SMTP_PASSWORD` dans `.env.local`

### Erreur : "Sender address not verified"

**Cause** : Le domaine ou l'adresse email n'est pas vérifié dans Resend

**Solution** :
1. Connectez-vous au dashboard Resend
2. Allez dans "Domains" et vérifiez `swipetonpro.fr`
3. Ajoutez les enregistrements DNS requis (SPF, DKIM, DMARC)

### Emails non reçus

**Vérifications** :
1. Consultez les logs Resend pour voir si l'email a été envoyé
2. Vérifiez le dossier spam du destinataire
3. Assurez-vous que les enregistrements DNS sont correctement configurés

---

## 📝 Configuration DNS Recommandée

Pour une délivrabilité optimale, configurez ces enregistrements DNS :

### SPF Record
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
```

### DKIM Record
```
Type: TXT
Name: resend._domainkey
Value: [Fourni par Resend dans le dashboard]
```

### DMARC Record
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:admin@swipetonpro.fr
```

---

## 🔄 Migration depuis OVH

### Changements Effectués

| Paramètre | Ancienne Valeur (OVH) | Nouvelle Valeur (Resend) |
|-----------|----------------------|--------------------------|
| SMTP_HOST | ssl0.ovh.net | smtp.resend.com |
| SMTP_USER | noreply@swipetonpro.fr | resend |
| SMTP_PASSWORD | Mot de passe OVH | Clé API Resend |
| Port | 465 | 465 (inchangé) |

### Rollback (si nécessaire)

Pour revenir à OVH, modifiez `.env.local` :

```env
SMTP_HOST=ssl0.ovh.net
SMTP_PORT=465
SMTP_USER=noreply@swipetonpro.fr
SMTP_PASSWORD=VotreMotDePasseOVH
```

---

## 📞 Support

- **Documentation Resend** : https://resend.com/docs
- **Dashboard Resend** : https://resend.com/dashboard
- **Support Resend** : support@resend.com

---

## ✅ Checklist de Vérification

- [x] Configuration Supabase mise à jour avec les paramètres Resend
- [x] Variables d'environnement `.env.local` configurées
- [x] Code `src/lib/email.ts` modifié pour Resend
- [ ] Domaine `swipetonpro.fr` vérifié dans Resend
- [ ] Enregistrements DNS (SPF, DKIM, DMARC) configurés
- [ ] Test d'envoi d'email réussi
- [ ] Emails d'authentification Supabase fonctionnels

---

**Date de configuration** : 17/06/2026  
**Version** : 1.0  
**Statut** : ✅ Configuration appliquée
