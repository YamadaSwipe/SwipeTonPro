# 📁 Migrations de la Base de Données - SwipeTonPro

---

## 🗃️ **STRUCTURE DES MIGRATIONS**

Ce dossier contient toutes les migrations SQL nécessaires pour configurer la base de données Supabase de SwipeTonPro.

---

## 📋 **LISTE DES MIGRATIONS**

### **001_create_tarifs_table.sql**
- **Table** : `tarifs_mise_en_relation`
- **Fonctionnalité** : Gestion des tarifs de mise en relation
- **Caractéristiques** : 
  - 8 paliers de frais (0€ à 399€)
  - Validation des plages
  - Cache et optimisation
  - RLS (Row Level Security)

### **002_create_paiements_table.sql**
- **Table** : `paiements_mise_en_relation`
- **Fonctionnalité** : Gestion des paiements Stripe
- **Caractéristiques** :
  - Intégration Stripe complète
  - Statuts de paiement
  - Métadonnées flexibles
  - Triggers automatiques

### **003_create_documents_table.sql**
- **Table** : `documents`
- **Fonctionnalité** : Gestion des documents (consentements, devis, etc.)
- **Caractéristiques** :
  - Types de documents variés
  - Signatures électroniques
  - Stockage sécurisé
  - Métadonnées riches

### **004_create_projet_statut_historique_table.sql**
- **Table** : `projet_statut_historique`
- **Fonctionnalité** : Historique des changements de statut
- **Caractéristiques** :
  - Tracking complet des transitions
  - Audit trail
  - Statistiques avancées
  - Vue formatée

### **005_update_conversations_table.sql**
- **Tables** : `conversations`, `messages`
- **Fonctionnalité** : Chat limité avec déblocage paiement
- **Caractéristiques** :
  - Phase anonymous/active
  - Limitation 3 messages
  - Compteurs automatiques
  - Déblocage après paiement

### **006_create_storage_buckets.sql**
- **Buckets** : `documents`, `avatars`, `project-images`, `message-attachments`
- **Fonctionnalité** : Stockage de fichiers Supabase
- **Caractéristiques** :
  - Politiques RLS complètes
  - Gestion des permissions
  - URLs publiques
  - Nettoyage automatique

---

## 🚀 **PROCÉDURE D'INSTALLATION**

### **1. Prérequis**
- Base de données Supabase créée
- Accès admin à la base
- Extensions PostgreSQL activées

### **2. Installation**
```bash
# Exécuter les migrations dans l'ordre
supabase db push
# Ou exécuter manuellement dans l'ordre :
# 001 -> 002 -> 003 -> 004 -> 005 -> 006
```

### **3. Vérification**
```sql
-- Vérifier que toutes les tables sont créées
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'tarifs_mise_en_relation',
    'paiements_mise_en_relation', 
    'documents',
    'projet_statut_historique'
  );

-- Vérifier que les buckets sont créés
SELECT * FROM storage.buckets;
```

---

## 🔧 **CONFIGURATION REQUISE**

### **Variables d'environnement**
```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://....
SUPABASE_SERVICE_ROLE_KEY=....
```

### **Extensions PostgreSQL**
```sql
-- Extensions requises
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

---

## 📊 **STRUCTURE COMPLÈTE**

### **Tables principales**
```
┌─────────────────────────┐
│ projets                  │
├─────────────────────────┤
│ profiles                 │
├─────────────────────────┤
│ professionals            │
├─────────────────────────┤
│ tarifs_mise_en_relation  │
├─────────────────────────┤
│ paiements_mise_en_relation│
├─────────────────────────┤
│ documents                │
├─────────────────────────┤
│ conversations            │
├─────────────────────────┤
│ messages                 │
├─────────────────────────┤
│ projet_statut_historique │
└─────────────────────────┘
```

### **Relations clés**
```
projets (1) -> (N) paiements_mise_en_relation
projets (1) -> (N) documents
projets (1) -> (N) projet_statut_historique
projets (1) -> (N) conversations
conversations (1) -> (N) messages
profiles (1) -> (1) professionals
```

---

## 🔒 **SÉCURITÉ**

### **RLS (Row Level Security)**
- Toutes les tables ont RLS activé
- Politiques granulaires par rôle
- Isolation des données utilisateurs

### **Permissions**
- **admin** : Accès complet
- **professional** : Accès à ses projets
- **client** : Accès à ses projets

### **Stockage**
- Buckets sécurisés avec RLS
- Validation des accès par projet
- URLs signées temporaires

---

## 🔄 **MAINTENANCE**

### **Nettoyage automatique**
```sql
-- Nettoyer les anciennes pièces jointes (90 jours)
SELECT nettoyer_anciens_fichiers(90);
```

### **Sauvegarde**
```sql
-- Exporter les données importantes
pg_dump --data-only --table=tarifs_mise_en_relation
pg_dump --data-only --table=paiements_mise_en_relation
```

### **Monitoring**
```sql
-- Statistiques d'utilisation
SELECT * FROM get_tarifs_statistics();
SELECT * FROM get_paiements_statistics();
SELECT * FROM get_documents_statistics();
```

---

## 🚨 **DÉPANNAGE**

### **Erreurs communes**
1. **Permission denied** : Vérifier les politiques RLS
2. **Foreign key violation** : Vérifier l'ordre des migrations
3. **Duplicate key** : Vérifier les contraintes UNIQUE

### **Solutions**
```sql
-- Réinitialiser les permissions
DROP POLICY IF EXISTS "nom_politique" ON nom_table;

-- Recréer les politiques
-- (Voir les fichiers de migration correspondants)
```

---

## 📈 **PERFORMANCES**

### **Index optimisés**
- Clés étrangères
- Colonnes de recherche fréquentes
- Colonnes de filtrage

### **Vues matérialisées**
- Statistiques pré-calculées
- Données formatées
- Requêtes complexes

---

## 🎯 **POINTS CLÉS**

### **✅ Fonctionnalités implémentées**
- **Tarification** : 8 paliers progressifs
- **Paiements** : Intégration Stripe complète
- **Documents** : Consentements et signatures
- **Chat** : Limité avec déblocage
- **Audit** : Historique complet
- **Stockage** : Sécurisé et optimisé

### **🔧 Architecture**
- **Scalable** : Index et optimisations
- **Sécurisée** : RLS et permissions
- **Maintenable** : Migrations versionnées
- **Performante** : Vues et fonctions

---

## 📝 **NOTES DE DÉVELOPPEMENT**

### **Conventions**
- Nommage en snake_case
- Commentaires complets
- Types explicites
- Contraintes de validation

### **Bonnes pratiques**
- Transactions atomiques
- Gestion des erreurs
- Logs appropriés
- Tests de régression

---

## 🔄 **MISES À JOUR FUTURES**

### **Prochaines migrations**
- Notifications push
- Évaluations et avis
- Système de crédits
- Analytics avancés

### **Évolutions prévues**
- Multi-devises
- Internationalisation
- API publique
- Webhooks étendus

---

## 📞 **SUPPORT**

### **Documentation**
- Supabase Docs : https://supabase.com/docs
- Stripe Docs : https://stripe.com/docs
- PostgreSQL Docs : https://postgresql.org/docs/

### **Aide**
- Issues GitHub : Créer un ticket
- Support technique : contact@swipetonpro.fr
- Documentation interne : Wiki technique

---

**✨ Base de données SwipeTonPro prête pour la production !**
