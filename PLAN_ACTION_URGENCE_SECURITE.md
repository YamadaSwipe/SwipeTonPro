# 🚨 PLAN D'ACTION D'URGENCE - SÉCURITÉ

**Date:** 19/06/2026 00:23  
**Priorité:** CRITIQUE - ACTION IMMÉDIATE REQUISE  
**Temps estimé:** 2-3 heures

---

## ⚡ ACTIONS À FAIRE MAINTENANT (PAR ORDRE DE PRIORITÉ)

### 🔴 ÉTAPE 1: RÉVOQUER TOUTES LES CLÉS (15-20 minutes)

#### A. GitHub Token (URGENT - 2 min)
```
1. Aller sur: https://github.com/settings/tokens
2. Trouver le token: [REDACTED_GITHUB_TOKEN]
3. Cliquer sur "Delete" ou "Revoke"
4. Créer un nouveau token avec permissions minimales (repo uniquement)
5. Sauvegarder le nouveau token dans un gestionnaire de mots de passe
```

#### B. Stripe Secret Key (URGENT - 3 min)
```
1. Aller sur: https://dashboard.stripe.com/apikeys
2. Trouver la clé: sk_live_51S5NJsFQMzPDDofJ...
3. Cliquer sur "Roll key" (cela révoque l'ancienne et crée une nouvelle)
4. Copier la nouvelle clé IMMÉDIATEMENT
5. Mettre à jour dans Vercel/plateforme de déploiement
```

#### C. Supabase Service Role Key (URGENT - 3 min)
```
1. Aller sur: https://supabase.com/dashboard/project/qhuvnpmqlucpjdslnfui/settings/api
2. Section "Service Role Key"
3. Cliquer sur "Generate new key"
4. Copier la nouvelle clé
5. Mettre à jour dans Vercel/plateforme de déploiement
```

#### D. OpenAI API Key (URGENT - 3 min)
```
1. Aller sur: https://platform.openai.com/api-keys
2. Trouver la clé: sk-proj-VK2ntffLyZ8s...
3. Cliquer sur "Revoke"
4. Créer une nouvelle clé
5. IMPORTANT: Définir une limite de dépenses (ex: 50€/mois)
6. Copier la nouvelle clé
```

#### E. Mot de passe SMTP OVH (URGENT - 5 min)
```
1. Aller sur: https://www.ovh.com/manager/web/
2. Section "Emails" > Sélectionner swipetonpro.fr
3. Pour CHAQUE adresse email (noreply, support, team, admin, contact):
   - Cliquer sur "Modifier le mot de passe"
   - Générer un mot de passe fort (32+ caractères)
   - Utiliser le MÊME mot de passe pour tous (comme actuellement)
4. Sauvegarder le nouveau mot de passe
```

#### F. INSEE API Key (MOYEN - 3 min)
```
1. Aller sur: https://api.insee.fr/
2. Section "Mes applications"
3. Révoquer la clé: [REDACTED_INSEE_API_KEY]
4. Générer une nouvelle clé
5. Copier la nouvelle clé
```

#### G. Mot de passe Admin Application (URGENT - 2 min)
```
1. Se connecter sur: https://www.swipetonpro.fr/auth/login
2. Email: admin@swipetonpro.fr
3. Mot de passe actuel: [REDACTED_ADMIN_PASSWORD]
4. Aller dans Profil > Changer le mot de passe
5. Nouveau mot de passe: Générer un mot de passe fort (20+ caractères)
```

---

### 🟠 ÉTAPE 2: METTRE À JOUR LES VARIABLES D'ENVIRONNEMENT (10-15 minutes)

#### Sur Vercel (ou votre plateforme de déploiement):

```bash
# 1. Aller sur le dashboard Vercel
# 2. Sélectionner le projet SwipeTonPro
# 3. Settings > Environment Variables
# 4. Mettre à jour les variables suivantes:

SMTP_PASSWORD=[NOUVEAU_MOT_DE_PASSE_OVH_32_CARACTERES]
SUPABASE_SERVICE_ROLE_KEY=[NOUVELLE_CLE_SUPABASE]
OPENAI_API_KEY=[NOUVELLE_CLE_OPENAI]
STRIPE_SECRET_KEY=[NOUVELLE_CLE_STRIPE]
GITHUB_TOKEN=[NOUVEAU_TOKEN_GITHUB]
INSEE_API_KEY=[NOUVELLE_CLE_INSEE]

# 5. Cliquer sur "Save"
# 6. Redéployer l'application (bouton "Redeploy")
```

#### Localement (.env.local):

```bash
# 1. Ouvrir le fichier .env.local
# 2. Remplacer TOUTES les valeurs compromises
# 3. Sauvegarder le fichier
# 4. NE PAS COMMITER CE FICHIER
```

---

### 🟡 ÉTAPE 3: NETTOYER LE DÉPÔT GIT (30-45 minutes)

#### Option A: Créer un nouveau dépôt (RECOMMANDÉ - Plus simple)

```bash
# 1. Créer un nouveau dépôt GitHub privé
# Nom: SwipeTonPro-Clean
# Visibilité: PRIVATE

# 2. Sur votre machine locale
cd "C:\Users\Mr Reda\Desktop"
mkdir SwipeTonPro-Clean
cd SwipeTonPro-Clean

# 3. Copier tous les fichiers SAUF .git et .env.local
# Utiliser l'explorateur Windows pour copier les fichiers

# 4. Initialiser un nouveau dépôt Git
git init
git add .
git commit -m "Initial commit - Clean repository"

# 5. Ajouter le nouveau remote
git remote add origin https://github.com/YamadaSwipe/SwipeTonPro-Clean.git
git branch -M main
git push -u origin main

# 6. Supprimer l'ancien dépôt GitHub (après vérification)
# GitHub > Settings > Danger Zone > Delete this repository
```

#### Option B: Nettoyer l'historique Git (AVANCÉ)

```bash
# ATTENTION: Cette méthode est plus complexe et risquée

# 1. Installer BFG Repo-Cleaner
# Télécharger depuis: https://rtyley.github.io/bfg-repo-cleaner/

# 2. Créer une sauvegarde
cd "C:\Users\Mr Reda\Desktop"
cp -r EDSwipe-sg-b5032d86-6fd6-4495-abb6-b7751b50ddc1-1772001877-fa7be06 EDSwipe-BACKUP

# 3. Cloner le dépôt en miroir
git clone --mirror https://github.com/YamadaSwipe/SwipeTonPro.git

# 4. Nettoyer les secrets
java -jar bfg.jar --delete-files .env.local SwipeTonPro.git
java -jar bfg.jar --replace-text secrets.txt SwipeTonPro.git

# 5. Nettoyer et pousser
cd SwipeTonPro.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force

# 6. Vérifier que les secrets ont été supprimés
# Utiliser GitHub > Insights > Network pour vérifier l'historique
```

---

### 🟢 ÉTAPE 4: NETTOYER LES FICHIERS DE DOCUMENTATION (20-30 minutes)

#### Script de nettoyage automatique:

Créer un fichier `clean-secrets.js`:

```javascript
const fs = require('fs');
const path = require('path');

const secrets = {
  '[REDACTED_SMTP_PASSWORD]': '[REDACTED_SMTP_PASSWORD]',
  '[REDACTED_SUPABASE_SERVICE_ROLE_KEY]': '[REDACTED_SUPABASE_KEY]',
  '[REDACTED_OPENAI_API_KEY]': '[REDACTED_OPENAI_KEY]',
  '[REDACTED_STRIPE_SECRET_KEY]': '[REDACTED_STRIPE_KEY]',
  '[REDACTED_GITHUB_TOKEN]': '[REDACTED_GITHUB_TOKEN]',
  '[REDACTED_GITHUB_TOKEN]': '[REDACTED_GITHUB_TOKEN]',
  '[REDACTED_ADMIN_PASSWORD]': '[REDACTED_ADMIN_PASSWORD]',
  '[REDACTED_INSEE_API_KEY]': '[REDACTED_INSEE_KEY]'
};

function cleanFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  for (const [secret, replacement] of Object.entries(secrets)) {
    if (content.includes(secret)) {
      content = content.replace(new RegExp(secret, 'g'), replacement);
      modified = true;
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Nettoyé: ${filePath}`);
  }
}

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        scanDirectory(filePath);
      }
    } else if (file.endsWith('.md') || file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx')) {
      cleanFile(filePath);
    }
  }
}

console.log('🧹 Nettoyage des secrets dans les fichiers...');
scanDirectory('.');
console.log('✅ Nettoyage terminé!');
```

Exécuter:
```bash
node clean-secrets.js
```

---

### 🔵 ÉTAPE 5: SÉCURISER POUR L'AVENIR (30-45 minutes)

#### A. Installer Gitleaks (détection de secrets)

```bash
# Installer gitleaks
npm install --save-dev @gitleaks/gitleaks

# Créer .gitleaks.toml
cat > .gitleaks.toml << 'EOF'
title = "Gitleaks Configuration"

[[rules]]
description = "Generic API Key"
regex = '''(?i)(api[_-]?key|apikey|api[_-]?secret)['"]?\s*[:=]\s*['"]?[a-zA-Z0-9_\-]{20,}'''
tags = ["key", "API"]

[[rules]]
description = "Stripe API Key"
regex = '''sk_(test|live)_[0-9a-zA-Z]{24,}'''
tags = ["stripe", "key"]

[[rules]]
description = "OpenAI API Key"
regex = '''sk-[a-zA-Z0-9]{48}'''
tags = ["openai", "key"]

[[rules]]
description = "GitHub Token"
regex = '''ghp_[0-9a-zA-Z]{36}'''
tags = ["github", "token"]

[[rules]]
description = "JWT Token"
regex = '''eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*'''
tags = ["jwt", "token"]
EOF
```

#### B. Installer Husky (pre-commit hooks)

```bash
# Installer husky
npm install --save-dev husky

# Initialiser husky
npx husky install

# Ajouter pre-commit hook
npx husky add .husky/pre-commit "npx gitleaks protect --staged --verbose"

# Rendre le hook exécutable
chmod +x .husky/pre-commit
```

#### C. Mettre à jour .gitignore

```bash
# Ajouter au .gitignore
cat >> .gitignore << 'EOF'

# Secrets et fichiers sensibles
.env
.env.local
.env*.local
.env.development
.env.production
.env.test
*.pem
*.key
*.p12
secrets/
credentials/

# Fichiers de backup
*.backup
*.bak
*~

# Logs sensibles
*.log
logs/
EOF
```

#### D. Créer un fichier .env.example

```bash
# Créer .env.example (sans valeurs réelles)
cat > .env.example << 'EOF'
# ===========================================
# CONFIGURATION EMAIL SMTP (OVH)
# ===========================================
SMTP_HOST=ssl0.ovh.net
SMTP_PORT=465
SMTP_SECURE=true
SMTP_PASSWORD=your_smtp_password_here
SMTP_USER_NOREPLY=noreply@swipetonpro.fr
SMTP_USER_SUPPORT=support@swipetonpro.fr
SMTP_USER_TEAM=team@swipetonpro.fr
SMTP_USER_ADMIN=admin@swipetonpro.fr
SMTP_USER_CONTACT=contact@swipetonpro.fr
SMTP_USER=noreply@swipetonpro.fr

# ===========================================
# SUPABASE CONFIGURATION
# ===========================================
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# ===========================================
# SITE CONFIGURATION
# ===========================================
NEXT_PUBLIC_SITE_URL=https://www.swipetonpro.fr

# ===========================================
# OPENAI CONFIGURATION
# ===========================================
OPENAI_API_KEY=your_openai_api_key_here

# ===========================================
# STRIPE CONFIGURATION
# ===========================================
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here

# ===========================================
# INSEE API
# ===========================================
INSEE_API_KEY=your_insee_api_key_here

# ===========================================
# GITHUB TOKEN
# ===========================================
GITHUB_TOKEN=your_github_token_here
EOF
```

---

## 📊 CHECKLIST DE VÉRIFICATION

### Après avoir terminé toutes les étapes:

- [ ] ✅ Tous les secrets ont été révoqués
- [ ] ✅ Nouvelles clés générées et sauvegardées
- [ ] ✅ Variables d'environnement mises à jour sur Vercel
- [ ] ✅ Variables d'environnement mises à jour localement
- [ ] ✅ Application redéployée avec succès
- [ ] ✅ Dépôt Git nettoyé (nouveau dépôt ou historique nettoyé)
- [ ] ✅ Fichiers de documentation nettoyés
- [ ] ✅ Gitleaks installé et configuré
- [ ] ✅ Husky pre-commit hooks installés
- [ ] ✅ .gitignore mis à jour
- [ ] ✅ .env.example créé
- [ ] ✅ Tests de l'application (connexion, paiements, emails)

---

## 🔍 TESTS POST-REMÉDIATION

### 1. Tester l'application

```bash
# Démarrer l'application localement
npm run dev

# Tester:
# - Connexion admin
# - Envoi d'email (reset password)
# - Paiement Stripe (mode test)
# - Estimation IA
# - API INSEE
```

### 2. Vérifier les logs

```bash
# Stripe Dashboard > Logs
# Vérifier qu'il n'y a pas d'erreurs d'authentification

# Supabase Dashboard > Logs
# Vérifier qu'il n'y a pas d'erreurs d'authentification

# OpenAI Dashboard > Usage
# Vérifier qu'il n'y a pas d'utilisation suspecte

# OVH Manager > Emails > Logs
# Vérifier qu'il n'y a pas d'emails suspects
```

---

## 📞 EN CAS DE PROBLÈME

### Si l'application ne fonctionne plus après les changements:

1. **Vérifier les variables d'environnement**
   ```bash
   # Sur Vercel
   # Settings > Environment Variables
   # Vérifier que toutes les variables sont présentes
   ```

2. **Vérifier les logs de déploiement**
   ```bash
   # Vercel > Deployments > Logs
   # Chercher les erreurs
   ```

3. **Rollback si nécessaire**
   ```bash
   # Vercel > Deployments
   # Cliquer sur le déploiement précédent
   # Cliquer sur "Promote to Production"
   ```

4. **Contacter le support**
   - Stripe: https://support.stripe.com/
   - Supabase: https://supabase.com/support
   - Vercel: https://vercel.com/support

---

## 🎯 RÉSUMÉ DES PRIORITÉS

### 🔴 CRITIQUE (À faire dans les 30 minutes):
1. Révoquer GitHub Token
2. Révoquer Stripe Secret Key
3. Révoquer Supabase Service Role Key
4. Révoquer OpenAI API Key
5. Changer mot de passe SMTP
6. Mettre à jour variables d'environnement Vercel
7. Redéployer l'application

### 🟠 IMPORTANT (À faire dans les 2 heures):
8. Nettoyer le dépôt Git
9. Nettoyer les fichiers de documentation
10. Mettre à jour .env.local local

### 🟡 RECOMMANDÉ (À faire dans les 24 heures):
11. Installer Gitleaks
12. Installer Husky
13. Mettre à jour .gitignore
14. Créer .env.example
15. Tester l'application complètement

---

**Bon courage! N'hésitez pas à demander de l'aide si nécessaire.**
