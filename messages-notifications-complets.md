# 📧 MESSAGES DE NOTIFICATIONS PAR EMAIL

## 🎯 **TOUS LES EMAILS ENVOYÉS AUX DEUX PARTIES**

---

## 📋 **ÉTAPE 1 : NOUVEAU PROJET**

### **📨 AUX ADMINS**
```javascript
Template: new-project-admin
Destinataires: admin@swipetonpro.com, support@swipetonpro.com

Message:
📧 Email: "🆕 Nouveau projet à valider"

Bonjour {adminName},

Un nouveau projet "{projectTitle}" a été déposé et nécessite votre validation.

📋 Détails:
- Email client: {clientEmail}
- Budget: {budgetMin}€ - {budgetMax}€
- ID Projet: {projectId}

Rôle: {role} (validation/support)
```

### **📨 AU CLIENT**
```javascript
Template: project-recap-client
Destinataire: Email du client

Message:
📧 Email: "Récapitulatif de votre projet"

Bonjour {clientName},

Merci d'avoir déposé votre projet "{projectTitle}" !

📋 Description: {projectDescription}
💰 Budget: {budgetMin}€ - {budgetMax}€

🚀 Prochaines étapes:
1. Qualification humaine par notre équipe dans les 24-48h
2. Validation et publication du projet
3. Réception des demandes de professionnels (limitées à 3)
4. Choix du professionnel et mise en relation
5. Communication directe et planification des travaux
```

---

## 📋 **ÉTAPE 2 : PROJET VALIDÉ**

### **📨 AU CLIENT**
```javascript
Template: project-validated-client
Destinataire: Email du client

Message:
📧 Email: "🎉 Votre projet a été validé et publié !"

Bonjour {clientName},

🎉 Votre projet "{projectTitle}" a été validé et publié !

🚀 Prochaines étapes:
- Votre projet est maintenant visible par les professionnels
- Vous recevrez jusqu'à 3 demandes de professionnels qualifiés
- Choisissez le professionnel qui vous convient le mieux
- Une fois le choix fait, vous pourrez communiquer directement

🔗 Voir le projet: {projectUrl}
```

---

## 📋 **ÉTAPE 3 : INTÉRÊT PROFESSIONNEL**

### **📨 AU CLIENT**
```javascript
Template: new-professional-request
Destinataire: Email du client

Message:
📧 Email: "👨‍💼 Nouveau professionnel intéressé par votre projet"

Bonjour,

Le professionnel {professionalName} a montré de l'intérêt pour votre projet !

📊 Demande #{requestNumber}/{maxRequests}
{canChooseNow ? "✅ Vous pouvez maintenant choisir un professionnel" : "⏳ En attente d'autres candidatures"}

Accédez à votre dashboard pour voir le profil et prendre une décision.
```

### **📨 NOTIFICATION INTERNE**
```javascript
Template: new_interest (notification dashboard)
Destinataire: Client (dashboard)

Message:
📧 Notification: "Nouveau professionnel intéressé"

Un professionnel a montré de l'intérêt pour votre projet "{projectTitle}"

📋 Données:
- project_id: {projectId}
- professional_id: {professionalId}
- professional_name: {professionalName}
```

---

## 📋 **ÉTAPE 4 : PROFESSIONNEL MIS EN PAUSE**

### **📨 AU PROFESSIONNEL**
```javascript
Template: professional-paused-professional
Destinataire: Email du professionnel

Message:
📧 Email: "⏸️ Votre candidature a été mise en pause"

Bonjour {professionalName},

⏸️ Un client a mis votre candidature en pause.

📋 Prochaines étapes:
- Le client souhaite réfléchir davantage
- Vous serez notifié si le client change d'avis
- Restez disponible pour d'autres projets

Client: {clientName}
```

### **📨 AU CLIENT**
```javascript
Template: professional-paused-client
Destinataire: Email du client

Message:
📧 Email: "⏸️ Vous avez mis ce professionnel en pause"

Bonjour {clientName},

⏸️ Vous avez mis ce professionnel {professionalName} en pause.

📋 Prochaines étapes:
- Vous pouvez reprendre la discussion anytime
- Le professionnel sera notifié de votre décision
- Le professionnel reste disponible
```

---

## 📋 **ÉTAPE 5 : PROFESSIONNEL REFUSÉ**

### **📨 AU PROFESSIONNEL**
```javascript
Template: professional-rejected-professional
Destinataire: Email du professionnel

Message:
📧 Email: "❌ Votre candidature n'a pas été retenue"

Bonjour {professionalName},

❌ Votre candidature n'a pas été retenue pour ce projet.

📋 Prochaines étapes:
- Continuez de postuler à d'autres projets
- Améliorez votre profil et vos photos
- Restez positif et persévérant

Client: {clientName}
```

### **📨 AU CLIENT**
```javascript
Template: professional-rejected-client
Destinataire: Email du client

Message:
📧 Email: "❌ Vous avez refusé ce professionnel"

Bonjour {clientName},

❌ Vous avez refusé le professionnel {professionalName}.

📋 Prochaines étapes:
- Vous pouvez consulter d'autres candidatures
- Nouveaux professionnels disponibles
- Contactez le support si besoin
```

---

## 📋 **ÉTAPE 6 : DÉLAI DE PAIEMENT EXPIRÉ (24h)**

### **📨 AU CLIENT**
```javascript
Template: professional-expired-client
Destinataire: Email du client

Message:
📧 Email: "⏰ Délai de paiement expiré"

Bonjour {clientName},

⏰ Le délai de paiement pour ce professionnel a expiré.

📋 Prochaines étapes:
- Le professionnel n'a pas validé dans les 24h
- Vous pouvez choisir un autre professionnel
- Le professionnel peut postuler à nouveau

Professionnel concerné: {professionalName}
```

### **📨 AU PROFESSIONNEL**
```javascript
Template: professional-expired-professional
Destinataire: Email du professionnel

Message:
📧 Email: "⏰ Délai de paiement expiré"

Bonjour {professionalName},

⏰ Le délai de paiement pour ce projet a expiré.

📋 Prochaines étapes:
- Vous n'avez pas payé dans les 24h
- Le client peut choisir un autre professionnel
- Vous pouvez postuler à d'autres projets

Client: {clientName}
```

---

## 📋 **ÉTAPE 7 : MATCHING RÉALISÉ**

### **📨 AU CLIENT**
```javascript
Template: matching-completed-client
Destinataire: Email du client

Message:
📧 Email: "🎉 Super ! Nous avons trouvé le professionnel parfait !"

Bonjour {clientName},

🎉 Super ! Nous avons trouvé le professionnel parfait pour votre projet !

Professionnel choisi: {professionalName}

🚀 Prochaines étapes:
- Vous pouvez maintenant communiquer directement
- Planifiez un RDV téléphonique ou physique
- Échangez les coordonnées en toute sécurité
- Signez le devis et commencez les travaux
```

### **📨 AU PROFESSIONNEL**
```javascript
Template: matching-completed-professional
Destinataire: Email du professionnel

Message:
📧 Email: "🎉 Félicitations ! Un client vous a choisi !"

Bonjour {professionalName},

🎉 Félicitations ! Un client vous a choisi pour son projet !

Client: {clientName}
Email: {clientEmail}

🚀 Prochaines étapes:
- Contactez le client pour qualifier le projet
- Proposez un devis détaillé
- Planifiez une visite si nécessaire
- Commencez les travaux après accord
```

### **📨 AUX COMPTES INTERNES**
```javascript
Template: matching-internal-notification
Destinataires: teamswipeTP@swipetonpro.com, contact@swipetonpro.com

Message:
📧 Email: "🎉 Nouveau matching réalisé sur la plateforme !"

Bonjour {adminName},

🎉 Nouveau matching réalisé sur la plateforme !

📋 Détails:
- Client: {clientName}
- Professionnel: {professionalName}
- Projet ID: {projectId}

Message: 🎉 Nouveau matching réalisé sur la plateforme !
```

---

## 📋 **ÉTAPE 8 : PLANNING (RDV)**

### **📨 AUX DEUX PARTIES**
```javascript
Template: planning-scheduled
Destinataires: Client + Professionnel

Message:
📧 Email: "📅 Rendez-vous planifié"

Bonjour {clientName}/{professionalName},

📅 Un rendez-vous a été planifié pour le projet "{projectName}".

📋 Détails:
- Date: {planningDate}
- Heure: {planningTime}
- Lieu: {planningLocation}

Veuillez confirmer votre présence.
```

---

## 🎯 **RÉCAPITULATIF COMPLET**

### **✅ CLIENTS RECEVENT:**
1. **project-recap-client** : Récapitulatif projet déposé
2. **project-validated-client** : Projet validé et publié
3. **new-professional-request** : Nouveau professionnel intéressé
4. **professional-paused-client** : Professionnel mis en pause
5. **professional-rejected-client** : Professionnel refusé
6. **professional-expired-client** : Délai paiement expiré
7. **matching-completed-client** : Matching réalisé
8. **planning-scheduled** : Rendez-vous planifié

### **✅ PROFESSIONNELS RECEVENT:**
1. **professional-paused-professional** : Candidature mise en pause
2. **professional-rejected-professional** : Candidature refusée
3. **professional-expired-professional** : Délai paiement expiré
4. **matching-completed-professional** : Client choisi
5. **planning-scheduled** : Rendez-vous planifié

### **✅ ADMINS RECEVENT:**
1. **new-project-admin** : Nouveau projet à valider
2. **matching-internal-notification** : Matching réalisé

---

## 🎉 **TOTAL: 12 TYPES D'EMAILS**

**📧 Chaque email est personnalisé avec les données pertinentes et inclut les prochaines étapes pour chaque partie.**
