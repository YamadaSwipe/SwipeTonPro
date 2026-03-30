import { supabase } from '@/integrations/supabase/client';

interface NotificationData {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  data?: any;
  pushEnabled?: boolean;
}

interface PushSubscription {
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export const pushNotificationService = {
  /**
   * Initialiser le service worker pour les notifications push
   */
  async initializePushNotifications(): Promise<boolean> {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push notifications non supportées');
        return false;
      }

      // Enregistrer le service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker enregistré');

      // Demander la permission pour les notifications
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Permission notifications refusée');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur initialisation push notifications:', error);
      return false;
    }
  },

  /**
   * S'abonner aux notifications push
   */
  async subscribeToPush(userId: string): Promise<{ success: boolean; subscription?: any; error?: string }> {
    try {
      if (!('serviceWorker' in navigator)) {
        return { success: false, error: 'Service Worker non supporté' };
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''),
      });

      // Sauvegarder l'abonnement en base
      const { error } = await (supabase as any)
        .from('push_subscriptions')
        .insert({
          user_id: userId,
          endpoint: subscription.endpoint,
          p256dh_key: JSON.stringify(subscription.getKey('p256dh')),
          auth_key: JSON.stringify(subscription.getKey('auth')),
          created_at: new Date().toISOString(),
        });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, subscription };
    } catch (error) {
      console.error('Erreur abonnement push:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Envoyer une notification push
   */
  async sendPushNotification(data: NotificationData): Promise<{ success: boolean; error?: string }> {
    try {
      // Récupérer les abonnements de l'utilisateur
      const { data: subscriptions, error } = await (supabase as any)
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', data.userId)
        .eq('active', true);

      if (error) {
        return { success: false, error: error.message };
      }

      if (!subscriptions || subscriptions.length === 0) {
        return { success: false, error: 'Aucun abonnement trouvé' };
      }

      // Envoyer à tous les abonnements
      const promises = subscriptions.map(async (sub) => {
        const subscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh_key,
            auth: sub.auth_key,
          },
        };

        const payload = JSON.stringify({
          title: data.title,
          message: data.message,
          type: data.type,
          data: data.data,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
        });

        return this.sendWebPush(subscription, payload);
      });

      await Promise.all(promises);
      return { success: true };
    } catch (error) {
      console.error('Erreur envoi notification push:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Envoyer une notification push via le service
   */
  async sendWebPush(subscription: any, payload: string): Promise<void> {
    try {
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          payload,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
    } catch (error) {
      console.error('Erreur envoi web push:', error);
      throw error;
    }
  },

  /**
   * Envoyer une notification en lot à plusieurs utilisateurs
   */
  async sendBulkPushNotifications(
    notifications: NotificationData[]
  ): Promise<{ success: boolean; sent: number; errors: number }> {
    let sent = 0;
    let errors = 0;

    for (const notification of notifications) {
      try {
        const result = await this.sendPushNotification(notification);
        if (result.success) {
          sent++;
        } else {
          errors++;
        }
      } catch (error) {
        console.error('Erreur notification bulk:', error);
        errors++;
      }
    }

    return { success: errors === 0, sent, errors };
  },

  /**
   * Créer une notification locale (navigateur)
   */
  createLocalNotification(data: NotificationData): void {
    if (!('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification(data.title, {
        body: data.message,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: data.data?.tag || 'default',
        requireInteraction: data.type === 'error',
      });
    }
  },

  /**
   * Programmer une notification différée
   */
  async scheduleNotification(
    data: NotificationData,
    delayMinutes: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const scheduledFor = new Date();
      scheduledFor.setMinutes(scheduledFor.getMinutes() + delayMinutes);

      const { error } = await (supabase as any)
        .from('scheduled_notifications')
        .insert({
          user_id: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
          data: data.data,
          scheduled_for: scheduledFor.toISOString(),
          status: 'scheduled',
        });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur programmation notification:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Traiter les notifications programmées
   */
  async processScheduledNotifications(): Promise<{ processed: number; errors: number }> {
    try {
      const now = new Date().toISOString();

      const { data: notifications, error } = await (supabase as any)
        .from('scheduled_notifications')
        .select('*')
        .eq('status', 'scheduled')
        .lte('scheduled_for', now);

      if (error) throw error;

      let processed = 0;
      let errors = 0;

      for (const notification of notifications || []) {
        try {
          // Envoyer la notification push
          await this.sendPushNotification({
            userId: notification.user_id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            data: notification.data,
          });

          // Marquer comme envoyée
          await (supabase as any)
            .from('scheduled_notifications')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
            })
            .eq('id', notification.id);

          processed++;
        } catch (error) {
          console.error('Erreur notification programmée:', error);
          
          // Marquer comme erreur
          await (supabase as any)
            .from('scheduled_notifications')
            .update({
              status: 'error',
              error_message: (error as Error).message,
              attempted_at: new Date().toISOString(),
            })
            .eq('id', notification.id);

          errors++;
        }
      }

      return { processed, errors };
    } catch (error) {
      console.error('Erreur traitement notifications programmées:', error);
      return { processed: 0, errors: 1 };
    }
  },

  /**
   * Obtenir les préférences de notification d'un utilisateur
   */
  async getNotificationPreferences(userId: string): Promise<any> {
    try {
      const { data, error } = await (supabase as any)
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // Pas de résultat
        throw error;
      }

      // Préférences par défaut
      const defaultPreferences = {
        push_enabled: true,
        email_enabled: true,
        new_lead: true,
        lead_qualified: true,
        call_scheduled: true,
        call_reminder: true,
        project_updated: true,
        message_received: true,
        marketing: false,
      };

      return data || defaultPreferences;
    } catch (error) {
      console.error('Erreur préférences notifications:', error);
      return null;
    }
  },

  /**
   * Mettre à jour les préférences de notification
   */
  async updateNotificationPreferences(
    userId: string,
    preferences: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase as any)
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur mise à jour préférences:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Désactiver les notifications pour un utilisateur
   */
  async disableNotifications(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Désactiver les abonnements push
      await (supabase as any)
        .from('push_subscriptions')
        .update({ active: false })
        .eq('user_id', userId);

      // Mettre à jour les préférences
      await this.updateNotificationPreferences(userId, {
        push_enabled: false,
        email_enabled: false,
      });

      return { success: true };
    } catch (error) {
      console.error('Erreur désactivation notifications:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Utilitaire pour convertir VAPID key
   */
  urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  },

  /**
   * Obtenir les statistiques de notifications
   */
  async getNotificationStats(userId?: string): Promise<any> {
    try {
      let query = supabase
        .from('notifications')
        .select('*');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        sent: data?.filter((n: any) => n.status === 'sent').length || 0,
        read: data?.filter((n: any) => n.read_at).length || 0,
        clicked: data?.filter((n: any) => n.clicked_at).length || 0,
        byType: {
          info: data?.filter((n: any) => n.type === 'info').length || 0,
          success: data?.filter((n: any) => n.type === 'success').length || 0,
          warning: data?.filter((n: any) => n.type === 'warning').length || 0,
          error: data?.filter((n: any) => n.type === 'error').length || 0,
        },
      };

      return stats;
    } catch (error) {
      console.error('Erreur stats notifications:', error);
      return null;
    }
  },
};

export default pushNotificationService;
