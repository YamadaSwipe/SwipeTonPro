import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfessionalProfile = Database['public']['Tables']['professionals']['Row'];
type Project = Database['public']['Tables']['projects']['Row'];

// Types pour les retours des fonctions de rate limiting
interface ProfessionalLimitResult {
  canSendEstimate: boolean;
  currentCount: number;
  remainingCount: number;
  resetTime: string;
  errorMessage?: string;
}

interface ProjectLimitResult {
  canReceiveEstimate: boolean;
  currentCount: number;
  remainingCount: number;
  projectStatus: string;
  errorMessage?: string;
}

interface ClientLimitResult {
  canCreateEstimate: boolean;
  currentCount: number;
  remainingCount: number;
  resetTime: string;
  errorMessage?: string;
}

export const rateLimitingService = {
  /**
   * Vérifie si un professionnel peut envoyer une estimation (limite 5/jour)
   */
  async checkProfessionalDailyLimit(
    professionalId: string,
    maxDailyEstimations: number = 5
  ): Promise<ProfessionalLimitResult> {
    try {
      console.log(
        '🔍 Vérification limite quotidienne pour pro:',
        professionalId
      );

      const { data, error } = await supabase.rpc(
        'check_professional_daily_estimate_limit',
        {
          p_professional_id: professionalId,
          p_max_daily_estimations: maxDailyEstimations,
        }
      );

      if (error) {
        console.error('❌ Erreur vérification limite pro:', error);
        return {
          canSendEstimate: false,
          currentCount: 0,
          remainingCount: 0,
          resetTime: '',
          errorMessage: 'Erreur de vérification de la limite',
        };
      }

      if (!data || data.length === 0) {
        return {
          canSendEstimate: false,
          currentCount: 0,
          remainingCount: 0,
          resetTime: '',
          errorMessage: 'Impossible de vérifier la limite',
        };
      }

      const result = data[0];
      return {
        canSendEstimate: result.can_send_estimate,
        currentCount: result.current_count,
        remainingCount: result.remaining_count,
        resetTime: result.reset_time,
        errorMessage: result.error_message || undefined,
      };
    } catch (error) {
      console.error('❌ Erreur service rate limiting pro:', error);
      return {
        canSendEstimate: false,
        currentCount: 0,
        remainingCount: 0,
        resetTime: '',
        errorMessage: 'Erreur serveur',
      };
    }
  },

  /**
   * Vérifie si un projet peut recevoir plus d'estimations (limite 3)
   */
  async checkProjectEstimationLimit(
    projectId: string,
    maxEstimations: number = 3
  ): Promise<ProjectLimitResult> {
    try {
      console.log('🔍 Vérification limite estimations pour projet:', projectId);

      const { data, error } = await supabase.rpc(
        'check_project_estimation_limit',
        {
          p_project_id: projectId,
          p_max_estimations: maxEstimations,
        }
      );

      if (error) {
        console.error('❌ Erreur vérification limite projet:', error);
        return {
          canReceiveEstimate: false,
          currentCount: 0,
          remainingCount: 0,
          projectStatus: 'error',
          errorMessage: 'Erreur de vérification de la limite',
        };
      }

      if (!data || data.length === 0) {
        return {
          canReceiveEstimate: false,
          currentCount: 0,
          remainingCount: 0,
          projectStatus: 'not_found',
          errorMessage: 'Projet non trouvé',
        };
      }

      const result = data[0];
      return {
        canReceiveEstimate: result.can_receive_estimate,
        currentCount: result.current_count,
        remainingCount: result.remaining_count,
        projectStatus: result.project_status,
        errorMessage: result.error_message || undefined,
      };
    } catch (error) {
      console.error('❌ Erreur service rate limiting projet:', error);
      return {
        canReceiveEstimate: false,
        currentCount: 0,
        remainingCount: 0,
        projectStatus: 'error',
        errorMessage: 'Erreur serveur',
      };
    }
  },

  /**
   * Vérifie si un particulier peut créer une estimation (limite 2/semaine)
   */
  async checkClientWeeklyLimit(
    clientId: string,
    maxWeeklyEstimations: number = 2
  ): Promise<ClientLimitResult> {
    try {
      console.log('🔍 Vérification limite hebdomadaire pour client:', clientId);

      const { data, error } = await supabase.rpc(
        'check_client_weekly_estimation_limit',
        {
          p_client_id: clientId,
          p_max_weekly_estimations: maxWeeklyEstimations,
        }
      );

      if (error) {
        console.error('❌ Erreur vérification limite client:', error);
        return {
          canCreateEstimate: false,
          currentCount: 0,
          remainingCount: 0,
          resetTime: '',
          errorMessage: 'Erreur de vérification de la limite',
        };
      }

      if (!data || data.length === 0) {
        return {
          canCreateEstimate: false,
          currentCount: 0,
          remainingCount: 0,
          resetTime: '',
          errorMessage: 'Impossible de vérifier la limite',
        };
      }

      const result = data[0];
      return {
        canCreateEstimate: result.can_create_estimate,
        currentCount: result.current_count,
        remainingCount: result.remaining_count,
        resetTime: result.reset_time,
        errorMessage: result.error_message || undefined,
      };
    } catch (error) {
      console.error('❌ Erreur service rate limiting client:', error);
      return {
        canCreateEstimate: false,
        currentCount: 0,
        remainingCount: 0,
        resetTime: '',
        errorMessage: 'Erreur serveur',
      };
    }
  },

  /**
   * Incrémente le compteur de réponses d'un projet
   */
  async incrementProjectEstimationCount(projectId: string): Promise<void> {
    try {
      // Récupérer la valeur actuelle puis incrémenter
      const { data: project, error: fetchError } = await supabase
        .from('projects')
        .select('estimation_responses_count')
        .eq('id', projectId)
        .single();

      if (fetchError) {
        console.error('❌ Erreur récupération compteur:', fetchError);
        return;
      }

      const currentCount = project?.estimation_responses_count || 0;
      const newCount = currentCount + 1;

      const { error } = await supabase
        .from('projects')
        .update({
          estimation_responses_count: newCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId);

      if (error) {
        console.error('❌ Erreur incrémentation compteur projet:', error);
      } else {
        console.log(
          '✅ Compteur estimations incrémenté pour projet:',
          projectId,
          '→',
          newCount
        );
      }
    } catch (error) {
      console.error('❌ Erreur service incrémentation:', error);
    }
  },

  /**
   * Marque un projet comme complet
   */
  async markProjectAsCompleted(projectId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          estimation_status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId);

      if (error) {
        console.error('❌ Erreur marquage projet complet:', error);
      } else {
        console.log('✅ Projet marqué comme complet:', projectId);
      }
    } catch (error) {
      console.error('❌ Erreur service marquage complet:', error);
    }
  },

  /**
   * Réinitialise les compteurs quotidiens (à appeler via cron job)
   */
  async resetDailyCounters(): Promise<void> {
    try {
      const { error } = await supabase.rpc('reset_daily_estimate_counters');

      if (error) {
        console.error('❌ Erreur réinitialisation compteurs:', error);
      } else {
        console.log('✅ Compteurs quotidiens réinitialisés');
      }
    } catch (error) {
      console.error('❌ Erreur service réinitialisation:', error);
    }
  },

  /**
   * Obtient les statistiques de rate limiting pour un professionnel
   */
  async getProfessionalStats(professionalId: string): Promise<{
    dailyCount: number;
    remainingToday: number;
    resetTime: string;
  }> {
    const result = await this.checkProfessionalDailyLimit(professionalId);
    return {
      dailyCount: result.currentCount,
      remainingToday: result.remainingCount,
      resetTime: result.resetTime,
    };
  },

  /**
   * Obtient les statistiques de rate limiting pour un client
   */
  async getClientStats(clientId: string): Promise<{
    weeklyCount: number;
    remainingThisWeek: number;
    resetTime: string;
  }> {
    const result = await this.checkClientWeeklyLimit(clientId);
    return {
      weeklyCount: result.currentCount,
      remainingThisWeek: result.remainingCount,
      resetTime: result.resetTime,
    };
  },
};

export type { ProfessionalLimitResult, ProjectLimitResult, ClientLimitResult };
