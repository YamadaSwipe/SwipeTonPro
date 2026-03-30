import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Notification = Database['public']['Tables']['notifications']['Row'];
type ProjectCall = any;

export const notificationService = {
  // Récupérer les notifications d'un utilisateur
  async getUserNotifications(userId: string): Promise<{ data: Notification[] | null, error: Error | null }> {
    try {
      const { data, error } = await (supabase as any)
        .from('notifications')
        .select(`
          *,
          projects!inner(title, category, city, status)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      return { data, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  // Marquer une notification comme lue
  async markAsRead(notificationId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await (supabase as any)
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId);

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  },

  // Marquer toutes les notifications comme lues
  async markAllAsRead(userId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await (supabase as any)
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('read', false);

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  },

  // Compter les notifications non lues
  async getUnreadCount(userId: string): Promise<{ data: number | null, error: Error | null }> {
    try {
      const { data, error } = await (supabase as any)
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('read', false);

      return { data: data?.length || 0, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  // Créer une notification manuelle
  async createNotification(notification: {
    userId: string;
    projectId?: string;
    type: string;
    title: string;
    message: string;
    data?: any;
  }): Promise<{ data: Notification | null, error: Error | null }> {
    try {
      const { data, error } = await (supabase as any)
        .from('notifications')
        .insert({
          user_id: notification.userId,
          project_id: notification.projectId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  // Envoyer un appel téléphonique
  async scheduleCall(callData: {
    projectId: string;
    userId: string;
    professionalId: string;
    scheduledDate: Date;
    notes?: string;
  }): Promise<{ data: ProjectCall | null, error: Error | null }> {
    try {
      const { data, error } = await (supabase as any)
        .from('project_calls')
        .insert({
          project_id: callData.projectId,
          user_id: callData.userId,
          professional_id: callData.professionalId,
          call_date: callData.scheduledDate.toISOString(),
          notes: callData.notes,
          status: 'scheduled',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  // Confirmer un appel
  async confirmCall(callId: string, duration?: number): Promise<{ error: Error | null }> {
    try {
      const { error } = await (supabase as any)
        .from('project_calls')
        .update({ 
          status: 'completed',
          duration: duration,
          updated_at: new Date().toISOString()
        })
        .eq('id', callId);

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  },

  // Récupérer les appels d'un projet
  async getProjectCalls(projectId: string): Promise<{ data: ProjectCall[] | null, error: Error | null }> {
    try {
      const { data, error } = await (supabase as any)
        .from('project_calls')
        .select(`
          *,
          professional_profile!inner(
            company_name,
            full_name,
            phone,
            email
          )
        `)
        .eq('project_id', projectId)
        .order('call_date', { ascending: false });

      return { data, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }
};
