# 🔔 Guide du Système de Notifications Amélioré

## 📋 Vue d'ensemble

Ce guide décrit le système complet de notifications automatiques avec **messages personnalisés par rôle** implémenté dans l'application SwipeTonPro. Le système permet d'alerter les utilisateurs (particuliers, professionnels, modérateurs, administrateurs) en temps réel avec des messages clairs et adaptés à leur contexte.

---

## 🎯 Messages de Notifications par Rôle

### 1. **Pour le Professionnel**

#### Match Confirmé
- **Titre** : 🎉 Nouveau Match !
- **Message** : "Nouveau Match ! [Nom du particulier] est intéressé par votre profil. Débloquez le contact pour voir le projet '[Titre du projet]' et organiser un rendez-vous."
- **Type** : `match_mutual`
- **Déclencheur** : Quand un particulier accepte la candidature du professionnel

#### Compte Validé
- **Titre** : ✅ Votre compte a été validé !
- **Message** : "Félicitations [Nom de l'entreprise] ! Votre compte a été validé par l'administration. Vous pouvez maintenant postuler aux projets et développer votre activité."
- **Type** : `account_validated`
- **Déclencheur** : Quand l'admin valide le compte professionnel

### 2. **Pour le Particulier**

#### Match Confirmé
- **Titre** : 🎉 Un artisan a validé votre projet !
- **Message** : "Un artisan a validé votre projet '[Titre du projet]'. Restez bien sur le site pour échanger en toute sécurité et organiser votre rendez-vous."
- **Type** : `match_mutual`
- **Déclencheur** : Quand un professionnel paie pour débloquer le contact

### 3. **Pour l'Admin / Modérateur**

#### Nouveau Document Pro à Vérifier
- **Titre** : 📄 Nouveau document pro à vérifier
- **Message** : "Nouveau document pro à vérifier : [Type de document] de [Nom de l'entreprise]. Vérifiez et validez le document pour permettre au professionnel de postuler."
- **Type** : `new_document_pro`
- **Déclencheur** : Upload d'un nouveau document professionnel

#### Nouveau Ticket de Support Reçu
- **Titre** : 🎫 Nouveau ticket de support reçu
- **Message** : "Nouveau ticket de support reçu de [Nom] ([Email]). Sujet : '[Sujet]'. Priorité : [Priorité]. Traitez ce ticket rapidement pour assurer la satisfaction client."
- **Type** : `new_support_ticket`
- **Déclencheur** : Création d'un nouveau ticket de support

#### Nouveau Projet à Valider
- **Titre** : 📋 Nouveau projet à valider
- **Message** : "Nouveau projet à valider : '[Titre]' créé par [Nom du client]. Vérifiez la qualité du projet et validez-le pour le publier aux professionnels."
- **Type** : `new_project`
- **Déclencheur** : Création d'un nouveau projet

#### Nouveau Professionnel Inscrit
- **Titre** : 👷 Nouveau professionnel inscrit
- **Message** : "Nouveau professionnel inscrit : '[Nom de l'entreprise]' ([Email]). Vérifiez les documents et validez le compte pour permettre au professionnel de postuler aux projets."
- **Type** : `new_profile_pro`
- **Déclencheur** : Inscription d'un nouveau professionnel

---

## 🗄️ Structure de la Base de Données

### Table `notifications`

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Types de Notifications

| Type | Description | Destinataires |
|------|-------------|---------------|
| `match_mutual` | Match confirmé entre particulier et professionnel | Particulier + Professionnel |
| `account_validated` | Compte professionnel validé par l'admin | Professionnel |
| `new_document_pro` | Nouveau document professionnel uploadé | Admins |
| `new_support_ticket` | Nouveau ticket de support créé | Admins + Modérateurs |
| `new_project` | Nouveau projet créé | Admins + Modérateurs |
| `new_profile_pro` | Nouveau professionnel inscrit | Admins + Modérateurs |
| `mini_message` | Réception d'un mini-message | Destinataire |
| `credit_purchase` | Achat de crédits confirmé | Professionnel |
| `credit_purchase_admin` | Achat de crédits (notification admin) | Admins |
| `report_signal` | Signalement d'un profil ou projet | Modérateurs + Admins |
| `system_activity` | Activité système importante | Admins |

---

## ⚙️ Triggers Automatiques

### 1. Match Mutuel (Amélioré)

```sql
CREATE TRIGGER trigger_notify_mutual_match
  AFTER INSERT OR UPDATE ON project_interests
  FOR EACH ROW
  EXECUTE FUNCTION notify_mutual_match();
```

**Condition** : `status IN ('matched', 'payment_validated')`

**Messages personnalisés** :
- **Professionnel** : "Nouveau Match ! [Nom] est intéressé par votre profil. Débloquez le contact..."
- **Particulier** : "Un artisan a validé votre projet ! Restez bien sur le site..."

### 2. Validation Compte Pro (Nouveau)

```sql
CREATE TRIGGER trigger_notify_professional_validated
  AFTER INSERT OR UPDATE ON professionals
  FOR EACH ROW
  EXECUTE FUNCTION notify_professional_validated();
```

**Condition** : `status = 'approved'`

**Message** : "Votre compte a été validé par l'administration, vous pouvez postuler."

### 3. Nouveau Document Pro (Nouveau)

```sql
CREATE TRIGGER trigger_notify_new_professional_document
  AFTER INSERT ON professional_documents
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_professional_document();
```

**Message** : "Nouveau document pro à vérifier"

### 4. Nouveau Ticket Support (Nouveau)

```sql
CREATE TRIGGER trigger_notify_new_support_ticket
  AFTER INSERT ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_support_ticket();
```

**Message** : "Nouveau ticket de support reçu"

### 5. Nouveau Projet (Amélioré)

```sql
CREATE TRIGGER trigger_notify_new_project
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_project();
```

**Messages améliorés** avec détails du budget et du client

### 6. Nouveau Professionnel (Amélioré)

```sql
CREATE TRIGGER trigger_notify_new_professional
  AFTER INSERT ON professionals
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_professional();
```

**Message amélioré** avec instructions de validation

---

## 💻 Utilisation Frontend

### 1. Composant Cloche de Notifications

```tsx
import { NotificationBell } from '@/components/notifications/NotificationBell';

// Dans votre composant
<NotificationBell 
  userId={user.id} 
  className="ml-4"
  onNotificationClick={() => router.push('/notifications')}
/>
```

**Fonctionnalités** :
- ✅ Affiche une pastille rouge avec le nombre de notifications non lues
- ✅ Mise à jour en temps réel via Supabase Realtime
- ✅ Animation de pulsation pour attirer l'attention
- ✅ Navigation vers la page des notifications au clic
- ✅ **La pastille disparaît automatiquement quand les notifications sont lues**

### 2. Page de Liste des Notifications

```tsx
// Accessible via /notifications
import NotificationsPage from '@/pages/notifications';
```

**Fonctionnalités** :
- ✅ Affichage de toutes les notifications
- ✅ Filtres : Toutes / Non lues / Lues
- ✅ Marquer comme lu individuellement
- ✅ Marquer toutes comme lues
- ✅ Supprimer une notification
- ✅ Navigation contextuelle au clic
- ✅ Couleurs et icônes selon le type
- ✅ **Messages personnalisés par rôle**

### 3. Gestion de la Pastille de Notification

La pastille de notification s'affiche et disparaît automatiquement :

```tsx
// Dans NotificationBell.tsx
{!isLoading && unreadCount > 0 && (
  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-red-600 rounded-full animate-pulse">
    {unreadCount > 99 ? '99+' : unreadCount}
  </span>
)}
```

**Comportement** :
1. La pastille s'affiche quand `unreadCount > 0`
2. Elle se met à jour en temps réel via Supabase Realtime
3. Elle disparaît automatiquement quand toutes les notifications sont lues
4. Le compteur se décrémente quand une notification est marquée comme lue

---

## 🔄 Temps Réel (Realtime)

Le système utilise **Supabase Realtime** pour mettre à jour les notifications en temps réel :

```typescript
const channel = supabase
  .channel('user-notifications')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      // Nouvelle notification reçue
      setUnreadCount((prev) => prev + 1);
    }
  )
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      // Notification marquée comme lue
      if (payload.new.is_read && !payload.old.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    }
  )
  .subscribe();
```

---

## 🎨 Personnalisation Visuelle

### Icônes par Type

```typescript
const icons = {
  match_mutual: '🎉',
  account_validated: '✅',
  new_document_pro: '📄',
  new_support_ticket: '🎫',
  mini_message: '💬',
  credit_purchase: '✅',
  credit_purchase_admin: '💰',
  report_signal: '🚨',
  new_project: '📋',
  new_profile_pro: '👷',
  system_activity: '⚙️',
};
```

### Couleurs par Type

```typescript
const colors = {
  match_mutual: 'bg-green-50 border-l-4 border-green-500',
  account_validated: 'bg-green-50 border-l-4 border-green-500',
  new_document_pro: 'bg-purple-50 border-l-4 border-purple-500',
  new_support_ticket: 'bg-orange-50 border-l-4 border-orange-500',
  mini_message: 'bg-blue-50 border-l-4 border-blue-500',
  credit_purchase: 'bg-purple-50 border-l-4 border-purple-500',
  credit_purchase_admin: 'bg-yellow-50 border-l-4 border-yellow-500',
  report_signal: 'bg-red-50 border-l-4 border-red-500',
  new_project: 'bg-indigo-50 border-l-4 border-indigo-500',
  new_profile_pro: 'bg-teal-50 border-l-4 border-teal-500',
  system_activity: 'bg-gray-50 border-l-4 border-gray-500',
};
```

---

## 🚀 Migration

Pour installer le système de notifications amélioré, exécutez les migrations :

```bash
# Via Supabase CLI
supabase migration up

# Ou via l'interface Supabase
# 1. Copiez le contenu de supabase/migrations/20260621000000_create_comprehensive_notification_system.sql
# 2. Copiez le contenu de supabase/migrations/20260626000000_enhance_notification_messages.sql
# 3. Exécutez-les dans l'éditeur SQL dans l'ordre
```

---

## 📊 Résumé des Améliorations

### ✅ Nouveaux Triggers

1. **Validation Compte Pro** : Notifie le professionnel quand son compte est validé
2. **Nouveau Document Pro** : Alerte les admins pour vérifier les documents
3. **Nouveau Ticket Support** : Alerte les admins des nouveaux tickets

### ✅ Messages Personnalisés par Rôle

| Événement | Professionnel | Particulier | Admin |
|-----------|---------------|-------------|-------|
| Match | "Nouveau Match ! [Nom] est intéressé. Débloquez le contact." | "Un artisan a validé votre projet ! Restez sur le site." | - |
| Validation compte | "Votre compte a été validé par l'administration, vous pouvez postuler." | - | - |
| Nouveau document | - | - | "Nouveau document pro à vérifier" |
| Nouveau ticket | - | - | "Nouveau ticket de support reçu" |

### ✅ Gestion de la Pastille

- Affichage automatique quand `unreadCount > 0`
- Disparition automatique quand toutes les notifications sont lues
- Mise à jour en temps réel via Supabase Realtime
- Animation de pulsation pour attirer l'attention

---

## 🛠️ Fonctions Utilitaires

### 1. Créer une Notification

```sql
SELECT create_notification(
  p_user_id := 'uuid-de-l-utilisateur',
  p_type := 'match_mutual',
  p_title := 'Match confirmé !',
  p_message := 'Votre match a été confirmé',
  p_data := '{"project_id": "uuid-du-projet"}'::JSONB
);
```

### 2. Marquer Toutes comme Lues

```sql
SELECT mark_all_notifications_read('uuid-de-l-utilisateur');
```

### 3. Obtenir le Nombre de Non Lues

```sql
SELECT get_unread_notifications_count('uuid-de-l-utilisateur');
```

---

## ✅ Checklist d'Implémentation

- [x] Migration SQL créée et exécutée
- [x] Triggers automatiques configurés
- [x] Messages personnalisés par rôle implémentés
- [x] Nouveaux triggers ajoutés (validation compte, documents, tickets)
- [x] Fonctions utilitaires créées
- [x] Politiques RLS configurées
- [x] Composant NotificationBell créé
- [x] Page de liste des notifications créée
- [x] Service de notifications implémenté
- [x] Temps réel (Realtime) configuré
- [x] Gestion de la pastille de notification
- [x] Documentation complète

---

## 🎯 Résumé des Déclencheurs

| Événement | Destinataires | Type de Notification | Message Clé |
|-----------|---------------|---------------------|-------------|
| Match confirmé | Particulier + Professionnel | `match_mutual` | Messages personnalisés par rôle |
| Compte validé | Professionnel | `account_validated` | "Votre compte a été validé par l'administration" |
| Nouveau document | Admins | `new_document_pro` | "Nouveau document pro à vérifier" |
| Nouveau ticket | Admins + Modérateurs | `new_support_ticket` | "Nouveau ticket de support reçu" |
| Mini-message reçu | Destinataire | `mini_message` | Notification de message |
| Achat de crédits | Professionnel + Admins | `credit_purchase` | Confirmation d'achat |
| Signalement | Modérateurs + Admins | `report_signal` | Alerte de signalement |
| Nouveau projet | Modérateurs + Admins | `new_project` | Projet à valider |
| Nouveau professionnel | Modérateurs + Admins | `new_profile_pro` | Professionnel à valider |

---

**Date de création** : 26 juin 2026  
**Version** : 2.0.0  
**Auteur** : Équipe SwipeTonPro
