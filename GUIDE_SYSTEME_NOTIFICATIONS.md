# 🔔 Guide du Système de Notifications Complet

## 📋 Vue d'ensemble

Ce guide décrit le système complet de notifications automatiques implémenté dans l'application SwipeTonPro. Le système permet d'alerter les utilisateurs (particuliers, professionnels, modérateurs, administrateurs) en temps réel lors d'événements importants.

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

### Colonnes

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Identifiant unique de la notification |
| `user_id` | UUID | Référence vers l'utilisateur destinataire |
| `title` | TEXT | Titre de la notification |
| `message` | TEXT | Message détaillé de la notification |
| `type` | TEXT | Type de notification (voir types ci-dessous) |
| `data` | JSONB | Données additionnelles (project_id, professional_id, etc.) |
| `is_read` | BOOLEAN | Indique si la notification a été lue |
| `read_at` | TIMESTAMP | Date et heure de lecture |
| `created_at` | TIMESTAMP | Date de création |
| `updated_at` | TIMESTAMP | Date de dernière mise à jour |

### Index de Performance

```sql
CREATE INDEX idx_notifications_user_is_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_desc ON notifications(created_at DESC);
```

---

## 🎯 Types de Notifications

### 1. **Match Mutuel** (`match_mutual`)
- **Déclencheur** : Quand un match est confirmé entre un particulier et un professionnel
- **Destinataires** : Particulier + Professionnel
- **Données** : `project_id`, `professional_id`, `match_id`

### 2. **Mini-Message** (`mini_message`)
- **Déclencheur** : Réception d'un mini-message
- **Destinataires** : Destinataire du message
- **Données** : `message_id`, `sender_id`, `project_id`, `preview`

### 3. **Achat de Crédits** (`credit_purchase`)
- **Déclencheur** : Confirmation d'achat de pack de crédits
- **Destinataires** : Professionnel acheteur
- **Données** : `purchase_id`, `credits_amount`, `price_paid`

### 4. **Achat de Crédits (Admin)** (`credit_purchase_admin`)
- **Déclencheur** : Confirmation d'achat de pack de crédits
- **Destinataires** : Administrateurs
- **Données** : `purchase_id`, `professional_id`, `credits_amount`, `price_paid`

### 5. **Signalement** (`report_signal`)
- **Déclencheur** : Signalement d'un profil ou projet
- **Destinataires** : Modérateurs + Administrateurs
- **Données** : `report_id`, `reporter_id`, `reported_profile_id`, `reported_project_id`, `reason`, `severity`

### 6. **Nouveau Projet** (`new_project`)
- **Déclencheur** : Création d'un nouveau projet
- **Destinataires** : Modérateurs + Administrateurs
- **Données** : `project_id`, `client_id`, `category`, `budget_min`, `budget_max`

### 7. **Nouveau Profil Pro** (`new_profile_pro`)
- **Déclencheur** : Inscription d'un nouveau professionnel
- **Destinataires** : Modérateurs + Administrateurs
- **Données** : `professional_id`, `user_id`, `company_name`, `specialties`

### 8. **Activité Système** (`system_activity`)
- **Déclencheur** : Événements système majeurs (transactions, remboursements)
- **Destinataires** : Administrateurs
- **Données** : `table`, `record_id`, `timestamp`

---

## ⚙️ Triggers Automatiques

### 1. Trigger Match Mutuel

```sql
CREATE TRIGGER trigger_notify_mutual_match
  AFTER INSERT OR UPDATE ON project_interests
  FOR EACH ROW
  EXECUTE FUNCTION notify_mutual_match();
```

**Condition** : `status IN ('matched', 'payment_validated')`

### 2. Trigger Mini-Message

```sql
CREATE TRIGGER trigger_notify_mini_message
  AFTER INSERT ON mini_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_mini_message_received();
```

### 3. Trigger Achat de Crédits

```sql
CREATE TRIGGER trigger_notify_credit_purchase
  AFTER INSERT OR UPDATE ON credit_pack_purchases
  FOR EACH ROW
  EXECUTE FUNCTION notify_credit_purchase();
```

**Condition** : `status = 'completed'`

### 4. Trigger Signalement

```sql
CREATE TRIGGER trigger_notify_report_signal
  AFTER INSERT ON reports
  FOR EACH ROW
  EXECUTE FUNCTION notify_report_signal();
```

### 5. Trigger Nouveau Projet

```sql
CREATE TRIGGER trigger_notify_new_project
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_project();
```

### 6. Trigger Nouveau Professionnel

```sql
CREATE TRIGGER trigger_notify_new_professional
  AFTER INSERT ON professionals
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_professional();
```

### 7. Triggers Activités Système

```sql
CREATE TRIGGER trigger_notify_match_transaction
  AFTER INSERT OR UPDATE ON match_transactions
  FOR EACH ROW
  EXECUTE FUNCTION notify_system_activity();

CREATE TRIGGER trigger_notify_credit_refund
  AFTER INSERT ON credit_transactions
  FOR EACH ROW
  WHEN (NEW.type = 'refund')
  EXECUTE FUNCTION notify_system_activity();
```

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
-- Retourne le nombre de notifications marquées comme lues
```

### 3. Obtenir le Nombre de Non Lues

```sql
SELECT get_unread_notifications_count('uuid-de-l-utilisateur');
-- Retourne un entier
```

### 4. Nettoyer les Anciennes Notifications

```sql
SELECT cleanup_old_notifications(90); -- Supprime les notifications lues de plus de 90 jours
-- Retourne le nombre de notifications supprimées
```

---

## 🔒 Sécurité (RLS)

### Politiques de Sécurité

```sql
-- Les utilisateurs peuvent voir leurs propres notifications
CREATE POLICY "users_view_own_notifications" ON notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Les utilisateurs peuvent marquer leurs notifications comme lues
CREATE POLICY "users_update_own_notifications" ON notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Les utilisateurs peuvent supprimer leurs notifications
CREATE POLICY "users_delete_own_notifications" ON notifications
  FOR DELETE
  USING (user_id = auth.uid());

-- Le système peut créer des notifications pour tous
CREATE POLICY "system_create_notifications" ON notifications
  FOR INSERT
  WITH CHECK (true);
```

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
- Affiche une pastille rouge avec le nombre de notifications non lues
- Mise à jour en temps réel via Supabase Realtime
- Animation de pulsation pour attirer l'attention
- Navigation vers la page des notifications au clic

### 2. Page de Liste des Notifications

```tsx
// Accessible via /notifications
import NotificationsPage from '@/pages/notifications';
```

**Fonctionnalités** :
- Affichage de toutes les notifications
- Filtres : Toutes / Non lues / Lues
- Marquer comme lu individuellement
- Marquer toutes comme lues
- Supprimer une notification
- Navigation contextuelle au clic
- Couleurs et icônes selon le type

### 3. Service de Notifications

```typescript
import { notificationService } from '@/services/notificationService';

// Récupérer les notifications
const { data, error } = await notificationService.getUserNotifications(userId, 50);

// Marquer comme lue
await notificationService.markAsRead(notificationId);

// Marquer toutes comme lues
await notificationService.markAllAsRead(userId);

// Obtenir le nombre de non lues
const { data: count } = await notificationService.getUnreadCount(userId);

// S'abonner aux nouvelles notifications (Realtime)
const subscription = notificationService.subscribeToNotifications((newNotif) => {
  console.log('Nouvelle notification:', newNotif);
});
```

---

## 📊 Vue Statistiques

### Vue `notification_stats`

```sql
SELECT * FROM notification_stats;
```

**Colonnes** :
- `type` : Type de notification
- `total_count` : Nombre total
- `unread_count` : Nombre non lues
- `read_count` : Nombre lues
- `avg_read_time_seconds` : Temps moyen de lecture (en secondes)

---

## 🎨 Personnalisation Visuelle

### Icônes par Type

```typescript
const icons = {
  match_mutual: '🎉',
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

## 🔄 Temps Réel (Realtime)

Le système utilise **Supabase Realtime** pour mettre à jour les notifications en temps réel sans rechargement de page.

### Configuration

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
      // Notification mise à jour (marquée comme lue)
      if (payload.new.is_read && !payload.old.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    }
  )
  .subscribe();
```

---

## 🧹 Maintenance

### Nettoyage Automatique

Il est recommandé de configurer un **cron job** pour nettoyer les anciennes notifications :

```sql
-- Exécuter quotidiennement
SELECT cleanup_old_notifications(90); -- Supprime les notifications lues de plus de 90 jours
```

### Monitoring

```sql
-- Vérifier le nombre total de notifications
SELECT COUNT(*) FROM notifications;

-- Vérifier les notifications non lues par utilisateur
SELECT user_id, COUNT(*) as unread_count
FROM notifications
WHERE is_read = false
GROUP BY user_id
ORDER BY unread_count DESC;

-- Statistiques par type
SELECT * FROM notification_stats;
```

---

## 📝 Exemples d'Utilisation

### Exemple 1 : Créer une Notification Manuelle

```typescript
// Dans une API route ou fonction backend
const { data, error } = await supabase
  .from('notifications')
  .insert({
    user_id: userId,
    type: 'custom',
    title: 'Notification personnalisée',
    message: 'Ceci est un message personnalisé',
    data: { custom_field: 'valeur' },
    is_read: false,
  });
```

### Exemple 2 : Intégrer dans un Dashboard

```tsx
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useAuth } from '@/services/authService';

export function DashboardHeader() {
  const { user } = useAuth();

  return (
    <header className="flex items-center justify-between p-4">
      <h1>Dashboard</h1>
      <div className="flex items-center gap-4">
        {user && <NotificationBell userId={user.id} />}
        <UserMenu />
      </div>
    </header>
  );
}
```

### Exemple 3 : Notification Personnalisée avec Navigation

```typescript
// Créer une notification avec données de navigation
await supabase.from('notifications').insert({
  user_id: professionalId,
  type: 'custom_alert',
  title: 'Nouveau lead disponible',
  message: 'Un nouveau lead correspond à vos critères',
  data: {
    project_id: projectId,
    lead_score: 95,
    urgency: 'high',
  },
  is_read: false,
});

// Dans le composant, gérer la navigation
const handleNotificationClick = (notification) => {
  const data = notification.data;
  if (data.project_id) {
    router.push(`/projets/${data.project_id}`);
  }
};
```

---

## 🚀 Migration

Pour installer le système de notifications, exécutez la migration :

```bash
# Via Supabase CLI
supabase migration up

# Ou via l'interface Supabase
# Copiez le contenu de supabase/migrations/20260621000000_create_comprehensive_notification_system.sql
# Et exécutez-le dans l'éditeur SQL
```

---

## ✅ Checklist d'Implémentation

- [x] Migration SQL créée et exécutée
- [x] Triggers automatiques configurés
- [x] Fonctions utilitaires créées
- [x] Politiques RLS configurées
- [x] Composant NotificationBell créé
- [x] Page de liste des notifications créée
- [x] Service de notifications implémenté
- [x] Temps réel (Realtime) configuré
- [x] Documentation complète

---

## 🎯 Résumé des Déclencheurs

| Événement | Destinataires | Type de Notification |
|-----------|---------------|---------------------|
| Match confirmé | Particulier + Professionnel | `match_mutual` |
| Mini-message reçu | Destinataire | `mini_message` |
| Achat de crédits | Professionnel + Admins | `credit_purchase` / `credit_purchase_admin` |
| Signalement | Modérateurs + Admins | `report_signal` |
| Nouveau projet | Modérateurs + Admins | `new_project` |
| Nouveau professionnel | Modérateurs + Admins | `new_profile_pro` |
| Transaction complétée | Admins | `system_activity` |
| Remboursement | Admins | `system_activity` |

---

## 📞 Support

Pour toute question ou problème concernant le système de notifications, consultez :
- La documentation Supabase Realtime
- Les logs de la base de données
- Les statistiques via `notification_stats`

---

**Date de création** : 21 juin 2026  
**Version** : 1.0.0  
**Auteur** : Équipe SwipeTonPro
