# 🎫 Guide du Système de Tickets de Support

## Vue d'ensemble

Le système de tickets de support permet de gérer les demandes de contact des utilisateurs (connectés ou non) via le formulaire de contact du site. Chaque soumission crée automatiquement un ticket en base de données et notifie les administrateurs.

## 📋 Fonctionnalités

### 1. Création de Tickets
- ✅ Formulaire de contact accessible à tous (connectés ou non)
- ✅ Enregistrement automatique en base de données
- ✅ Capture des informations utilisateur (nom, email, téléphone, adresse)
- ✅ Capture des métadonnées (IP, User-Agent, source)
- ✅ Association automatique à l'utilisateur connecté si applicable

### 2. Notifications Automatiques
- ✅ **Notifications in-app** : Créées automatiquement pour tous les administrateurs
- ✅ **Emails** : Envoyés à tous les administrateurs et modérateurs
- ✅ Lien direct vers le ticket dans les notifications

### 3. Gestion des Tickets
- ✅ Statuts : `pending`, `in_progress`, `resolved`, `closed`, `spam`
- ✅ Priorités : `low`, `normal`, `high`, `urgent`
- ✅ Attribution à un administrateur
- ✅ Suivi du temps de résolution

## 🗄️ Structure de la Base de Données

### Table `support_tickets`

```sql
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY,
  
  -- Informations utilisateur
  user_id UUID,                    -- NULL si non connecté
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  address TEXT,
  
  -- Détails du ticket
  request_type VARCHAR(100),       -- Type de demande
  subject VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  
  -- Statut et suivi
  status VARCHAR(50) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'normal',
  assigned_to UUID,                -- Admin assigné
  
  -- Métadonnées
  ip_address INET,
  user_agent TEXT,
  source VARCHAR(50),
  
  -- Timestamps
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);
```

### Index de Performance

```sql
-- Index pour recherches rapides
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_email ON support_tickets(email);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at DESC);
CREATE INDEX idx_support_tickets_assigned_to ON support_tickets(assigned_to);
```

## 🔐 Politiques de Sécurité (RLS)

### Permissions

1. **Lecture**
   - Les utilisateurs peuvent voir leurs propres tickets
   - Les administrateurs peuvent voir tous les tickets

2. **Création**
   - Tout le monde peut créer un ticket (même non connecté)

3. **Modification**
   - Seuls les administrateurs peuvent modifier les tickets

4. **Suppression**
   - Seuls les administrateurs peuvent supprimer les tickets (spam, etc.)

## 🔔 Système de Notifications

### Trigger Automatique

Lors de la création d'un ticket, un trigger PostgreSQL :
1. Récupère tous les administrateurs et modérateurs
2. Crée une notification in-app pour chacun
3. Inclut les métadonnées du ticket dans la notification

```sql
CREATE TRIGGER trigger_notify_admins_new_support_ticket
  AFTER INSERT ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_new_support_ticket();
```

### Emails aux Administrateurs

L'API `/api/contact` envoie automatiquement un email à tous les administrateurs contenant :
- Type de demande
- Nom et coordonnées de l'utilisateur
- Sujet et message
- Lien vers le tableau de bord des tickets

## 🔌 API Backend

### Endpoint : `POST /api/contact`

#### Requête

```json
{
  "name": "Jean Dupont",
  "email": "jean@example.com",
  "phone": "0612345678",
  "address": "123 Rue de Paris, 75001 Paris",
  "requestType": "Support technique",
  "subject": "Problème de connexion",
  "message": "Je n'arrive pas à me connecter..."
}
```

#### Réponse Succès

```json
{
  "success": true,
  "message": "Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.",
  "ticketId": "uuid-du-ticket"
}
```

#### Réponse Erreur

```json
{
  "error": "Les champs nom, email, téléphone, sujet et message sont obligatoires"
}
```

### Fonctionnalités de l'API

1. **Validation des données**
   - Vérification des champs obligatoires
   - Validation du format email
   - Nettoyage des données (trim, lowercase pour email)

2. **Gestion de l'authentification**
   - Détection automatique de l'utilisateur connecté
   - Support des utilisateurs anonymes

3. **Capture des métadonnées**
   - Adresse IP (via headers X-Forwarded-For ou X-Real-IP)
   - User-Agent du navigateur

4. **Rate Limiting**
   - Protection contre le spam
   - Limite de requêtes par IP

## 🎨 Frontend

### Formulaire de Contact (`src/pages/contact.tsx`)

Le formulaire capture les informations suivantes :
- **Nom complet** (obligatoire)
- **Email** (obligatoire, validé)
- **Téléphone** (obligatoire, validé)
- **Adresse** (optionnel)
- **Type de demande** (sélection)
  - Demande générale
  - Support technique
  - Demande commerciale
  - Proposition de partenariat
  - Autre
- **Sujet** (obligatoire)
- **Message** (obligatoire)

### Validation Frontend

```typescript
// Validation email
const emailValidation = validateEmail(email.trim());
if (!emailValidation.isValid) {
  setError(emailValidation.error || 'Email invalide');
  return;
}

// Validation téléphone
const phoneValidation = validatePhone(phone.trim());
if (!phoneValidation.isValid) {
  setError(phoneValidation.error || 'Téléphone invalide');
  return;
}
```

### Expérience Utilisateur

1. **Soumission** : Affichage d'un spinner pendant l'envoi
2. **Succès** : Page de confirmation avec message de remerciement
3. **Erreur** : Affichage d'une alerte avec le message d'erreur

## 📊 Statistiques

### Fonction SQL : `get_support_tickets_stats()`

Retourne des statistiques sur les tickets :

```sql
SELECT * FROM get_support_tickets_stats();
```

Résultat :
```
total_tickets          | 150
pending_tickets        | 25
in_progress_tickets    | 10
resolved_tickets       | 115
avg_resolution_time    | 2 days 05:30:00
```

## 🚀 Déploiement

### 1. Appliquer la Migration

```bash
# Via Supabase CLI
supabase db push

# Ou via le dashboard Supabase
# SQL Editor > Coller le contenu de la migration > Run
```

### 2. Vérifier la Table

```sql
-- Vérifier que la table existe
SELECT * FROM support_tickets LIMIT 1;

-- Vérifier les triggers
SELECT tgname FROM pg_trigger WHERE tgrelid = 'support_tickets'::regclass;
```

### 3. Tester l'API

```bash
# Test avec curl
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "0612345678",
    "subject": "Test",
    "message": "Message de test",
    "requestType": "Demande générale"
  }'
```

## 📧 Configuration Email

### Variables d'Environnement

```env
# SMTP Configuration (pour les emails aux admins)
SMTP_HOST=ssl0.ovh.net
SMTP_PORT=465
SMTP_PASSWORD=votre_mot_de_passe
SMTP_USER_SUPPORT=support@swipetonpro.fr

# URL du site (pour les liens dans les emails)
NEXT_PUBLIC_SITE_URL=https://swipetonpro.fr
```

### Template Email

L'email envoyé aux administrateurs contient :
- Badge avec le type de demande
- Nom et coordonnées cliquables (mailto:, tel:)
- Sujet et message complet
- Date et heure de création
- Lien vers le tableau de bord des tickets

## 🔍 Monitoring et Logs

### Logs Console

```
✅ Ticket de support créé: uuid-du-ticket
📧 3/3 emails envoyés aux administrateurs
✅ Email envoyé à admin@swipetonpro.fr
```

### Logs d'Erreur

```
❌ Erreur création ticket: [détails]
❌ Erreur récupération admins: [détails]
⚠️ Aucun administrateur trouvé pour notification
```

## 🛠️ Administration

### Tableau de Bord (À créer)

Créer une page `/admin/support-tickets` pour :
- Lister tous les tickets
- Filtrer par statut, priorité, date
- Assigner des tickets aux administrateurs
- Changer le statut et la priorité
- Répondre aux tickets
- Marquer comme résolu/fermé/spam

### Exemple de Requête

```typescript
// Récupérer tous les tickets en attente
const { data: tickets } = await supabase
  .from('support_tickets')
  .select('*')
  .eq('status', 'pending')
  .order('created_at', { ascending: false });
```

## 🎯 Bonnes Pratiques

1. **Réponse Rapide** : Traiter les tickets dans les 24h
2. **Priorisation** : Utiliser les priorités pour gérer l'urgence
3. **Attribution** : Assigner les tickets aux bons administrateurs
4. **Suivi** : Mettre à jour le statut régulièrement
5. **Résolution** : Marquer `resolved_at` lors de la résolution
6. **Nettoyage** : Supprimer les tickets spam régulièrement

## 🔄 Workflow Recommandé

1. **Nouveau ticket** → Status: `pending`
2. **Admin prend en charge** → Status: `in_progress`, `assigned_to` défini
3. **Problème résolu** → Status: `resolved`, `resolved_at` défini
4. **Ticket archivé** → Status: `closed`

## 📝 Notes Importantes

- Les tickets peuvent être créés par des utilisateurs non connectés
- Les notifications sont créées automatiquement par le trigger SQL
- Les emails sont envoyés via SMTP (configuration requise)
- Le rate limiting protège contre le spam
- Les données sensibles (IP, User-Agent) sont capturées pour la sécurité

## 🐛 Dépannage

### Problème : Pas de notification créée

**Solution** : Vérifier que le trigger existe et fonctionne
```sql
SELECT * FROM pg_trigger WHERE tgname = 'trigger_notify_admins_new_support_ticket';
```

### Problème : Emails non envoyés

**Solution** : Vérifier la configuration SMTP
```typescript
console.log('SMTP Config:', {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  user: process.env.SMTP_USER_SUPPORT,
  hasPassword: !!process.env.SMTP_PASSWORD
});
```

### Problème : Erreur RLS

**Solution** : Vérifier les politiques RLS
```sql
SELECT * FROM pg_policies WHERE tablename = 'support_tickets';
```

## 📚 Ressources

- Migration SQL : `supabase/migrations/20260625000000_create_support_tickets_system.sql`
- API Backend : `src/pages/api/contact.ts`
- Frontend : `src/pages/contact.tsx`
- Email Service : `src/lib/email.ts`

---

**Date de création** : 25 juin 2026  
**Version** : 1.0  
**Auteur** : Équipe SwipeTonPro
