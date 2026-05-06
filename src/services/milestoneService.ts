import { supabase } from '@/integrations/supabase/client';

interface MilestoneData {
  projectId: string;
  milestoneName: string;
  milestoneOrder: number;
  percentage: number;
  amount: number;
  dueDate?: string;
}

interface MilestoneValidation {
  milestoneId: string;
  proValidationPhotos: string[];
  proValidationNotes?: string;
  clientValidationStatus: 'approved' | 'rejected' | 'disputed';
  clientValidationNotes?: string;
}

interface MilestoneCreateResult {
  success: boolean;
  milestoneId?: string;
  error?: string;
}

interface MilestoneValidationResult {
  success: boolean;
  error?: string;
  stripeTransferId?: string;
}

export const milestoneService = {
  /**
   * Crée les milestones par défaut pour un projet
   */
  async createDefaultMilestones(
    projectId: string,
    totalAmount: number
  ): Promise<MilestoneCreateResult> {
    try {
      // Configuration par défaut : 30% acompte, 40% étape 1, 30% finition
      const defaultMilestones = [
        {
          milestone_name: 'Acompte',
          milestone_order: 1,
          percentage: 30,
          amount: Math.round(totalAmount * 0.3),
        },
        {
          milestone_name: 'Étape 1',
          milestone_order: 2,
          percentage: 40,
          amount: Math.round(totalAmount * 0.4),
        },
        {
          milestone_name: 'Finition',
          milestone_order: 3,
          percentage: 30,
          amount: Math.round(totalAmount * 0.3),
        },
      ];

      // Insérer les milestones
      const { data: milestones, error } = await supabase
        .from('project_milestones')
        .insert(
          defaultMilestones.map((milestone) => ({
            project_id: projectId,
            ...milestone,
          }))
        )
        .select();

      if (error) {
        console.error('❌ Erreur création milestones:', error);
        return {
          success: false,
          error: 'Erreur lors de la création des étapes de paiement',
        };
      }

      return {
        success: true,
        milestoneId: milestones[0]?.id, // Retourner le premier ID
      };
    } catch (error) {
      console.error('❌ Erreur service createDefaultMilestones:', error);
      return {
        success: false,
        error: 'Erreur serveur lors de la création des milestones',
      };
    }
  },

  /**
   * Crée une milestone personnalisée
   */
  async createMilestone(
    milestoneData: MilestoneData
  ): Promise<MilestoneCreateResult> {
    try {
      const { data: milestone, error } = await supabase
        .from('project_milestones')
        .insert({
          project_id: milestoneData.projectId,
          milestone_name: milestoneData.milestoneName,
          milestone_order: milestoneData.milestoneOrder,
          percentage: milestoneData.percentage,
          amount: milestoneData.amount,
          due_date: milestoneData.dueDate,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur création milestone:', error);
        return {
          success: false,
          error: "Erreur lors de la création de l'étape de paiement",
        };
      }

      return {
        success: true,
        milestoneId: milestone.id,
      };
    } catch (error) {
      console.error('❌ Erreur service createMilestone:', error);
      return {
        success: false,
        error: 'Erreur serveur lors de la création de la milestone',
      };
    }
  },

  /**
   * Valide une milestone par le professionnel (avec photos)
   */
  async validateByProfessional(
    milestoneId: string,
    photos: string[],
    notes?: string
  ): Promise<MilestoneValidationResult> {
    try {
      const { error } = await supabase
        .from('project_milestones')
        .update({
          pro_validation_photos: photos,
          pro_validation_notes: notes,
          pro_validated_at: new Date().toISOString(),
          status: 'in_progress',
        })
        .eq('id', milestoneId);

      if (error) {
        console.error('❌ Erreur validation pro:', error);
        return {
          success: false,
          error: 'Erreur lors de la validation par le professionnel',
        };
      }

      // Notifier le client
      await this.notifyClientValidation(milestoneId);

      return { success: true };
    } catch (error) {
      console.error('❌ Erreur service validateByProfessional:', error);
      return {
        success: false,
        error: 'Erreur serveur lors de la validation professionnelle',
      };
    }
  },

  /**
   * Valide une milestone par le client
   */
  async validateByClient(
    milestoneId: string,
    validationData: MilestoneValidation
  ): Promise<MilestoneValidationResult> {
    try {
      // Récupérer les informations de la milestone
      const { data: milestone, error: fetchError } = await supabase
        .from('project_milestones')
        .select(
          `
          *,
          projects!inner(
            professional_id,
            stripe_escrow_active
          )
        `
        )
        .eq('id', milestoneId)
        .single();

      if (fetchError || !milestone) {
        return {
          success: false,
          error: 'Milestone non trouvée',
        };
      }

      // Mettre à jour la validation client
      const { error } = await supabase
        .from('project_milestones')
        .update({
          client_validation_status: validationData.clientValidationStatus,
          client_validation_notes: validationData.clientValidationNotes,
          client_validated_at: new Date().toISOString(),
          status:
            validationData.clientValidationStatus === 'approved'
              ? 'completed'
              : 'disputed',
        })
        .eq('id', milestoneId);

      if (error) {
        console.error('❌ Erreur validation client:', error);
        return {
          success: false,
          error: 'Erreur lors de la validation par le client',
        };
      }

      // Si approuvé, déclencher le transfert Stripe
      let stripeTransferId;
      if (
        validationData.clientValidationStatus === 'approved' &&
        milestone.projects.stripe_escrow_active
      ) {
        const transferResult = await this.processStripeTransfer(
          milestoneId,
          milestone.amount
        );
        if (!transferResult.success) {
          return transferResult;
        }
        stripeTransferId = transferResult.transferId;
      }

      // Notifier le professionnel
      await this.notifyProfessionalValidation(
        milestoneId,
        validationData.clientValidationStatus
      );

      return {
        success: true,
        stripeTransferId,
      };
    } catch (error) {
      console.error('❌ Erreur service validateByClient:', error);
      return {
        success: false,
        error: 'Erreur serveur lors de la validation client',
      };
    }
  },

  /**
   * Traite le transfert Stripe pour une milestone
   */
  async processStripeTransfer(
    milestoneId: string,
    amount: number
  ): Promise<MilestoneValidationResult> {
    try {
      // Récupérer les informations du projet et professionnel
      const { data: milestone, error } = await supabase
        .from('project_milestones')
        .select(
          `
          *,
          projects!inner(
            professional_id,
            client_id
          ),
          professionals!inner(
            user_id,
            stripe_account_id
          )
        `
        )
        .eq('id', milestoneId)
        .single();

      if (error || !milestone) {
        return {
          success: false,
          error: 'Informations de milestone non trouvées',
        };
      }

      // Créer le transfert Stripe (simulation - à implémenter avec Stripe SDK)
      const stripeTransferId = `transfer_${Date.now()}_${milestoneId}`;

      // Mettre à jour la milestone avec l'ID du transfert
      const { error: updateError } = await supabase
        .from('project_milestones')
        .update({
          stripe_transfer_id: stripeTransferId,
          completed_at: new Date().toISOString(),
        })
        .eq('id', milestoneId);

      if (updateError) {
        console.error('❌ Erreur mise à jour transfert:', updateError);
        return {
          success: false,
          error: "Erreur lors de l'enregistrement du transfert",
        };
      }

      console.log('💰 TRANSFERT STRIPE CRÉÉ:', {
        milestoneId,
        amount,
        transferId: stripeTransferId,
        professionalId: milestone.professionals.user_id,
      });

      return {
        success: true,
        stripeTransferId,
      };
    } catch (error) {
      console.error('❌ Erreur service processStripeTransfer:', error);
      return {
        success: false,
        error: 'Erreur lors du traitement du transfert Stripe',
      };
    }
  },

  /**
   * Récupère les milestones d'un projet
   */
  async getProjectMilestones(projectId: string): Promise<{
    success: boolean;
    milestones?: any[];
    error?: string;
  }> {
    try {
      const { data: milestones, error } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('milestone_order', { ascending: true });

      if (error) {
        console.error('❌ Erreur récupération milestones:', error);
        return {
          success: false,
          error: 'Erreur lors de la récupération des étapes de paiement',
        };
      }

      return {
        success: true,
        milestones,
      };
    } catch (error) {
      console.error('❌ Erreur service getProjectMilestones:', error);
      return {
        success: false,
        error: 'Erreur serveur lors de la récupération',
      };
    }
  },

  /**
   * Vérifie si toutes les milestones sont complétées
   */
  async areAllMilestonesCompleted(projectId: string): Promise<boolean> {
    try {
      const { data: milestones, error } = await supabase
        .from('project_milestones')
        .select('status')
        .eq('project_id', projectId);

      if (error || !milestones) {
        return false;
      }

      return milestones.every((m) => m.status === 'completed');
    } catch (error) {
      console.error('❌ Erreur service areAllMilestonesCompleted:', error);
      return false;
    }
  },

  /**
   * Notifie le client de la validation professionnelle
   */
  async notifyClientValidation(milestoneId: string): Promise<void> {
    try {
      // Récupérer les informations pour la notification
      const { data: milestone } = await supabase
        .from('project_milestones')
        .select(
          `
          *,
          projects!inner(
            client_id,
            title
          )
        `
        )
        .eq('id', milestoneId)
        .single();

      if (milestone) {
        // Envoyer notification (à implémenter)
        console.log('📧 NOTIFICATION CLIENT VALIDATION PRO:', {
          milestoneId,
          client: milestone.projects.client_id,
          projectTitle: milestone.projects.title,
          milestoneName: milestone.milestone_name,
        });
      }
    } catch (error) {
      console.error('❌ Erreur notification client validation:', error);
    }
  },

  /**
   * Notifie le professionnel de la validation client
   */
  async notifyProfessionalValidation(
    milestoneId: string,
    validationStatus: 'approved' | 'rejected' | 'disputed'
  ): Promise<void> {
    try {
      // Récupérer les informations pour la notification
      const { data: milestone } = await supabase
        .from('project_milestones')
        .select(
          `
          *,
          projects!inner(
            professional_id,
            title
          )
        `
        )
        .eq('id', milestoneId)
        .single();

      if (milestone) {
        // Envoyer notification (à implémenter)
        console.log('📧 NOTIFICATION PRO VALIDATION CLIENT:', {
          milestoneId,
          professional: milestone.projects.professional_id,
          projectTitle: milestone.projects.title,
          milestoneName: milestone.milestone_name,
          validationStatus,
        });
      }
    } catch (error) {
      console.error('❌ Erreur notification pro validation:', error);
    }
  },
};

export type {
  MilestoneData,
  MilestoneValidation,
  MilestoneCreateResult,
  MilestoneValidationResult,
};
