# 🚨 RAPPORT D'INCIDENT DE SÉCURITÉ CRITIQUE

**Date:** 19/06/2026 00:20  
**Gravité:** CRITIQUE  
**Statut:** EXPOSITION DE SECRETS CONFIRMÉE

---

## 📋 RÉSUMÉ EXÉCUTIF

GitGuardian a détecté l'exposition de **secrets critiques** dans le dépôt GitHub public. Les clés API et mots de passe suivants ont été compromis et sont actuellement accessibles publiquement dans l'historique Git.

---

## 🔴 SECRETS EXPOSÉS

### 1. **Mot de passe SMTP (OVH)**
- **Valeur exposée:** `[REDACTED_SMTP_PASSWORD]`
- **Fichier:** `.env.local` (ligne 9)
- **Impact:** Accès complet aux comptes email OVH
- **Risque:** Envoi d'emails frauduleux, phishing, usurpation d'identité

### 2. **Supabase Service Role Key (JWT)**
- **Valeur exposée:** `[REDACTED_SUPABASE_SERVICE_ROLE_KEY]`
- **Fichier:** `.env.local` (ligne 26)
- **Impact:** Accès administrateur complet à la base de données
- **Risque:** Lecture/modification/suppression de toutes les données, bypass RLS

### 3. **OpenAI API Key**
- **Valeur exposée:** `[REDACTED_OPENAI_API_KEY]`
- **Fichier:** `.env.local` (ligne 36)
- **Impact:** Utilisation frauduleuse de l'API OpenAI
- **Risque:** Coûts financiers importants, épuisement du quota

### 4. **Stripe Secret Key (LIVE)**
- **Valeur exposée:** `[REDACTED_STRIPE_SECRET_KEY]`
- **Fichier:** `.env.local` (ligne 43)
- **Impact:** Accès complet aux paiements Stripe en production
- **Risque:** Vol de fonds, remboursements frauduleux, accès aux données bancaires

### 5. **GitHub Personal Access Token**
- **Valeur exposée:** `[REDACTED_GITHUB_TOKEN]`
- **Fichier:** `.env.local` (ligne 53)
- **Impact:** Accès complet au dépôt GitHub
- **Risque:** Modification du code, suppression du dépôt, accès aux secrets

### 6. **Mot de passe Admin**
- **Valeur exposée:** `[REDACTED_ADMIN_PASSWORD]`
- **Fichier:** `.env.local` (ligne 59)
- **Impact:** Accès administrateur à l'application
- **Risque:** Contrôle total de la plateforme

### 7. **INSEE API Key**
- **Valeur exposée:** `[REDACTED_INSEE_API_KEY]`
- **Fichier:** `.env.local` (ligne 48)
- **Impact:** Utilisation frauduleuse de l'API INSEE
- **Risque:** Épuisement du quota, blocage du service

---

## 📊 FICHIERS COMPROMIS

### Fichiers contenant des secrets en clair:
1. **`.env.local`** - TOUS LES SECRETS (59 lignes)
2. **Fichiers de documentation (232 occurrences):**
   - `GUIDE_RESET_PASSWORD_SMTP_OVH.md`
   - `CONFIRMATION_RESET_PASSWORD_PRODUCTION.md`
   - `CORRECTION_RESET_PASSWORD_FINALE.md`
   - `DIAGNOSTIC_SMTP_FINAL.md`
   - `SOLUTION_RESET_PASSWORD.md`
   - Et 20+ autres fichiers de documentation

### Problème Git:
- ⚠️ Le fichier `.env.local` est dans `.gitignore` MAIS a été commité avant
- ⚠️ Les secrets sont dans l'historique Git et accessibles publiquement
- ⚠️ Le token GitHub dans l'URL du remote: `https://[REDACTED_GITHUB_TOKEN]@github.com/YamadaSwipe/SwipeTonPro.git`

---

## 🎯 ACTIONS IMMÉDIATES REQUISES (DANS L'ORDRE)

### ⏰ URGENT - À FAIRE MAINTENANT (0-30 minutes)

#### 1. **Révoquer le GitHub Token**
```bash
# Se connecter à GitHub > Settings > Developer settings > Personal access tokens
# Révoquer le token: [REDACTED_GITHUB_TOKEN]
# Créer un nouveau token avec permissions minimales
```

#### 2. **Révoquer la Supabase Service Role Key**
```bash
# Dashboard Supabase > Settings > API
# Générer une nouvelle Service Role Key
# L'ancienne sera automatiquement révoquée
```

#### 3. **Révoquer la Stripe Secret Key**
```bash
# Dashboard Stripe > Developers > API keys
# Cliquer sur "Roll key" pour sk_live_51S5NJsFQMzPDDofJ...
# Mettre à jour immédiatement dans les variables d'environnement
```

#### 4. **Révoquer l'OpenAI API Key**
```bash
# Dashboard OpenAI > API keys
# Révoquer la clé sk-proj-VK2ntffLyZ8s...
# Créer une nouvelle clé avec limites de dépenses
```

#### 5. **Changer le mot de passe SMTP OVH**
```bash
# Manager OVH > Web Cloud > Emails
# Changer le mot de passe pour tous les comptes email
# Nouveau mot de passe: Générer un mot de passe fort (32+ caractères)
```

#### 6. **Changer le mot de passe Admin**
```bash
# Se connecter à l'application
# Changer immédiatement le mot de passe admin@swipetonpro.fr
```

#### 7. **Révoquer l'INSEE API Key**
```bash
# Portail API INSEE
# Révoquer la clé [REDACTED_INSEE_API_KEY]
# Générer une nouvelle clé
```

---

### 🔧 ACTIONS TECHNIQUES (30-60 minutes)

#### 8. **Nettoyer l'historique Git**
```bash
# ATTENTION: Cette opération est destructive et nécessite une coordination d'équipe

# Option 1: Utiliser BFG Repo-Cleaner (RECOMMANDÉ)
git clone --mirror https://github.com/YamadaSwipe/SwipeTonPro.git
java -jar bfg.jar --delete-files .env.local SwipeTonPro.git
cd SwipeTonPro.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force

# Option 2: Utiliser git-filter-repo
git filter-repo --path .env.local --invert-paths
git push --force --all

# Option 3: Si trop complexe, créer un nouveau dépôt
# Créer un nouveau repo GitHub
# Copier uniquement les fichiers nécessaires (sans .git)
# Initialiser un nouveau dépôt Git propre
```

#### 9. **Supprimer les secrets des fichiers de documentation**
```bash
# Rechercher et remplacer tous les secrets dans les fichiers .md
# Remplacer par des placeholders: [REDACTED], [SECRET], etc.
```

#### 10. **Mettre à jour le remote Git**
```bash
# Supprimer le token du remote URL
git remote set-url origin https://github.com/YamadaSwipe/SwipeTonPro.git

# Ou utiliser SSH (RECOMMANDÉ)
git remote set-url origin git@github.com:YamadaSwipe/SwipeTonPro.git
```

---

### 🛡️ ACTIONS DE SÉCURISATION (1-2 heures)

#### 11. **Mettre à jour toutes les variables d'environnement**

**Sur Vercel/Plateforme de déploiement:**
```bash
# Settings > Environment Variables
# Mettre à jour TOUTES les clés compromises
SMTP_PASSWORD=[NOUVEAU_MOT_DE_PASSE_OVH]
SUPABASE_SERVICE_ROLE_KEY=[NOUVELLE_CLE_SUPABASE]
OPENAI_API_KEY=[NOUVELLE_CLE_OPENAI]
STRIPE_SECRET_KEY=[NOUVELLE_CLE_STRIPE]
GITHUB_TOKEN=[NOUVEAU_TOKEN_GITHUB]
INSEE_API_KEY=[NOUVELLE_CLE_INSEE]
```

**Localement (.env.local):**
```bash
# Mettre à jour .env.local avec les nouvelles clés
# NE JAMAIS commiter ce fichier
```

#### 12. **Vérifier .gitignore**
```bash
# S'assurer que .gitignore contient:
.env
.env.local
.env*.local
.env.development
.env.production
*.pem
```

#### 13. **Ajouter pre-commit hooks**
```bash
# Installer git-secrets ou gitleaks
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit "npx gitleaks protect --staged"
```

#### 14. **Redéployer l'application**
```bash
# Après avoir mis à jour toutes les variables d'environnement
# Redéployer pour que les nouvelles clés soient actives
```

---

## 📈 SURVEILLANCE POST-INCIDENT

### Actions de monitoring:

1. **Surveiller les logs Stripe** (48h)
   - Vérifier les transactions suspectes
   - Vérifier les remboursements non autorisés

2. **Surveiller les logs Supabase** (48h)
   - Vérifier les accès non autorisés
   - Vérifier les modifications de données

3. **Surveiller les logs OpenAI** (48h)
   - Vérifier l'utilisation de l'API
   - Vérifier les coûts anormaux

4. **Surveiller les emails OVH** (48h)
   - Vérifier les emails envoyés
   - Vérifier les bounces/spam

5. **Surveiller le dépôt GitHub** (7 jours)
   - Vérifier les commits non autorisés
   - Vérifier les accès au dépôt

---

## 🔍 ANALYSE DES CAUSES RACINES

### Erreurs commises:

1. ❌ **Commit du fichier .env.local dans Git**
   - Le fichier était dans .gitignore mais a été commité avant

2. ❌ **Documentation des secrets en clair**
   - 232 occurrences de secrets dans les fichiers .md

3. ❌ **Token GitHub dans l'URL du remote**
   - Visible dans la configuration Git

4. ❌ **Pas de pre-commit hooks**
   - Aucune vérification automatique des secrets

5. ❌ **Pas de rotation régulière des secrets**
   - Les mêmes clés utilisées depuis longtemps

6. ❌ **Dépôt GitHub public**
   - Les secrets sont accessibles à tous

---

## 📚 BONNES PRATIQUES À ADOPTER

### 1. **Gestion des secrets**
- ✅ Utiliser un gestionnaire de secrets (Vault, AWS Secrets Manager)
- ✅ Ne JAMAIS commiter de fichiers .env
- ✅ Utiliser des placeholders dans la documentation
- ✅ Rotation régulière des secrets (tous les 90 jours)

### 2. **Git**
- ✅ Installer git-secrets ou gitleaks
- ✅ Utiliser pre-commit hooks
- ✅ Scanner régulièrement l'historique Git
- ✅ Utiliser SSH au lieu de HTTPS avec tokens

### 3. **CI/CD**
- ✅ Variables d'environnement dans la plateforme de déploiement
- ✅ Secrets chiffrés dans GitHub Actions
- ✅ Audit logs activés

### 4. **Monitoring**
- ✅ Alertes sur les accès suspects
- ✅ Logs centralisés
- ✅ Revue régulière des accès

---

## 📝 CHECKLIST DE REMÉDIATION

### Immédiat (0-30 min):
- [ ] Révoquer GitHub Token
- [ ] Révoquer Supabase Service Role Key
- [ ] Révoquer Stripe Secret Key
- [ ] Révoquer OpenAI API Key
- [ ] Changer mot de passe SMTP OVH
- [ ] Changer mot de passe Admin
- [ ] Révoquer INSEE API Key

### Court terme (30-60 min):
- [ ] Nettoyer l'historique Git
- [ ] Supprimer secrets des fichiers .md
- [ ] Mettre à jour remote Git
- [ ] Vérifier .gitignore

### Moyen terme (1-2h):
- [ ] Mettre à jour variables d'environnement Vercel
- [ ] Mettre à jour .env.local local
- [ ] Installer pre-commit hooks
- [ ] Redéployer l'application

### Long terme (24-48h):
- [ ] Surveiller logs Stripe
- [ ] Surveiller logs Supabase
- [ ] Surveiller logs OpenAI
- [ ] Surveiller emails OVH
- [ ] Surveiller dépôt GitHub

### Prévention future:
- [ ] Mettre en place git-secrets
- [ ] Documenter les procédures de sécurité
- [ ] Former l'équipe aux bonnes pratiques
- [ ] Audit de sécurité mensuel
- [ ] Rotation automatique des secrets

---

## 🚨 IMPACT ESTIMÉ

### Sévérité: **CRITIQUE**

**Données potentiellement compromises:**
- ✅ Tous les utilisateurs (emails, profils, projets)
- ✅ Toutes les transactions Stripe
- ✅ Tous les emails envoyés
- ✅ Accès administrateur complet

**Coûts potentiels:**
- 💰 Utilisation frauduleuse OpenAI: 0€ - 10,000€+
- 💰 Transactions Stripe frauduleuses: 0€ - 100,000€+
- 💰 Amendes RGPD: 0€ - 20,000,000€ (4% CA)

**Réputation:**
- ⚠️ Perte de confiance des utilisateurs
- ⚠️ Mauvaise publicité
- ⚠️ Impact sur les partenariats

---

## 📞 CONTACTS D'URGENCE

- **Stripe Support:** https://support.stripe.com/
- **Supabase Support:** https://supabase.com/support
- **OpenAI Support:** https://help.openai.com/
- **OVH Support:** https://www.ovh.com/fr/support/
- **GitHub Support:** https://support.github.com/

---

## 📄 CONCLUSION

Cette exposition de secrets est une **violation de sécurité critique** qui nécessite une action immédiate. Tous les secrets doivent être révoqués et remplacés dans les 30 minutes suivant la découverte.

**Prochaines étapes:**
1. Exécuter la checklist de remédiation
2. Surveiller les systèmes pendant 48h
3. Mettre en place les mesures préventives
4. Former l'équipe aux bonnes pratiques
5. Audit de sécurité complet

---

**Rapport généré le:** 19/06/2026 à 00:20  
**Généré par:** Système de sécurité automatisé  
**Niveau de classification:** CONFIDENTIEL
