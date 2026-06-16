/**
 * @fileoverview Service de gestion des jalons de projet
 * @description Service centralisé pour gérer les jalons collaboratifs
 * @author Senior Architect
 * @version 1.0.0
 */

import { supabase } from '@/integrations/supabase/client';

// =====================================================
// TYPES
// =====================================================

export type MilestoneType = 
  | 'quote_accepted'
  | 'quote_rejected'
  | 'work_started'
  | 'progress_30'
  | 'progress_60'
  | 'work_completed';

export type MilestoneValidationStatus = 
  | 'pending_validation'
  | 'validated'
  | 'rejected';

export interface ProjectMilestone {
  id: string;
  project_id: string;
  milestone_type: MilestoneType;
  validation_status: MilestoneValidationStatus;
  proposed_by: string;
  proposed_by_name?: string;
  proposed_by_role?: string;
  proposed_at: string;
  proposed_comment?: string;
  validated_by?: string;
  validated_by_name?: string;
  validated_by_role?: string;
  validated_at?: string;
  validation_comment?: string;
  created_at: string;
  updated_at: string;
}

export interface MilestoneHistory {
  id: string;
  milestone_id: string;
  action: 'proposed' | 'validated' | 'rejected' | 'updated';
  performed_by: string;
  performed_at: string;
  previous_status?: MilestoneValidationStatus;
  new_status?: MilestoneValidationStatus;
  comment?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface ProposeMilestoneParams {
  projectId: string;
  milestoneType: MilestoneType;
  proposedBy: string;
  comment?: string;
}

export interface ValidateMilestoneParams {
  milestoneId: string;
  validatedBy: string;
  comment?: string;
  action?: 'validate' | 'reject';
}

// =====================================================
// LABELS FRANÇAIS POUR LES JALONS
// =====================================================

export const MILESTONE_LABELS: Record<MilestoneType, string> = {
  quote_accepted: 'Devis accepté',
  quote_rejected: 'Devis refusé',
  work_started: 'Début du chantier',
  progress_30: 'Avancement à 30%',
  progress_60: 'Avancement à 60%',
  work_completed: 'Fin de chantier',
};

export const MILESTONE_DESCRIPTIONS: Record<MilestoneType, string> = {
  quote_accepted: 'Le devis a été accepté par le client',
  quote_rejected: 'Le devis a été refusé par le client',
  work_started: 'Les travaux ont officiellement commencé',
  progress_30: 'Les travaux sont à 30% de leur avancement',
  progress_60: 'Les travaux sont à 60% de leur avancement',
  work_completed: 'Les travaux sont terminés',
};

export const STATUS_LABELS: Record<MilestoneValidationStatus, string> = {
  pending_validation: 'En attente de validation',
  validated: 'Validé',
  rejected: 'Rejeté',
};

// =====================================================
// SERVICE
// =====================================================

class ProjectMilestonesService {
  /**
   * Récupère tous les jalons d'un projet
   */
  async getProjectMilestones(projectId: string): Promise<{
    data: ProjectMilestone[] | null;
    error: Error | null;
  }> {
    try {
      const { data, error } = await supabase.rpc('get_project_milestones', {
        p_project_id: projectId,
      });

      if (error) {
        console.error('❌ Erreur récupération jalons:', error);
        return { data: null, error };
      }

      return { data: data as ProjectMilestone[], error: null };
    } catch (err) {
      console.error('❌ Exception récupération jalons:', err);
      return { data: null, error: err as Error };
    }
  }

  /**
   * Propose un nouveau jalon ou met à jour un jalon existant
   */
  async proposeMilestone(params: ProposeMilestoneParams): Promise<{
    data: { success: boolean; milestone_id?: string; status?: string; error?: string } | null;
    error: Error | null;
  }> {
    try {
      const { data, error } = await supabase.rpc('propose_milestone', {
        p_project_id: params.projectId,
        p_milestone_type: params.milestoneType,
        p_proposed_by: params.proposedBy,
        p_comment: params.comment || null,
      });

      if (error) {
        console.error('❌ Erreur proposition jalon:', error);
        return { data: null, error };
      }

      return { data: data as any, error: null };
    } catch (err) {
      console.error('❌ Exception proposition jalon:', err);
      return { data: null, error: err as Error };
    }
  }

  /**
   * Valide ou rejette un jalon proposé
   */
  async validateMilestone(params: ValidateMilestoneParams): Promise<{
    data: { success: boolean; milestone_id?: string; status?: string; error?: string } | null;
    error: Error | null;
  }> {
    try {
      const { data, error } = await supabase.rpc('validate_milestone', {
        p_milestone_id: params.milestoneId,
        p_validated_by: params.validatedBy,
        p_comment: params.comment || null,
        p_action: params.action || 'validate',
      });

      if (error) {
        console.error('❌ Erreur validation jalon:', error);
        return { data: null, error };
      }

      return { data: data as any, error: null };
    } catch (err) {
      console.error('❌ Exception validation jalon:', err);
      return { data: null, error: err as Error };
    }
  }

  /**
   * Récupère l'historique d'un jalon
   */
  async getMilestoneHistory(milestoneId: string): Promise<{
    data: MilestoneHistory[] | null;
    error: Error | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('milestone_validation_history')
        .select('*')
        .eq('milestone_id', milestoneId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Erreur récupération historique:', error);
        return { data: null, error };
      }

      return { data: data as MilestoneHistory[], error: null };
    } catch (err) {
      console.error('❌ Exception récupération historique:', err);
      return { data: null, error: err as Error };
    }
  }

  /**
   * Calcule le pourcentage d'avancement basé sur les jalons validés
   */
  calculateProgress(milestones: ProjectMilestone[]): number {
    const validatedMilestones = milestones.filter(
      (m) => m.validation_status === 'validated'
    );

    // Pondération des jalons
    const weights: Record<MilestoneType, number> = {
      quote_accepted: 10,
      quote_rejected: 0,
      work_started: 20,
      progress_30: 30,
      progress_60: 60,
      work_completed: 100,
    };

    let maxProgress = 0;
    validatedMilestones.forEach((milestone) => {
      const weight = weights[milestone.milestone_type] || 0;
      if (weight > maxProgress) {
        maxProgress = weight;
      }
    });

    return maxProgress;
  }

  /**
   * Détermine le prochain jalon suggéré
   */
  getNextSuggestedMilestone(milestones: ProjectMilestone[]): MilestoneType | null {
    const validatedTypes = new Set(
      milestones
        .filter((m) => m.validation_status === 'validated')
        .map((m) => m.milestone_type)
    );

    const sequence: MilestoneType[] = [
      'quote_accepted',
      'work_started',
      'progress_30',
      'progress_60',
      'work_completed',
    ];

    for (const type of sequence) {
      if (!validatedTypes.has(type)) {
        return type;
      }
    }

    return null;
  }

  /**
   * Vérifie si un utilisateur peut proposer un jalon
   */
  canProposeMilestone(
    userId: string,
    projectClientId: string,
    professionalUserId?: string
  ): boolean {
    return userId === projectClientId || userId === professionalUserId;
  }

  /**
   * Vérifie si un utilisateur peut valider un jalon
   */
  canValidateMilestone(
    userId: string,
    milestone: ProjectMilestone,
    projectClientId: string,
    professionalUserId?: string
  ): boolean {
    // L'utilisateur ne peut pas valider son propre jalon
    if (userId === milestone.proposed_by) {
      return false;
    }

    // L'utilisateur doit être soit le client soit le professionnel
    return userId === projectClientId || userId === professionalUserId;
  }

  /**
   * Formate une date pour l'affichage
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  /**
   * Obtient la couleur du badge selon le statut
   */
  getStatusColor(status: MilestoneValidationStatus): string {
    switch (status) {
      case 'validated':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'pending_validation':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }

  /**
   * Obtient l'icône selon le type de jalon
   */
  getMilestoneIcon(type: MilestoneType): string {
    switch (type) {
      case 'quote_accepted':
        return '✅';
      case 'quote_rejected':
        return '❌';
      case 'work_started':
        return '🚀';
      case 'progress_30':
        return '📊';
      case 'progress_60':
        return '📈';
      case 'work_completed':
        return '🎉';
      default:
        return '📍';
    }
  }
}

// Export singleton
export const projectMilestonesService = new ProjectMilestonesService();
