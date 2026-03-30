# 🔧 PRÉCISIONS CORRECTIONS - VERSION 3

---

## 📋 **INFORMATIONS IMPORTANTES MIS À JOUR**

---

## 💰 **SYSTÈME DE PAIEMENT ET BLOCAGE STRIPE**

### **🔄 PROCESSUS COMPLET PRÉCISÉ**

#### **Étape 1 - Réception devis**
- **Particulier** : Reçoit le devis du professionnel
- **Dashboard** : Affichage "Devis reçu"

#### **Étape 2 - Devis validé** 
- **Validation** : Information dans dashboard
- **Option blocage acompte** : **Les parties décident si OUI ou NON**
- **Si OUI** : Particulier verse l'acompte → Stripe bloque l'acompte
- **Si NON** : Pas de blocage, accord direct entre parties

#### **Étape 3 - Dates des travaux**
- **Particulier** : Définit les dates de début/fin
- **Pro** : Confirme les disponibilités
- **Dashboard** : Affichage planning

#### **Étape 4 - Début travaux**
- **Statut** : "Travaux en cours" → **Statut à rentrer dans dashboard**
- **Chat complet** : **Débloqué APRÈS le paiement APRÈS matching**
- **Important** : Le chat complet dépend du paiement de mise en relation

#### **Étape 5 - Versement acompte (si option choisie)**
- **Accord mutuel** : Versement possible à tout moment
- **Dashboard** : Interface de demande/acceptation

#### **Étape 6 - Fin travaux**
- **Validation fin** : **Statut pour clôturer le projet**
- **Action** : Particulier valide la fin des travaux
- **Conséquence** : Clôture automatique du projet

#### **Étape 7 - Projet terminé**
- **Statut** : "Projet terminé"
- **Archivage** : Projet archivé
- **Évaluation** : Possibilité d'évaluer le pro

---

## 💳 **PAIEMENT APRÈS MATCHING**

### **🎯 DÉCLENCHEUR DU CHAT COMPLET**

#### **Paiement de mise en relation**
- **Quand** : APRÈS matching (pro sélectionné par particulier)
- **Montant** : Défini sur **échelle de palier de prix** basée sur estimation IA
- **Action** : Paiement débloque chat complet et informations pro

#### **Exemple de paliers de prix**
```
Estimation IA < €500    → Paiement mise en relation : €10
Estimation IA €500-1000  → Paiement mise en relation : €20
Estimation IA €1000-2000 → Paiement mise en relation : €30
Estimation IA €2000-5000 → Paiement mise en relation : €50
Estimation IA > €5000    → Paiement mise en relation : €100
```

### **🔄 Processus complet**
1. **Particulier reçoit devis** → Estimation IA générée
2. **Particulier choisit un pro** → Matching effectué
3. **Paiement mise en relation** → Basé sur palier estimation IA
4. **Chat complet débloqué** → Accès infos pro et communication illimitée
5. **Début travaux** → Statut "Travaux en cours" dans dashboard

---

## 🎯 **PLAN DE CORRECTION MIS À JOUR**

---

## **PHASE 1 - NETTOYAGE (Immédiat)**

### **1. Supprimer comptes .com admin/support**
```sql
-- Script de nettoyage précis
DELETE FROM auth.users WHERE email LIKE '%@swipetonpro.com' 
AND email IN ('admin@swipetonpro.com', 'team@swipetonpro.com', 'support@swipetonpro.com', 'moderator@swipetonpro.com');
```

### **2. Recréer comptes en .fr**
```sql
-- Recréer avec workflow admin
-- admin@swipetonpro.fr, team@swipetonpro.fr, etc.
```

---

## **PHASE 2 - SYSTÈME DE PAIEMENT AVANCÉ (2 semaines)**

### **1. Workflow de paiement avec options**
```javascript
// Dans projetService.ts amélioré
- recevoirDevis()
- validerDevis() 
- choisirBlocageAcompte(boolean) // NOUVEAU : option
- bloquerAcompte(siChoisi)
- definirDatesTravaux()
- debuterTravaux() // Statut dashboard
- finirTravaux() // Statut clôture
- terminerProjet()
```

### **2. Paliers de prix IA**
```javascript
// Dans estimationService.ts
const getPalierPrix = (estimation) => {
  if (estimation < 500) return 10;
  if (estimation < 1000) return 20;
  if (estimation < 2000) return 30;
  if (estimation < 5000) return 50;
  return 100;
};
```

### **3. Dashboard avancé avec statuts**
```javascript
// Dans dashboard particulier
- État du projet en temps réel
- Option blocage acompte (OUI/NON)
- Statuts : "Devis reçu" → "Devis validé" → "Travaux en cours" → "Fin travaux" → "Projet terminé"
- Interface de paiement mise en relation
```

---

## **PHASE 3 - CHAT AVEC PAIEMENT MATCHING (1 semaine)**

### **1. Chat limité amélioré**
```javascript
// Dans chatService.ts
- Limite 3 messages
- Masquage coordonnées
- Compteur messages restants
- Notification "Payer pour débloquer (€XX selon palier)"
```

### **2. Paiement après matching**
```javascript
// Dans matchingService.ts
- Calcul palier selon estimation IA
- Paiement mise en relation
- Déblocage automatique chat complet
- Accès informations professionnelles
```

---

## **PHASE 4 - DASHBOARD STATUTS (1 semaine)**

### **1. Gestion des statuts**
```javascript
// Dans dashboardService.ts
const STATUTS_PROJET = {
  DEVIS_RECU: 'Devis reçu',
  DEVIS_VALIDE: 'Devis validé', 
  TRAVAUX_EN_COURS: 'Travaux en cours',
  FIN_TRAVAUX: 'Fin travaux',
  PROJET_TERMINE: 'Projet terminé'
};
```

### **2. Interface de validation**
```javascript
// Dashboard particulier
- Bouton "Valider devis"
- Option "Bloquer acompte (OUI/NON)"
- Champ "Début des travaux" (statut)
- Champ "Fin des travaux" (statut)
- Bouton "Clôturer projet"
```

---

## 📊 **DASHBOARD PARTICULIER - EXEMPLE COMPLET**

```
┌─────────────────────────────────────┐
│ 🏠 Projet : Rénovation cuisine      │
│ 📊 Statut : Devis validé            │
│ 💰 Estimation IA : €1800             │
├─────────────────────────────────────┤
│ 📄 Devis reçu (2 jours) ✅         │
│ 🔄 Option acompte : [OUI] [NON]     │
├─────────────────────────────────────┤
│ 💬 Messages Pro X (2/3)             │
│ 🔓 Débloquer chat complet (€30)      │
│ 📋 Palier : Estimation €1000-2000   │
├─────────────────────────────────────┤
│ 📅 Début travaux : [Définir date]   │
│ 🏁 Fin travaux : [Définir date]     │
└─────────────────────────────────────┘
```

---

## 🔄 **WORKFLOW COMPLET MIS À JOUR**

```
Devis reçu → Devis validé → (Option) Acompte bloqué → 
Paiement matching → Chat complet → Début travaux → 
Fin travaux → Projet terminé
```

---

## 💳 **PALIERS DE PAIEMENT DÉTAILLÉS**

| Estimation IA | Paiement mise en relation | Raison |
|---------------|--------------------------|---------|
| < €500        | €10                      | Petits travaux |
| €500-1000     | €20                      | Travaux moyens |
| €1000-2000    | €30                      | Rénovations |
| €2000-5000    | €50                      | Gros travaux |
| > €5000        | €100                     | Travaux majeurs |

---

## 📋 **CORRECTIONS PRÉCISES V3**

### **❌ À ÉVITER**
- Payer avant matching
- Bloquer automatiquement l'acompte
- Débloquer chat avant paiement

### **✅ À FAIRE**
- Option blocage acompte (choix des parties)
- Paiement après matching selon paliers IA
- Statuts dashboard précis
- Chat complet après paiement matching

---

## 🎯 **OBJECTIF FINAL V3**

**Système flexible avec options de paiement et statuts précis**

**🔧 Options utilisateur + 💰 Paliers intelligents + 📊 Statuts clairs = 🛡️ Contrôle total**

---

## 📊 **RÉSUMÉ DES PRÉCISIONS V3**

| Sujet | Version 2 | Version 3 |
|--------|------------|------------|
| Acompte | Bloqué automatiquement | **Option des parties** |
| Chat complet | Après paiement projet | **Après paiement matching** |
| Statuts | Basiques | **Précis et dashboard** |
| Paiement | Fixe | **Paliers selon estimation IA** |

**✨ Le système devient maintenant flexible, intelligent et contrôlé par l'utilisateur !**
