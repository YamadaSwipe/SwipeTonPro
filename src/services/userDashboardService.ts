/**
 * @fileoverview Service pour le Dashboard Utilisateur
 * @description Gère les données du dashboard utilisateur avec historique complet,
 * suivi des actions, statut financier Stripe et paiements séquestrés
 * @author Senior Architect
 * @version 1.0.0
 */

import { supabase } from '@/integrations/supabase/client';

// =====================================================
// TYPES
// =====================================================

export interface DashboardData {
  user_id: string;
  generated_at: string;
  stats: DashboardStats;
  projects: ProjectData[];
  messages_history: MessageHistory[];
  actions_timeline: ActionTimeline[];
  financial_status: FinancialStatus[];
}

export interface DashboardStats {
  total_projects: number;
  pending_projects: number;
  published_projects: number;
  in_progress_projects: number;
  completed_projects: number;
  total_spent: number;
  total_matches: number;
  total_conversations: number;
}

export interface ProjectData {
  id: string;
  title: string;
  status: string;
  category: string;
  city: string;
  budget_min?: number;
  budget_max?: number;
  estimated_budget_min?: number;
  estimated_budget_max?: number;
  created_at: string;
  updated_at?: string;
}

export interface MessageHistory {
  project_id: string;
  project_title: string;
  conversation_id?: string;
  professional_id?: string;
  professional_name?: string;
  message_id?: string;
  message_content?: string;
  message_date?: string;
  is_read?: boolean;
  sender_type?: 'client' | 'professional';
  mini_message_content?: string;
  mini_message_date?: string;
  mini_sender_type?: string;
  is_pre_match?: boolean;
}

export interface ActionTimeline {
  project_id: string;
  project_title: string;
  action_type: 'project_created' | 'interest_signaled' | 'match_paid' | 'conversation_started' | 'bid_received';
  action_date: string;
  professional_id?: string;
  professional_name?: string;
  interest_status?: string;
  payment_status?: string;
  payment_amount?: number;
  bid_amount?: number;
  bid_status?: string;
}

export interface FinancialStatus {
  project_id: string;
  project_title: string;
  budget_min?: number;
  budget_max?: number;
  match_payment_id?: string;
  professional_id?: string;
  professional_name?: string;
  match_fee_amount?: number;
  match_fee_currency?: string;
  match_payment_status?: string;
  stripe_payment_intent_id?: string;
  paid_at?: string;
  escrow_enabled: boolean;
  escrow_amount?: number;
  escrow_status?: string;
  bid_amount?: number;
  bid_status?: string;
  total_potential_cost: number;
  overall_payment_status: 'no_payment' | 'payment_pending' | 'payment_failed' | 'match_paid' | 'fully_paid';
}

export interface StripeStats {
  total_match_payments: number;
  successful_payments: number;
  pending_payments: number;
  failed_payments: number;
  total_amount_paid: number;
  total_escrow_amount: number;
  active_escrows: number;
  payment_methods: string[];
  last_payment_date?: string;
}

// =====================================================
// SERVICE CLASS
// =====================================================

export class UserDashboardService {
  private static instance: UserDashboardService;

  private constructor() {}

  static getInstance(): UserDashboardService {
    if (!UserDashboardService.instance) {
      UserDashboardService.instance = new UserDashboardService();
    }
    return UserDashboardService.instance;
  }

  /**
   * Récupère toutes les données du dashboard utilisateur
   */
  async getDashboardData(userId: string): Promise<{
    data: DashboardData | null;
    error: Error | null;
  }> {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 UserDashboardService: Fetching dashboard data for user:', userId);
      }

      // Appeler la fonction SQL qui retourne toutes les données en une seule requête
      const { data, error } = await supabase.rpc('get_user_dashboard_data', {
        p_user_id: userId,
      });

      if (error) {
        console.error('❌ Error fetching dashboard data:', error);
        return { data: null, error };
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Dashboard data fetched successfully');
      }

      return { data: data as DashboardData, error: null };
    } catch (error) {
      console.error('❌ Exception in getDashboardData:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Récupère les statistiques Stripe d'un utilisateur
   */
  async getStripeStats(userId: string): Promise<{
    data: StripeStats | null;
    error: Error | null;
  }> {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('💳 UserDashboardService: Fetching Stripe stats for user:', userId);
      }

      const { data, error } = await supabase.rpc('get_user_stripe_stats', {
        p_user_id: userId,
      });

      if (error) {
        console.error('❌ Error fetching Stripe stats:', error);
        return { data: null, error };
      }

      return { data: data as StripeStats, error: null };
    } catch (error) {
      console.error('❌ Exception in getStripeStats:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Récupère l'historique des messages pour un projet spécifique
   */
  async getProjectMessages(projectId: string): Promise<{
    data: MessageHistory[] | null;
    error: Error | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('user_project_messages_history')
        .select('*')
        .eq('project_id', projectId)
        .order('message_date', { ascending: false });

      if (error) {
        console.error('❌ Error fetching project messages:', error);
        return { data: null, error };
      }

      return { data: data as MessageHistory[], error: null };
    } catch (error) {
      console.error('❌ Exception in getProjectMessages:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Récupère la timeline des actions pour un projet spécifique
   */
  async getProjectActions(projectId: string): Promise<{
    data: ActionTimeline[] | null;
    error: Error | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('user_project_actions_timeline')
        .select('*')
        .eq('project_id', projectId)
        .order('action_date', { ascending: false });

      if (error) {
        console.error('❌ Error fetching project actions:', error);
        return { data: null, error };
      }

      return { data: data as ActionTimeline[], error: null };
    } catch (error) {
      console.error('❌ Exception in getProjectActions:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Récupère le statut financier pour un projet spécifique
   */
  async getProjectFinancialStatus(projectId: string): Promise<{
    data: FinancialStatus | null;
    error: Error | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('user_project_financial_status')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (error) {
        console.error('❌ Error fetching project financial status:', error);
        return { data: null, error };
      }

      return { data: data as FinancialStatus, error: null };
    } catch (error) {
      console.error('❌ Exception in getProjectFinancialStatus:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Récupère tous les paiements Stripe d'un utilisateur
   */
  async getUserPayments(userId: string): Promise<{
    data: any[] | null;
    error: Error | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('match_payments')
        .select(`
          *,
          projects (
            id,
            title,
            category,
            city
          ),
          professionals (
            id,
            company_name,
            user_id
          )
        `)
        .eq('projects.client_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching user payments:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('❌ Exception in getUserPayments:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Vérifie si un paiement séquestré est activé pour un projet
   */
  async checkEscrowStatus(projectId: string): Promise<{
    enabled: boolean;
    amount?: number;
    status?: string;
    error: Error | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('match_payments')
        .select('metadata')
        .eq('project_id', projectId)
        .single();

      if (error) {
        return { enabled: false, error };
      }

      const metadata = data?.metadata as any;
      const enabled = metadata?.escrow_enabled === 'true' || metadata?.escrow_enabled === true;
      const amount = metadata?.escrow_amount ? parseFloat(metadata.escrow_amount) : undefined;
      const status = metadata?.escrow_status;

      return { enabled, amount, status, error: null };
    } catch (error) {
      console.error('❌ Exception in checkEscrowStatus:', error);
      return { enabled: false, error: error as Error };
    }
  }

  /**
   * Formate un montant en devise
   */
  formatCurrency(amount: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  /**
   * Formate une date
   */
  formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }

  /**
   * Obtient le libellé d'un type d'action
   */
  getActionLabel(actionType: string): string {
    const labels: Record<string, string> = {
      project_created: 'Projet créé',
      interest_signaled: 'Intérêt manifesté',
      match_paid: 'Match validé (payé)',
      conversation_started: 'Conversation démarrée',
      bid_received: 'Devis reçu',
    };
    return labels[actionType] || actionType;
  }

  /**
   * Obtient le libellé d'un statut de paiement
   */
  getPaymentStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      no_payment: 'Aucun paiement',
      payment_pending: 'Paiement en attente',
      payment_failed: 'Paiement échoué',
      match_paid: 'Match payé',
      fully_paid: 'Entièrement payé',
      succeeded: 'Réussi',
      pending: 'En attente',
      failed: 'Échoué',
    };
    return labels[status] || status;
  }

  /**
   * Obtient la couleur d'un statut de paiement
   */
  getPaymentStatusColor(status: string): string {
    const colors: Record<string, string> = {
      no_payment: 'gray',
      payment_pending: 'yellow',
      payment_failed: 'red',
      match_paid: 'green',
      fully_paid: 'green',
      succeeded: 'green',
      pending: 'yellow',
      failed: 'red',
    };
    return colors[status] || 'gray';
  }
}

// Export singleton instance
export const userDashboardService = UserDashboardService.getInstance();
