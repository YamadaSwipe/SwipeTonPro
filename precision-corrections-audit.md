# 🔧 PRÉCISIONS POUR LES CORRECTIONS

---

## 📋 **INFORMATIONS IMPORTANTES AVANT CORRECTIONS**

---

## ✅ **1. PROFIL SOTBIRIDA@GMAIL.COM**

### **🔍 Statut actuel**
- **Profil créé** : ✅ Le profil a bien été créé dans Supabase
- **Problème résolu** : ✅ Plus besoin d'exécuter `creer-profil-manquant-sotbirida.sql`
- **Action requise** : ❌ **NE PAS** exécuter le script SQL

---

## 🗑️ **2. SUPPRESSION COMPTES .COM ADMIN/SUPPORT/MODÉRATEUR**

### **📋 Comptes à supprimer**
- **admin@swipetonpro.com** → **admin@swipetonpro.fr**
- **team@swipetonpro.com** → **team@swipetonpro.fr**  
- **support@swipetonpro.com** → **support@swipetonpro.fr**
- **moderator@swipetonpro.com** → **moderator@swipetonpro.fr**

### **🔄 Action requise**
```sql
-- Script de suppression et recréation
-- 1. Supprimer tous les comptes .com admin/support
-- 2. Recréer les mêmes comptes en .fr
-- 3. Conserver uniquement les comptes .fr pour l'administration
```

---

## 💬 **3. CHAT LIMITÉ (CHAT INCONNU = CHAT LIMITÉ)**

### **🔍 Définition clarifiée**
- **Chat limité** : Phase anonyme entre particulier et professionnel
- **3 messages maximum** : Limite pour éviter détournement de contact
- **Pas de divulgation** : Coordonnées masquées pendant cette phase
- **Historique conservé** : ✅ Tous les messages sauvegardés

### **📋 Fonctionnalités requises**
1. **Phase 1 - Chat limité** :
   - 3 messages maximum
   - Coordonnées masquées
   - Interface simple

2. **Phase 2 - Chat complet** :
   - Après validation/matching
   - Messages illimités
   - Historique complet conservé

---

## 🚫 **4. BLOCAGE STRIPPE ET VALIDATION**

### **🔍 Processus de validation**
1. **Blocage compte Stripe** : Compte bloqué par défaut
2. **Validation requise** : Validation manuelle ou automatique
3. **Déblocage** : Libération après validation

### **📋 Implémentation requise**
```javascript
// Dans le service Stripe
- Bloquer automatiquement les nouveaux comptes
- Ajouter statut de validation
- Débloquer après validation admin/automatique
```

---

## 🎯 **PLAN DE CORRECTION MIS À JOUR**

---

## **PHASE 1 - NETTOYAGE (Immédiat)**

### **1. Supprimer comptes .com admin/support**
```sql
-- Script de nettoyage
DELETE FROM auth.users WHERE email LIKE '%@swipetonpro.com' 
AND email IN ('admin@swipetonpro.com', 'team@swipetonpro.com', 'support@swipetonpro.com', 'moderator@swipetonpro.com');

-- Supprimer profils correspondants
DELETE FROM public.profiles WHERE email LIKE '%@swipetonpro.com'
AND email IN ('admin@swipetonpro.com', 'team@swipetonpro.com', 'support@swipetonpro.com', 'moderator@swipetonpro.com');
```

### **2. Recréer comptes en .fr**
```sql
-- Recréer avec le même workflow admin
-- admin@swipetonpro.fr, team@swipetonpro.fr, etc.
```

---

## **PHASE 2 - CHAT LIMITÉ (1 semaine)**

### **1. Implémenter chat limité**
```javascript
// Dans chatService.ts
- Limiter à 3 messages par conversation
- Masquer coordonnées automatiquement
- Conserver historique complet

// Dans ChatWindow.tsx  
- Compteur de messages restants
- Interface adaptée pour phase limitée
```

### **2. Transition vers chat complet**
```javascript
// Après validation/matching
- Débloquer conversation complète
- Conserver tout l'historique
- Interface étendue
```

---

## **PHASE 3 - STRIPE VALIDATION (1 semaine)**

### **1. Blocage automatique**
```javascript
// Dans stripeService.ts
- Bloquer nouveau client Stripe par défaut
- Ajouter champ validation_status
- Envoyer notification de validation requise
```

### **2. Système de validation**
```javascript
// Interface admin pour valider
- Liste des comptes en attente
- Validation manuelle ou automatique
- Déblocage après validation
```

---

## 🔄 **CORRECTIONS À ÉVITER**

### **❌ NE PAS FAIRE**
1. **Exécuter `creer-profil-manquant-sotbirida.sql`** : Déjà résolu
2. **Supprimer tous les comptes .com** : Garder les comptes clients .com
3. **Supprimer l'historique chat** : Conserver TOUS les messages

### **✅ À FAIRE**
1. **Nettoyer uniquement les comptes admin/support .com**
2. **Implémenter le chat limité avec 3 messages**
3. **Ajouter le système de validation Stripe**
4. **Conserver l'historique complet des conversations**

---

## 📊 **RÉSUMÉ DES PRÉCISIONS**

| Sujet | Statut | Action |
|--------|--------|--------|
| sotbirida@gmail.com | ✅ Créé | ❌ Pas de SQL |
| Comptes .com admin | 🗑️ À supprimer | ✅ Remplacer par .fr |
| Chat limité | 💬 À implémenter | ✅ 3 messages max |
| Historique chat | 💾 À conserver | ✅ Toujours sauvegardé |
| Stripe validation | 🔒 À implémenter | ✅ Blocage/déblocage |

---

## 🎯 **PROCHAINES ÉTAPES**

1. **Créer le script de nettoyage** pour comptes .com admin/support
2. **Implémenter le chat limité** avec compteur et masquage
3. **Développer le système de validation** Stripe
4. **Tester toutes les fonctionnalités** après corrections

**✨ Les corrections seront maintenant précises et ciblées selon vos spécifications exactes !**
