# 🔄 WORKFLOW OFFICIEL COMPLET - VERSION 4

---

## 📋 **WORKFLOW AVEC GESTION PAIEMENT REFUSÉ**

---

## 🚀 **PHASE 1 - DÉPÔT ET QUALIFICATION PROJET**

### **Étape 1 - Projet déposé**
- **Particulier** : Dépose un projet sur la plateforme
- **Statut** : "Projet déposé"
- **Action** : Notification équipe TEAM

### **Étape 2 - Appel équipe TEAM**
- **Équipe TEAM** : Reçoit notification de nouveau projet
- **Action** : Qualification des informations du projet
- **Outils** : Interface CRM pour qualification

### **Étape 3 - Badge CRM Qualifier**
- **Équipe TEAM** : Attribue badge "Qualifier" OUI ou NON
- **Si NON** : Projet refusé, notification particulier
- **Si OUI** : Passe à l'étape suivante

### **Étape 4 - Projet validé par équipe support**
- **Équipe Support** : Validation finale du projet
- **Action** : Vérification finale et approbation
- **Statut** : "Projet validé"

### **Étape 5 - Projet en ligne**
- **Système** : Publication automatique du projet
- **Statut** : "Projet en ligne"
- **Action** : Visible par tous les professionnels

---

## 🔍 **PHASE 2 - INTÉRÊT DES PROFESSIONNELS**

### **Étape 6 - PRO porte intérêt**
- **Professionnel** : Consulte les projets en ligne
- **Action** : Pose sa candidature "Ça m'intéresse"
- **Statut** : "Candidature reçue"

### **Étape 7 - Particulier consulte les PRO intéressés**
- **Particulier** : Reçoit notification des candidatures
- **Action** : Consulte la liste des PRO intéressés
- **Options** :
  - **Option A** : Déclenche mini chat bridé
  - **Option B** : Valide directement le PRO

---

## 💬 **PHASE 3 - CHAT BRIDÉ ET MATCHING**

### **Étape 8 - Mini chat bridé**
- **Particulier** : Déclenche chat limité (3 messages max)
- **PRO** : Reçoit chat bridé
- **Limites** : Coordonnées masquées, 3 messages maximum

### **Étape 9 - Validation PRO / Match**
- **Particulier** : Valide le PRO choisi
- **Système** : Match effectué entre particulier et PRO
- **Statut** : "Match effectué"

---

## 💳 **PHASE 4 - PAIEMENT MISE EN RELATION**

### **Étape 10 - PRO doit payer**
- **PRO** : Reçoit notification de paiement requis
- **Montant** : Calculé selon estimation IA (paliers)
- **Paliers** :
  - < €500 → €10
  - €500-1000 → €20
  - €1000-2000 → €30
  - €2000-5000 → €50
  - > €5000 → €100

### **Étape 11 - Traitement paiement**
- **Si paiement accepté** : Passe à l'étape 12 (Chat complet)
- **Si paiement refusé/échoue** : **Passe à l'étape 11A**

---

## 🔄 **ÉTAPE 11A - PAIEMENT REFUSÉ - CHOIX PARTICULIER**

### **Interface de décision pour le particulier**
```
┌─────────────────────────────────────┐
│ 💳 Paiement échoué                   │
│ 📄 PRO : Jean Dupont (Électricien)   │
│ 💰 Montant : €30                     │
│ ❌ Statut : Paiement refusé           │
├─────────────────────────────────────┤
│ 🤔 Que souhaitez-vous faire ?         │
│                                     │
│ [⏳ ATTENDRE UNE AUTRE TENTATIVE]   │
│                                     │
│ [❌ REFUSER ET CHOISIR UN AUTRE PRO] │
└─────────────────────────────────────┘
```

### **Option 1 - Attendre une autre tentative**
- **Action** : Particulier clique sur "ATTENDRE"
- **Conséquence** : 
  - PRO reçoit notification "Le particulier attend une nouvelle tentative de paiement"
  - PRO peut retenter le paiement immédiatement ou plus tard
  - Statut du projet : "En attente de paiement (retentative)"
  - **Si nouvelle tentative échoue** : Repasse par l'étape 11A

### **Option 2 - Refuser et choisir un autre PRO**
- **Action** : Particulier clique sur "REFUSER ET CHOISIR UN AUTRE PRO"
- **Conséquences** :
  - PRO actuel reçoit notification "Le particulier a refusé votre candidature suite à l'échec du paiement"
  - Match avec ce PRO est annulé
  - Particulier retourne à l'étape 7 (consultation des PRO intéressés)
  - Peut sélectionner un autre PRO parmi les candidatures restantes
  - **Si plus de PRO disponibles** : Retour à l'étape 6 (attente nouvelles candidatures)

---

## 📊 **NOTIFICATIONS AUTOMATIQUES**

### **Notification au PRO (paiement refusé)**
```
📧 Email/Notification App
Objet : Échec de paiement - Action requise

Bonjour [PRO],

Le paiement pour la mise en relation avec [Particulier] a échoué.

Le particulier a choisi d'attendre une nouvelle tentative.
Vous pouvez retenter le paiement à tout moment depuis votre dashboard.

Montant : €XX
Projet : [Titre projet]
Date : [Date]

Cordialement,
L'équipe SwipeTonPro
```

### **Notification au PRO (refusé)**
```
📧 Email/Notification App
Objet : Candidature refusée

Bonjour [PRO],

Suite à l'échec du paiement, le particulier [Particulier] a refusé votre candidature.

Votre candidature pour le projet [Titre projet] est annulée.

Nous vous invitons à consulter d'autres projets disponibles.

Cordialemeent,
L'équipe SwipeTonPro
```

### **Notification au particulier (nouvelle tentative)**
```
📧 Email/Notification App
Objet : Nouvelle tentative de paiement possible

Bonjour [Particulier],

Le PRO [PRO] est prêt à retenter le paiement pour votre projet [Titre projet].

Vous pouvez suivre l'état depuis votre dashboard.

Montant : €XX
PRO : [PRO]
Projet : [Titre projet]

Cordialement,
L'équipe SwipeTonPro
```

---

## 💬 **PHASE 5 - CHAT COMPLET DÉBLOQUÉ**

### **Étape 12 - Chat complet débloqué**
- **Système** : Déblocage automatique après paiement accepté
- **Accès** : Chat complet et informations privées du PRO
- **Données déverrouillées** :
  - Coordonnées complètes du PRO
  - Historique d'expérience
  - Avis et évaluations
  - Certifications

---

## 🏗️ **PHASE 6 - DÉROULEMENT DES TRAVAUX**

### **Étape 13 - Devis reçu**
- **Particulier** : Reçoit le devis détaillé du PRO
- **Dashboard** : Affichage "Devis reçu"
- **Action** : Consultation du devis

### **Étape 14 - Devis validé**
- **Particulier** : Valide le devis
- **Dashboard** : Information dans dashboard
- **Option acompte** : Les parties décident si OUI ou NON

### **Étape 15 - Début travaux**
- **Statut** : "Travaux en cours"
- **Dashboard** : Mise à jour du statut
- **Action** : Suivi du projet en temps réel

### **Étape 16 - Fin travaux**
- **Particulier** : Déclare la fin des travaux
- **Statut** : "Fin travaux"
- **Action** : Validation de la réalisation

### **Étape 17 - Projet terminé**
- **Système** : Clôture automatique du projet
- **Statut** : "Projet terminé"
- **Actions finales** :
  - Archivage du projet
  - Possibilité d'évaluer le PRO
  - Génération facture finale

---

## 📊 **DASHBOARD PARTICULIER - AVEC GESTION PAIEMENT**

```
┌─────────────────────────────────────┐
│ 🏠 Projet : Rénovation cuisine      │
│ 💰 Estimation IA : €1800             │
├─────────────────────────────────────┤
│ 💬 Messages Pro X (2/3)             │
│ 🔓 Débloquer chat complet (€30)      │
│ 📋 Palier : €1000-2000 = €30      │
├─────────────────────────────────────┤
│ 📊 Statut : En attente paiement     │
│ ⏳ PRO retente paiement...         │
│ 🔄 [Changer de PRO]                 │
├─────────────────────────────────────┤
│ 📅 Début travaux : [Définir]       │
│ 🏁 Fin travaux : [Définir]         │
└─────────────────────────────────────┘
```

---

## 🔄 **WORKFLOW VISUEL COMPLET AVEC GESTION PAIEMENT**

```
📝 Projet déposé
    ↓
👥 Équipe TEAM qualifie
    ↓
✅ Badge CRM (OUI/NON)
    ↓
🛡️ Équipe Support valide
    ↓
🌐 Projet en ligne
    ↓
👨‍🔧 PRO pose "Ça m'intéresse"
    ↓
👤 Particulier consulte les PRO
    ↓
💬 Mini chat bridé OU Validation directe
    ↓
🎯 Match effectué
    ↓
💳 PRO paie (selon estimation IA)
    ↓
┌─────────────────────┐
│ ✅ Paiement accepté │ → 💬 Chat complet → 📄 Devis → 🏗️ Travaux → 🎉 Terminé
└─────────────────────┘
        ↓
┌─────────────────────┐
│ ❌ Paiement refusé  │ → 🤔 Choix particulier :
│                     │   ⏳ Attendre tentative → 💳 Retenter paiement
│                     │   ❌ Refuser → 🔄 Choisir autre PRO
└─────────────────────┘
```

---

## 🎯 **POINTS CLÉS DE LA GESTION PAIEMENT**

### **🔄 Flexibilité maximale**
- **2 choix clairs** pour le particulier
- **Notifications automatiques** pour toutes les parties
- **Retour en arrière possible** si refus

### **📊 Transparence totale**
- **Statuts clairs** dans le dashboard
- **Notifications détaillées** à chaque étape
- **Historique complet** des tentatives

### **🛡️ Sécurité maintenue**
- **Pas de contournement** possible
- **Processus contrôlé** à chaque étape
- **Protection des deux parties**

---

## 📋 **STATUTS PROJET COMPLETS AVEC GESTION PAIEMENT**

| Code | Libellé | Phase |
|-------|----------|-------|
| DEPOSE | Projet déposé | 1 |
| QUALIF | En qualification TEAM | 2 |
| BADGE | Badge CRM attribué | 3 |
| VALID | Validé support | 4 |
| LIGNE | Projet en ligne | 5 |
| CANDID | Candidatures reçues | 6 |
| MATCH | Match effectué | 7 |
| PAIEMENT_ATTENTE | Paiement en attente | 8 |
| PAIEMENT_ECHOUE | Paiement échoué | 8A |
| PAIEMENT_RETENTE | Retentative paiement | 8B |
| DEVIS | Devis reçu | 9 |
| DEVIS_VALIDE | Devis validé | 10 |
| TRAVAUX | Travaux en cours | 11 |
| FIN | Fin travaux | 12 |
| TERMINE | Projet terminé | 13 |

---

## 🎉 **CONCLUSION V4**

**Ce workflow complet avec gestion du paiement refusé assure :**
- **🔄 Flexibilité maximale** : 2 choix clairs pour le particulier
- **📊 Transparence totale** : Notifications et statuts détaillés
- **🛡️ Sécurité maintenue** : Processus contrôlé et protégé
- **🎯 Contrôle utilisateur** : Décision à chaque étape clé
- **💡 Expérience optimisée** : Gestion humaine des échecs de paiement

**✨ SwipeTonPro devient une plateforme intelligente qui gère même les cas d'échec avec élégance !**
