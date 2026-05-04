# 📋 GESTION DES COMPTES - Guide Complet

## 🎯 **Objectif**
Gérer les comptes `sotbirida@yahoo.fr` et `sotbirida@gmail.com` et tous autres comptes utilisateurs.

---

## 🔧 **Fichiers créés**

| Fichier | Fonction |
|---------|----------|
| `SEARCH_AND_RESET_ACCOUNTS.sql` | Recherche et réinitialisation SQL |
| `src/pages/api/admin/manage-accounts.ts` | API backend pour gestion comptes |
| `src/components/admin/AccountManager.tsx` | Interface React pour gestion |
| `src/pages/admin/account-management.tsx` | Page admin complète |
| `README_ACCOUNT_MANAGEMENT.md` | Ce guide |

---

## 🚀 **Utilisation**

### **1. Accès admin**
```
URL: http://localhost:3000/auth/login
Email: admin@swipotonpro.fr
MP: Admin123!
```

### **2. Page de gestion**
```
URL: http://localhost:3000/admin/account-management
Menu: Gestion Comptes
```

### **3. Fonctionnalités disponibles**

#### **🔍 Recherche de comptes**
- Entrez un email (ex: `sotbirida@yahoo.fr`)
- Cliquez sur "Rechercher"
- Résultats instantanés avec détails

#### **🔑 Réinitialisation mot de passe**
- Bouton "Réinitialiser" sur chaque compte
- MP temporaire: `TempPassword123!`
- L'utilisateur doit changer après connexion

#### **➕ Création de compte**
- Formulaire complet pour nouveaux comptes
- Choix du rôle: Professionnel/Particulier/Admin
- Mot de passe visible/caché

---

## 📊 **Exécution SQL (optionnel)**

### **Rechercher les comptes**
```sql
-- Exécuter dans Supabase SQL Editor
SELECT * FROM SEARCH_AND_RESET_ACCOUNTS.sql;
```

### **Réinitialiser manuellement**
```sql
SELECT * FROM reset_user_password('sotbirida@yahoo.fr', 'NouveauMP123!');
SELECT * FROM reset_user_password('sotbirida@gmail.com', 'NouveauMP123!');
```

---

## 🛡️ **Sécurité**

- ✅ **Admin fantôme isolé** - Pas de conflit Supabase
- ✅ **Validation admin requise** - Accès sécurisé
- ✅ **Logs détaillés** - Traçabilité complète
- ✅ **Mots de passe temporaires** - Sécurité renforcée

---

## 🎯 **Actions immédiates**

1. **Démarrer le serveur**
   ```bash
   npm run dev
   ```

2. **Se connecter admin**
   - URL: `http://localhost:3000/auth/login`
   - Email: `admin@swipotonpro.fr`
   - MP: `Admin123!`

3. **Accéder gestion comptes**
   - Menu: "Gestion Comptes"
   - Rechercher: `sotbirida@yahoo.fr`

4. **Réinitialiser les MPs**
   - Cliquer "Réinitialiser" pour chaque compte
   - Noter les nouveaux mots de passe

---

## 📞 **Support**

### **Problèmes courants**
- **"Pas autorisé"** → Utiliser admin@swipotonpro.fr (pas admin@swipoton.fr)
- **Redirection vers compte particulier** → Nettoyer localStorage
- **API 401** → Vérifier headers x-admin-ghost

### **Nettoyage complet**
```javascript
// Dans console navigateur
localStorage.clear();
sessionStorage.clear();
location.reload();
```

---

## ✅ **Vérification finale**

Après configuration :
- [ ] Admin fantôme fonctionne
- [ ] Page gestion accessible
- [ ] Recherche trouve les comptes
- [ ] Réinitialisation MP fonctionne
- [ ] Création compte fonctionne

**Système prêt pour gérer tous les comptes !** 🚀
