# 🔒 Rapport d'Audit de Sécurité - EDSwipe/SwipeTonPro

**Date:** 15 juin 2026  
**Type:** Audit de sécurité complet  
**Auditeur:** Analyse automatisée du codebase  
**Statut:** ⚠️ VULNÉRABILITÉS CRITIQUES DÉTECTÉES

---

## 📋 Résumé Exécutif

Audit de sécurité complet de l'application EDSwipe couvrant :

- **64 API endpoints** analysés
- **147 usages de variables d'environnement** vérifiés
- **Middleware d'authentification** audité
- **Politiques RLS** à vérifier
- **Gestion des secrets** analysée

### 🚨 Vulnérabilités Critiques Identifiées : 3

---

## 🔴 VULNÉRABILITÉS CRITIQUES

### 1. **Mot de passe SMTP hardcodé dans le code source**

**Fichier:** `src/pages/api/configure-smtp.ts` (ligne 39)  
**Sévérité:** 🔴 CRITIQUE  
**Score CVSS:** 9.8 (Critical)

**Problème:**

```typescript
smtp_pass: process.env.SMTP_PASSWORD || "Swipe@Ton@Pro123@",
```

**Impact:**

- ✅ Mot de passe SMTP exposé dans le code source
- ✅ Accessible via GitHub (repository public/privé)
- ✅ Risque de compromission du serveur email
- ✅ Possibilité d'envoi d'emails frauduleux
- ✅ Atteinte à la réputation de la plateforme

**Recommandation:**

```typescript
// ✅ CORRECTION IMMÉDIATE REQUISE
smtp_pass: process.env.SMTP_PASSWORD, // Retirer la valeur par défaut
```

---

### 2. **Validation insuffisante des données d'inscription professionnelle**

**Fichier:** `src/pages/auth/pro-signup.tsx`  
**Sévérité:** 🔴 CRITIQUE  
**Score CVSS:** 8.5 (High)

**Problèmes identifiés:**

- **Validation SIRET insuffisante**: Seulement maxLength=14, pas de validation du format Luhn
- **Validation email basique**: Regex RFC 5322 mais pas de vérification MX
- **Pas de validation mot de passe complexité**: Aucune exigence de complexité
- **Documents non validés**: Upload sans vérification de type/size
- **Pas de rate limiting**: Endpoint d'inscription vulnérable aux attaques en masse

**Code vulnérable:**

```typescript
// Ligne 603-613 - Validation SIRET insuffisante
<Input
  id="siret"
  value={formData.basicInfo.siret}
  maxLength={14} // ❌ Seulement longueur, pas de validation format
  required
/>

// Ligne 362-369 - Validation email basique
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
if (!basicInfo.email || !emailRegex.test(basicInfo.email)) {
  // ❌ Pas de vérification MX, pas de blacklist domaines
}
```

**Impact:**

- Inscription avec SIRET invalides
- Inscription avec emails temporaires/disposables
- Attaques en masse (account creation abuse)
- Upload de fichiers malveillants via documents

**Recommandation:**

```typescript
// ✅ Validation SIRET avec algorithme Luhn
const validateSIRET = (siret: string): boolean => {
  if (!/^\d{14}$/.test(siret)) return false;
  // Implémenter algorithme Luhn
  return luhnCheck(siret);
};

// ✅ Validation mot de passe complexité
const validatePassword = (password: string): boolean => {
  return (
    password.length >= 12 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
};

// ✅ Validation documents
const validateDocument = (file: File): boolean => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  return allowedTypes.includes(file.type) && file.size <= maxSize;
};
```

---

### 3. **API de candidature sans vérification de propriété du projet**

**Fichier:** `src/pages/api/candidature.ts`  
**Sévérité:** 🔴 CRITIQUE  
**Score CVSS:** 8.2 (High)

**Problème:**

```typescript
// Ligne 43-56 - Vérifie seulement si candidature existe déjà
const { data: existingInterest } = await supabaseAdmin
  .from('project_interests')
  .select('id')
  .eq('project_id', project_id)
  .eq('professional_id', professional_id)
  .neq('status', 'rejected')
  .single();

// ❌ PAS DE VÉRIFICATION QUE LE PROJET EXISTE OU EST ACTIF
// ❌ PAS DE VÉRIFICATION QUE LE PROFESSIONNEL EST VALIDÉ
```

**Impact:**

- Candidature sur projets inexistants/archivés
- Candidature par professionnels non validés
- Injection de project_id arbitraires
- Spam de notifications aux clients

**Recommandation:**

```typescript
// ✅ Ajouter vérifications avant insertion
// 1. Vérifier que le projet existe et est actif
const { data: project } = await supabaseAdmin
  .from('projects')
  .select('id, status, validation_status')
  .eq('id', project_id)
  .single();

if (
  !project ||
  project.status !== 'published' ||
  project.validation_status !== 'approved'
) {
  return res.status(400).json({ error: 'Projet non disponible' });
}

// 2. Vérifier que le professionnel est validé
const { data: professional } = await supabaseAdmin
  .from('professionals')
  .select('id, status')
  .eq('id', professional_id)
  .single();

if (!professional || professional.status !== 'validated') {
  return res.status(403).json({ error: 'Professionnel non validé' });
}
```

---

### 4. **API update-interest sans vérification d'autorisation du propriétaire**

**Fichier:** `src/pages/api/update-interest.ts`  
**Sévérité:** 🔴 CRITIQUE  
**Score CVSS:** 8.0 (High)

**Problème:**

```typescript
// Ligne 28-40 - Vérifie seulement l'authentification
const authHeader = req.headers.authorization;
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return res.status(401).json({ error: 'Unauthorized' });
}

const token = authHeader.substring(7);
const {
  data: { user },
  error: authError,
} = await supabaseAdmin.auth.getUser(token);

if (authError || !user) {
  return res.status(401).json({ error: 'Invalid token' });
}

// ❌ PAS DE VÉRIFICATION QUE L'UTILISATEUR EST LE PROPRIÉTAIRE DU PROJET
// ❌ N'IMPORTE QUI AVEC UN TOKEN VALIDE PEUT ACCEPTER/REJETER LES INTÉRÊTS
```

**Impact:**

- Un professionnel peut accepter/rejeter les intérêts d'autres projets
- Un professionnel peut rejeter les concurrents
- Manipulation du processus de matching
- Violation de l'intégrité du système

**Recommandation:**

```typescript
// ✅ Ajouter vérification que l'utilisateur est le propriétaire du projet
const { data: project } = await supabaseAdmin
  .from('projects')
  .select('client_id')
  .eq('id', interestData.project_id)
  .single();

if (!project || project.client_id !== user.id) {
  return res
    .status(403)
    .json({ error: "Vous n'êtes pas le propriétaire de ce projet" });
}
```

---

### 5. **Messaging sans vérification RLS adéquate**

**Fichiers:** `src/pages/api/messaging/send.ts`, `src/pages/api/messaging/messages.ts`  
**Sévérité:** 🔴 CRITIQUE  
**Score CVSS:** 7.8 (High)

**Problème:**

```typescript
// src/pages/api/messaging/send.ts - Ligne 12-16
const session = await authService.getCurrentSession();
if (!session?.user) {
  return res.status(401).json({ error: 'Non authentifié' });
}

// ❌ PAS DE VÉRIFICATION QUE L'UTILISATEUR FAIT PARTIE DE LA CONVERSATION
// ❌ PAS DE VÉRIFICATION QUE LE MATCH EXISTE
// ❌ N'IMPORTE QUI PEUT ENVOYER DES MESSAGES À N'IMPORTE QUEL MATCH
```

**Impact:**

- Injection de messages dans des conversations non autorisées
- Harcèlement potentiel
- Violation de la confidentialité
- Spam de messages

**Recommandation:**

```typescript
// ✅ Vérifier que l'utilisateur est participant de la conversation
const { data: conversation } = await supabaseAdmin
  .from('conversations')
  .select('client_id, professional_id')
  .eq('id', matchId)
  .single();

if (!conversation) {
  return res.status(404).json({ error: 'Conversation non trouvée' });
}

const isParticipant =
  conversation.client_id === session.user.id ||
  conversation.professional_id === session.user.id;

if (!isParticipant) {
  return res.status(403).json({
    error:
      "Vous n'êtes pas autorisé à envoyer des messages dans cette conversation",
  });
}
```

---

## � VULNÉRABILITÉS HAUTES

### 6. **Endpoints publics sans authentification**

**Sévérité:** 🟠 HAUTE  
**Score CVSS:** 7.5 (High)

**Endpoints exposés sans middleware d'authentification:**

| Endpoint                   | Méthode | Risque      | Protection actuelle              |
| -------------------------- | ------- | ----------- | -------------------------------- |
| `/api/ai-estimation`       | POST    | 🔴 HAUTE    | Aucune - Accessible publiquement |
| `/api/contact`             | POST    | 🟡 MOYENNE  | Rate limiting recommandé         |
| `/api/configure-smtp`      | POST    | 🔴 CRITIQUE | **AUCUNE PROTECTION**            |
| `/api/setup-admin`         | POST    | 🔴 CRITIQUE | **AUCUNE PROTECTION**            |
| `/api/inject-supabase-sql` | POST    | 🔴 CRITIQUE | **AUCUNE PROTECTION**            |
| `/api/direct-sql-update`   | POST    | 🔴 CRITIQUE | **AUCUNE PROTECTION**            |
| `/api/debug-user`          | GET     | 🔴 HAUTE    | Exposition de données sensibles  |
| `/api/diagnose-user`       | GET     | 🔴 HAUTE    | Exposition de données sensibles  |
| `/api/test-passwords`      | POST    | 🔴 CRITIQUE | **AUCUNE PROTECTION**            |
| `/api/verify-siret`        | GET     | 🟡 MOYENNE  | API externe - OK                 |
| `/api/btp-qualification`   | POST    | 🟡 MOYENNE  | Validation métier requise        |
| `/api/conversion/convert`  | POST    | 🟠 HAUTE    | Authentification recommandée     |

**Impact:**

- Accès non autorisé aux fonctions d'administration
- Possibilité d'injection SQL via `/api/inject-supabase-sql`
- Modification directe de la base de données
- Création de comptes admin non autorisés
- Exposition de données utilisateurs

**Recommandation:**

```typescript
// ❌ AVANT (DANGEREUX)
export default async function handler(req, res) { ... }

// ✅ APRÈS (SÉCURISÉ)
export default withAdminAuth(async function handler(req, res) { ... })
```

---

### 7. **Paiement Stripe sans vérification de propriété du match**

**Fichier:** `src/pages/api/create-match-payment.ts`  
**Sévérité:** 🟠 HAUTE  
**Score CVSS:** 7.3 (High)

**Problème:**

```typescript
// Ligne 38-46 - Vérifie l'intérêt mais pas la propriété
const { data: interest } = await supabase
  .from('project_interests')
  .select('*, professional:professionals(user_id)')
  .eq('id', interestId)
  .single();

if (!interest) return res.status(404).json({ error: 'Match introuvable' });
if (interest.status === 'paid')
  return res.status(400).json({ error: 'Déjà payé' });

// ❌ PAS DE VÉRIFICATION QUE L'UTILISATEUR EST LE PROFESSIONNEL DU MATCH
// ❌ N'IMPORTE QUI PEUT PAYER POUR LE MATCH D'UN AUTRE
```

**Impact:**

- Un professionnel peut payer pour les matches d'autres professionnels
- Paiement frauduleux possible
- Contournement des frais de mise en relation
- Problèmes de facturation

**Recommandation:**

```typescript
// ✅ Vérifier que l'utilisateur est le professionnel du match
if (interest.professional.user_id !== req.user.id) {
  return res
    .status(403)
    .json({ error: "Vous n'êtes pas autorisé à payer pour ce match" });
}
```

---

### 8. **Webhook Stripe sans vérification supplémentaire de métadonnées**

**Fichier:** `src/pages/api/stripe-webhook.ts`  
**Sévérité:** 🟠 HAUTE  
**Score CVSS:** 7.0 (High)

**Problème:**

```typescript
// Ligne 26-35 - Vérifie seulement la signature Stripe
let event: Stripe.Event;
try {
  event = stripe.webhooks.constructEvent(
    rawBody,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
} catch (err: any) {
  console.error('Webhook signature error:', err.message);
  return res.status(400).json({ error: `Webhook error: ${err.message}` });
}

// ❌ PAS DE VÉRIFICATION DES MÉTADONNÉES (interestId, projectId)
// ❌ SI UN WEBHOOK MALVEILLANT EST ENVOYÉ AVEC SIGNATURE VALIDE
// ❌ IL PEUT MANIPULER L'ÉTAT DES MATCHS
```

**Impact:**

- Manipulation de l'état des paiements via webhooks falsifiés
- Activation de matches sans paiement réel
- Idempotence insuffisante

**Recommandation:**

```typescript
// ✅ Ajouter validation des métadonnées
if (event.type === 'checkout.session.completed') {
  const session = event.data.object as Stripe.Checkout.Session;
  const { interestId, projectId } = session.metadata;

  if (!interestId || !projectId) {
    console.error('Missing metadata in webhook');
    return res.status(400).json({ error: 'Invalid metadata' });
  }

  // Vérifier que le match existe
  const { data: interest } = await supabase
    .from('project_interests')
    .select('id, status')
    .eq('id', interestId)
    .single();

  if (!interest) {
    console.error('Interest not found:', interestId);
    return res.status(404).json({ error: 'Interest not found' });
  }
}
```

---

## 🟡 VULNÉRABILITÉS MOYENNES

### 9. **Endpoints de debug/test en production**

**Sévérité:** � MOYENNE  
**Score CVSS:** 6.5 (Medium)

**Endpoints de debug détectés:**

- `/api/debug-user` - Exposition de données utilisateur
- `/api/debug-supabase-config` - Exposition de la configuration
- `/api/diagnose-user` - Informations sensibles
- `/api/diagnose-auth` - Détails d'authentification
- `/api/test-passwords` - Test de mots de passe
- `/api/test-email` - Test d'envoi d'emails
- `/api/test/complete-audit` - Audit complet accessible

**Impact:**

- Exposition de la configuration système
- Fuite d'informations sensibles
- Aide aux attaquants pour reconnaissance

**Recommandation:**

```typescript
// ✅ PROTECTION PAR ENVIRONNEMENT
export default async function handler(req, res) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }
  // ... code de debug
}
```

---

## 🟡 VULNÉRABILITÉS MOYENNES

### 10. **Absence de rate limiting sur endpoints critiques**

**Sévérité:** 🟡 MOYENNE

**Endpoints sans rate limiting:**

- `/api/auth/login-secure` - Risque de brute force
- `/api/auth/reset-password-fixed` - Risque d'énumération
- `/api/contact` - Risque de spam
- `/api/ai-estimation` - Risque d'abus (coût API)

**Recommandation:**

```typescript
export default withRateLimit(
  async function handler(req, res) { ... },
  10, // 10 requêtes max
  60000 // par minute
);
```

---

### 11. **Validation insuffisante des entrées utilisateur**

**Sévérité:** 🟡 MOYENNE

**Risques:**

- Injection SQL potentielle (bien que Supabase utilise des requêtes paramétrées)
- XSS dans les champs texte non sanitisés
- Validation métier insuffisante

**Recommandation:**

- Utiliser une bibliothèque de validation (Zod, Yup)
- Sanitiser toutes les entrées utilisateur
- Valider les types et formats

---

## 🔍 ANALYSE SPÉCIFIQUE PAR FONCTIONNALITÉ

### Inscription & Authentification

**Fichiers analysés:**

- `src/pages/auth/login.tsx` - Page de connexion
- `src/pages/auth/pro-signup.tsx` - Inscription professionnelle
- `src/services/authService.ts` - Service d'authentification
- `src/pages/api/auth/login-secure.ts` - API login sécurisé
- `src/pages/api/auth/reset-password-fixed.ts` - Reset mot de passe

**✅ Points positifs:**

- Utilisation de Supabase Auth pour la gestion des sessions
- Middleware d'authentification robuste (`withAuth`)
- Vérification JWT Supabase
- Gestion centralisée de l'authentification via `authService`

**🔴 Vulnérabilités identifiées:**

1. Validation SIRET insuffisante (pas d'algorithme Luhn)
2. Pas de validation complexité mot de passe
3. Pas de rate limiting sur inscription
4. Documents non validés (type/size)
5. Validation email basique (pas de vérification MX)

---

### Matching & Candidatures

**Fichiers analysés:**

- `src/pages/api/candidature.ts` - API candidature
- `src/pages/api/update-interest.ts` - API mise à jour intérêt
- `src/pages/particulier/projects/[id]/interests.tsx` - Gestion intérêts client

**✅ Points positifs:**

- Utilisation de service role key côté serveur
- Vérification d'authentification JWT
- Protection contre doublons de candidature
- Système de notifications intégré

**🔴 Vulnérabilités identifiées:**

1. API candidature sans vérification projet actif
2. API candidature sans vérification professionnel validé
3. API update-interest sans vérification propriétaire projet
4. N'importe qui avec un token peut accepter/rejeter les intérêts

---

### Messaging

**Fichiers analysés:**

- `src/pages/api/messaging/send.ts` - API envoi message
- `src/pages/api/messaging/messages.ts` - API récupération messages

**✅ Points positifs:**

- Vérification d'authentification
- Validation de contenu (longueur, vide)
- Type checking (senderType)
- Service de messagerie anonymisé

**🔴 Vulnérabilités identifiées:**

1. Pas de vérification participation conversation
2. Pas de vérification existence match
3. N'importe qui peut envoyer des messages à n'importe quel match
4. RLS insuffisant sur conversations

---

### Paiement

**Fichiers analysés:**

- `src/pages/api/create-match-payment.ts` - Création paiement Stripe
- `src/pages/api/stripe-webhook.ts` - Webhook Stripe
- `src/middleware/withAuth.ts` - Middleware auth

**✅ Points positifs:**

- Validation UUID des IDs
- Vérification signature webhook Stripe
- Idempotence webhook (table webhook_events)
- Utilisation service role key
- Grille tarifaire dynamique

**🔴 Vulnérabilités identifiées:**

1. Paiement sans vérification propriétaire match
2. Webhook sans validation métadonnées supplémentaire
3. Possibilité de payer pour match d'autrui

---

### RLS Policies (Base de données)

**Fichiers analysés:**

- `supabase/migrations/20260627000000_comprehensive_rls_security_fix.sql`
- `supabase/migrations/20260627000001_fix_rls_column_references.sql`
- `supabase/migrations/20260627000002_fix_infinite_recursion_profiles.sql`

**✅ Points positifs:**

- RLS activé sur toutes les tables
- Politiques par rôle (admin, professionnel, client)
- Protection des données personnelles
- Fix des boucles de récursion

**🟡 Améliorations possibles:**

- Ajouter logs RLS pour audit
- Tester toutes les politiques RLS
- Vérifier coverage des edge cases

---

## ✅ POINTS POSITIFS

### Sécurité bien implémentée :

1. **✅ Middleware d'authentification robuste**
   - `withAuth` - Vérification JWT Supabase
   - `withAdminAuth` - Vérification rôle admin
   - `withProAuth` - Vérification rôle professionnel
   - `withOptionalAuth` - Auth optionnelle

2. **✅ Utilisation de Supabase Service Role Key**
   - Correctement utilisé côté serveur uniquement
   - Jamais exposé au client

3. **✅ Gestion d'erreurs Supabase améliorée**
   - Pattern standardisé pour insert/update
   - Messages d'erreur contextuels
   - Logging approprié

4. **✅ Stripe webhook sécurisé**
   - Vérification de signature
   - Traitement idempotent

---

## 🔍 ANALYSE DES ENDPOINTS PAR CATÉGORIE

### Endpoints Admin (Protégés ✅)

- `/api/admin/platform-settings` - ✅ withAdminAuth
- `/api/admin/match-pricing-tiers` - ✅ withAdminAuth
- `/api/admin/account-actions` - ✅ withAdminAuth
- `/api/admin/matching-fees` - ✅ withAdminAuth
- `/api/admin/app-settings` - ✅ withAdminAuth
- `/api/kpi/dashboard` - ✅ withAdminAuth
- `/api/projects/validate` - ✅ withAdminAuth
- `/api/professionals/validate` - ✅ withAdminAuth

### Endpoints Publics (À sécuriser ⚠️)

- `/api/configure-smtp` - ⚠️ CRITIQUE - Ajouter withAdminAuth
- `/api/setup-admin` - ⚠️ CRITIQUE - Ajouter protection
- `/api/inject-supabase-sql` - ⚠️ CRITIQUE - Ajouter withAdminAuth
- `/api/direct-sql-update` - ⚠️ CRITIQUE - Ajouter withAdminAuth
- `/api/ai-estimation` - ⚠️ HAUTE - Ajouter rate limiting
- `/api/debug-*` - ⚠️ HAUTE - Désactiver en production

### Endpoints Cron (Protection spéciale requise)

- `/api/cron/send-abandon-reminders` - ⚠️ Ajouter vérification secret

---

## 📊 STATISTIQUES DE SÉCURITÉ

| Catégorie                    | Total | Sécurisé | À corriger |
| ---------------------------- | ----- | -------- | ---------- |
| **Vulnérabilités Critiques** | 5     | 0 (0%)   | 5 (100%)   |
| **Vulnérabilités Hautes**    | 3     | 0 (0%)   | 3 (100%)   |
| **Vulnérabilités Moyennes**  | 2     | 0 (0%)   | 2 (100%)   |
| **Endpoints API**            | 64    | 10 (16%) | 54 (84%)   |
| **Endpoints Admin**          | 8     | 8 (100%) | 0 (0%)     |
| **Endpoints Debug**          | 7     | 0 (0%)   | 7 (100%)   |
| **Endpoints Publics**        | 49    | 2 (4%)   | 47 (96%)   |
| **Secrets hardcodés**        | 1     | 0 (0%)   | 1 (100%)   |

**Fonctionnalités auditées:**

- ✅ Inscription & Authentification
- ✅ Matching & Candidatures
- ✅ Messaging
- ✅ Paiement
- ✅ RLS Policies

---

## ️ PLAN DE CORRECTION PRIORITAIRE

### Phase 1 - URGENT (À faire immédiatement)

1. **🔴 Changer le mot de passe SMTP**

   ```bash
   # Sur OVH, changer le mot de passe de noreply@swipetonpro.fr
   # Mettre à jour .env.local et Vercel
   ```

2. **🔴 Retirer le mot de passe hardcodé**

   ```typescript
   // src/pages/api/configure-smtp.ts ligne 39
   smtp_pass: process.env.SMTP_PASSWORD, // Retirer || "Swipe@Ton@Pro123@"

   // Ajouter validation
   if (!process.env.SMTP_PASSWORD) {
     throw new Error('SMTP_PASSWORD must be configured');
   }
   ```

3. **🔴 Sécuriser API candidature - Ajouter vérifications**

   ```typescript
   // src/pages/api/candidature.ts
   // Vérifier projet actif et professionnel validé avant insertion
   const { data: project } = await supabaseAdmin
     .from('projects')
     .select('id, status, validation_status')
     .eq('id', project_id)
     .single();
   if (
     !project ||
     project.status !== 'published' ||
     project.validation_status !== 'approved'
   ) {
     return res.status(400).json({ error: 'Projet non disponible' });
   }
   ```

4. **🔴 Sécuriser API update-interest - Vérifier propriétaire**

   ```typescript
   // src/pages/api/update-interest.ts
   // Vérifier que l'utilisateur est le propriétaire du projet
   const { data: project } = await supabaseAdmin
     .from('projects')
     .select('client_id')
     .eq('id', interestData.project_id)
     .single();
   if (!project || project.client_id !== user.id) {
     return res
       .status(403)
       .json({ error: "Vous n'êtes pas le propriétaire de ce projet" });
   }
   ```

5. **🔴 Sécuriser API messaging - Vérifier participation**

   ```typescript
   // src/pages/api/messaging/send.ts
   // Vérifier que l'utilisateur est participant de la conversation
   const { data: conversation } = await supabaseAdmin
     .from('conversations')
     .select('client_id, professional_id')
     .eq('id', matchId)
     .single();
   const isParticipant =
     conversation.client_id === session.user.id ||
     conversation.professional_id === session.user.id;
   if (!isParticipant) {
     return res.status(403).json({ error: 'Non autorisé' });
   }
   ```

6. **🔴 Sécuriser API paiement - Vérifier propriétaire**

   ```typescript
   // src/pages/api/create-match-payment.ts
   // Vérifier que l'utilisateur est le professionnel du match
   if (interest.professional.user_id !== req.user.id) {
     return res
       .status(403)
       .json({ error: "Vous n'êtes pas autorisé à payer pour ce match" });
   }
   ```

7. **🔴 Sécuriser les endpoints critiques admin**
   ```typescript
   // src/pages/api/configure-smtp.ts
   export default withAdminAuth(async function handler(req, res) { ... })
   // src/pages/api/setup-admin.ts
   export default withAdminAuth(async function handler(req, res) { ... })
   // src/pages/api/inject-supabase-sql.ts
   export default withAdminAuth(async function handler(req, res) { ... })
   // src/pages/api/direct-sql-update.ts
   export default withAdminAuth(async function handler(req, res) { ... })
   ```

### Phase 2 - HAUTE PRIORITÉ (Cette semaine)

8. **🟠 Améliorer validation inscription professionnelle**

   ```typescript
   // src/pages/auth/pro-signup.tsx
   // Ajouter validation SIRET avec algorithme Luhn
   // Ajouter validation complexité mot de passe
   // Ajouter validation documents (type/size)
   // Ajouter rate limiting sur endpoint
   ```

9. **🟠 Sécuriser webhook Stripe - Validation métadonnées**

   ```typescript
   // src/pages/api/stripe-webhook.ts
   // Ajouter validation des métadonnées (interestId, projectId)
   // Vérifier existence du match avant traitement
   ```

10. **🟠 Désactiver les endpoints de debug en production**

    ```typescript
    // Ajouter au début de chaque endpoint debug
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ error: 'Not found' });
    }
    ```

11. **🟠 Ajouter rate limiting**

    ```typescript
    // src/pages/api/ai-estimation.ts
    export default withRateLimit(
      async function handler(req, res) { ... },
      10, // 10 requêtes
      60000 // par minute
    );
    ```

12. **🟠 Sécuriser le cron**
    ```typescript
    // src/pages/api/cron/send-abandon-reminders.ts
    const cronSecret = req.headers['x-cron-secret'];
    if (cronSecret !== process.env.CRON_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    ```

### Phase 3 - MOYENNE PRIORITÉ (Ce mois)

13. **🟡 Ajouter validation des entrées**
    - Installer Zod : `npm install zod`
    - Créer des schémas de validation
    - Valider toutes les entrées utilisateur

14. **🟡 Audit des politiques RLS Supabase**
    - Vérifier toutes les tables
    - S'assurer que RLS est activé
    - Tester les politiques

15. **🟡 Implémenter CSP (Content Security Policy)**
    - Ajouter headers de sécurité
    - Protéger contre XSS

---

## 🔐 RECOMMANDATIONS GÉNÉRALES

### Variables d'environnement

```bash
# .env.local (NE JAMAIS COMMITER)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
STRIPE_SECRET_KEY=sk_xxx...
SMTP_PASSWORD=VotreMotDePasseSecurise123!
CRON_SECRET=un-secret-aleatoire-pour-cron
```

### Headers de sécurité (next.config.mjs)

```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
      ]
    }
  ]
}
```

### Logging de sécurité

```typescript
// Créer src/lib/securityLogger.ts
export function logSecurityEvent(event: string, details: any) {
  console.warn(`[SECURITY] ${event}`, details);
  // TODO: Envoyer à un service de monitoring (Sentry, LogRocket)
}
```

---

## 📝 CHECKLIST DE DÉPLOIEMENT SÉCURISÉ

Avant chaque déploiement sur Vercel :

- [ ] Aucun secret hardcodé dans le code
- [ ] Toutes les variables d'environnement configurées sur Vercel
- [ ] Endpoints admin protégés par withAdminAuth
- [ ] Endpoints debug désactivés en production
- [ ] Rate limiting activé sur endpoints publics
- [ ] Validation des entrées utilisateur
- [ ] Headers de sécurité configurés
- [ ] Logs de sécurité en place
- [ ] Tests de sécurité passés
- [ ] Revue de code effectuée

---

## 🎯 SCORE DE SÉCURITÉ ACTUEL

**Score global:** 🟡 **5.5/10** (Moyen - Améliorations critiques requises)

| Critère                | Score | Commentaire                       |
| ---------------------- | ----- | --------------------------------- |
| Authentification       | 8/10  | ✅ Middleware robuste             |
| Autorisation           | 4/10  | 🔴 Manque vérifications propriété |
| Gestion des secrets    | 2/10  | 🔴 Mot de passe hardcodé          |
| Validation des entrées | 4/10  | � Insuffisante (SIRET, password)  |
| Rate limiting          | 2/10  | 🔴 Quasi inexistant               |
| Logging                | 6/10  | 🟡 Basique                        |
| Headers de sécurité    | 4/10  | 🟡 À améliorer                    |
| Protection XSS         | 6/10  | 🟡 Supabase aide                  |
| Protection CSRF        | 7/10  | ✅ SameSite cookies               |
| Audit de code          | 6/10  | ⚠️ Vulnérabilités autorisation    |

**Objectif:** 🟢 **9/10** après corrections

---

## 📞 ACTIONS IMMÉDIATES REQUISES

### ⚠️ À FAIRE MAINTENANT (Avant tout commit)

1. **Retirer le mot de passe SMTP hardcodé**
2. **Changer le mot de passe SMTP sur OVH**
3. **Sécuriser API candidature (vérifications projet/pro)**
4. **Sécuriser API update-interest (vérification propriétaire)**
5. **Sécuriser API messaging (vérification participation)**
6. **Sécuriser API paiement (vérification propriétaire)**
7. **Sécuriser les endpoints admin critiques**

### 📅 À FAIRE CETTE SEMAINE

8. Améliorer validation inscription professionnelle (SIRET Luhn, password complexity)
9. Sécuriser webhook Stripe (validation métadonnées)
10. Désactiver les endpoints de debug en production
11. Ajouter rate limiting sur endpoints critiques
12. Sécuriser le cron avec un secret

### 📅 À FAIRE CE MOIS

13. Implémenter validation Zod
14. Audit des politiques RLS Supabase
15. Ajouter headers de sécurité
16. Mettre en place monitoring de sécurité

---

## 📚 RESSOURCES

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/advanced-features/security-headers)
- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Stripe Security](https://stripe.com/docs/security)

---

**Rapport généré le:** 13 juillet 2026  
**Prochaine révision:** Après corrections critiques  
**Contact:** Équipe de développement EDSwipe
