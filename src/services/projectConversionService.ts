import { supabase } from '@/integrations/supabase/client';
import { milestoneService } from '@/services/milestoneService';
import { calculateMatchingFee } from '@/services/matchPaymentService';

interface ConversionData {
  estimationId: string;
  professionalId: string;
  projectTitle?: string;
  projectDescription?: string;
  estimatedBudget?: number;
  milestones?: Array<{
    name: string;
    percentage: number;
    dueDate?: string;
  }>;
}

interface ConversionResult {
  success: boolean;
  projectId?: string;
  matchId?: string;
  stripeCheckoutUrl?: string;
  error?: string;
}

export const projectConversionService = {
  /**
   * Convertit une estimation en projet ferme
   */
  async convertEstimationToProject(conversionData: ConversionData): Promise<ConversionResult> {
    try {
      console.log('🔄 Début conversion estimation → projet ferme:', {
        estimationId: conversionData.estimationId,
        professionalId: conversionData.professionalId
      });

      // 1. Récupérer les données de l'estimation
      const { data: estimation, error: estimationError } = await supabase
        .from('projects')
        .select(`
          *,
          client_id,
          title,
          description,
          category,
          city,
          postal_code,
          surface,
          budget_min,
          budget_max,
          photos,
          ai_price_estimate
        `)
        .eq('id', conversionData.estimationId)
        .eq('project_type', 'estimation')
        .single();

      if (estimationError || !estimation) {
        console.error('❌ Erreur récupération estimation:', estimationError);
        return {
          success: false,
          error: 'Estimation non trouvée ou déjà convertie'
        };
      }

      // 2. Vérifier que l'estimation n'est pas déjà convertie
      if (estimation.estimation_status === 'converted') {
        return {
          success: false,
          error: 'Cette estimation a déjà été convertie en projet'
        };
      }

      // 3. Vérifier que le professionnel est bien lié à cette estimation
      const { data: existingMatch, error: matchError } = await supabase
        .from('match_payments')
        .select('id, status')
        .eq('project_id', conversionData.estimationId)
        .eq('professional_id', conversionData.professionalId)
        .single();

      if (matchError || !existingMatch) {
        return {
          success: false,
          error: 'Aucun match trouvé entre ce professionnel et cette estimation'
        };
      }

      // 4. Calculer le budget du projet ferme
      const projectBudget = conversionData.estimatedBudget || 
        estimation.ai_price_estimate?.max || 
        estimation.budget_max;

      if (!projectBudget || projectBudget < 1000) {
        return {
          success: false,
          error: 'Budget invalide pour la création du projet ferme'
        };
      }

      // 5. Créer le projet ferme
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert({
          client_id: estimation.client_id,
          title: conversionData.projectTitle || `[PROJET FERME] ${estimation.title}`,
          description: conversionData.projectDescription || estimation.description,
          category: estimation.category,
          city: estimation.city,
          postal_code: estimation.postal_code,
          surface: estimation.surface,
          budget_min: Math.round(projectBudget * 0.9), // 10% de marge
          budget_max: projectBudget,
          project_type: 'firm_project',
          stripe_escrow_active: true,
          ai_price_estimate: estimation.ai_price_estimate,
          photos: estimation.photos,
          parent_project_id: conversionData.estimationId,
          validation_status: 'approved' // Auto-approuvé car conversion
        })
        .select()
        .single();

      if (projectError || !newProject) {
        console.error('❌ Erreur création projet ferme:', projectError);
        return {
          success: false,
          error: 'Erreur lors de la création du projet ferme'
        };
      }

      // 6. Créer les milestones par défaut
      const milestoneResult = await milestoneService.createDefaultMilestones(
        newProject.id,
        projectBudget
      );

      if (!milestoneResult.success) {
        // Nettoyer le projet créé si erreur milestones
        await supabase.from('projects').delete().eq('id', newProject.id);
        return {
          success: false,
          error: 'Erreur lors de la création des étapes de paiement'
        };
      }

      // 7. Calculer les frais de mise en relation
      const matchingFee = await calculateMatchingFee(projectBudget);

      // 8. Créer le match pour le projet ferme
      const { data: newMatch, error: newMatchError } = await supabase
        .from('match_payments')
        .insert({
          project_id: newProject.id,
          professional_id: conversionData.professionalId,
          amount: projectBudget,
          fee_amount: matchingFee,
          status: 'pending',
          payment_method: 'stripe_escrow',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (newMatchError || !newMatch) {
        console.error('❌ Erreur création match:', newMatchError);
        return {
          success: false,
          error: 'Erreur lors de la création du match'
        };
      }

      // 9. Mettre à jour le statut de l'estimation
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          estimation_status: 'converted',
          converted_at: new Date().toISOString()
        })
        .eq('id', conversionData.estimationId);

      if (updateError) {
        console.error('❌ Erreur mise à jour estimation:', updateError);
      }

      // 10. Créer la session Stripe pour le paiement
      const stripeCheckoutUrl = await this.createStripeCheckoutSession(
        newProject.id,
        newMatch.id,
        projectBudget,
        matchingFee
      );

      // 11. Notifier le professionnel
      await this.notifyProfessionalConversion(
        conversionData.professionalId,
        estimation,
        newProject
      );

      // 12. Notifier le client
      await this.notifyClientConversion(
        estimation.client_id,
        estimation,
        newProject
      );

      console.log('✅ Conversion réussie:', {
        estimationId: conversionData.estimationId,
        projectId: newProject.id,
        matchId: newMatch.id,
        budget: projectBudget
      });

      return {
        success: true,
        projectId: newProject.id,
        matchId: newMatch.id,
        stripeCheckoutUrl
      };

    } catch (error) {
      console.error('❌ Erreur service convertEstimationToProject:', error);
      return {
        success: false,
        error: 'Erreur serveur lors de la conversion'
      };
    }
  },

  /**
   * Crée une session Stripe checkout pour le paiement
   */
  private async createStripeCheckoutSession(
    projectId: string,
    matchId: string,
    projectAmount: number,
    feeAmount: number
  ): Promise<string> {
    try {
      // Simulation - à implémenter avec Stripe SDK
      const checkoutSessionId = `cs_${Date.now()}_${projectId}`;
      const checkoutUrl = `https://checkout.stripe.com/pay/${checkoutSessionId}`;

      console.log('💳 SESSION STRIPE CRÉÉE:', {
        projectId,
        matchId,
        projectAmount,
        feeAmount,
        totalAmount: projectAmount + feeAmount,
        checkoutSessionId
      });

      return checkoutUrl;

    } catch (error) {
      console.error('❌ Erreur création session Stripe:', error);
      throw new Error('Erreur lors de la création de la session de paiement');
    }
  },

  /**
   * Notifie le professionnel de la conversion
   */
  private async notifyProfessionalConversion(
    professionalId: string,
    estimation: any,
    newProject: any
  ): Promise<void> {
    try {
      // Récupérer les infos du professionnel
      const { data: professional } = await supabase
        .from('professionals')
        .select('user_id, company_name')
        .eq('id', professionalId)
        .single();

      if (professional) {
        // Envoyer notification (à implémenter)
        console.log('📧 NOTIFICATION PRO CONVERSION:', {
          professionalId: professional.user_id,
          companyName: professional.company_name,
          estimationTitle: estimation.title,
          newProjectId: newProject.id,
          budget: newProject.budget_max
        });
      }
    } catch (error) {
      console.error('❌ Erreur notification pro conversion:', error);
    }
  },

  /**
   * Notifie le client de la conversion
   */
  private async notifyClientConversion(
    clientId: string,
    estimation: any,
    newProject: any
  ): Promise<void> {
    try {
      // Envoyer notification (à implémenter)
      console.log('📧 NOTIFICATION CLIENT CONVERSION:', {
        clientId,
        estimationTitle: estimation.title,
        newProjectId: newProject.id,
        budget: newProject.budget_max,
        stripeEscrow: newProject.stripe_escrow_active
      });
    } catch (error) {
      console.error('❌ Erreur notification client conversion:', error);
    }
  },

  /**
   * Récupère l'historique des conversions d'un client
   */
  async getClientConversions(clientId: string): Promise<{
    success: boolean;
    conversions?: any[];
    error?: string;
  }> {
    try {
      const { data: conversions, error } = await supabase
        .from('projects')
        .select(`
          *,
          parent:projects!projects_parent_project_id_fkey(
            title,
            created_at
          )
        `)
        .eq('client_id', clientId)
        .eq('project_type', 'firm_project')
        .not('parent_project_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erreur récupération conversions:', error);
        return {
          success: false,
          error: 'Erreur lors de la récupération des conversions'
        };
      }

      return {
        success: true,
        conversions
      };

    } catch (error) {
      console.error('❌ Erreur service getClientConversions:', error);
      return {
        success: false,
        error: 'Erreur serveur lors de la récupération'
      };
    }
  },

  /**
   * Vérifie si une estimation peut être convertie
   */
  async canConvertEstimation(
    estimationId: string,
    professionalId: string
  ): Promise<{
    canConvert: boolean;
    reason?: string;
    estimation?: any;
  }> {
    try {
      // Récupérer l'estimation
      const { data: estimation, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', estimationId)
        .eq('project_type', 'estimation')
        .single();

      if (error || !estimation) {
        return {
          canConvert: false,
          reason: 'Estimation non trouvée'
        };
      }

      // Vérifier le statut
      if (estimation.estimation_status === 'converted') {
        return {
          canConvert: false,
          reason: 'Cette estimation a déjà été convertie'
        };
      }

      if (estimation.estimation_status === 'expired') {
        return {
          canConvert: false,
          reason: 'Cette estimation a expiré'
        };
      }

      // Vérifier qu'il y a un match
      const { data: match } = await supabase
        .from('match_payments')
        .select('id')
        .eq('project_id', estimationId)
        .eq('professional_id', professionalId)
        .single();

      if (!match) {
        return {
          canConvert: false,
          reason: 'Aucun match trouvé pour ce professionnel'
        };
      }

      return {
        canConvert: true,
        estimation
      };

    } catch (error) {
      console.error('❌ Erreur service canConvertEstimation:', error);
      return {
        canConvert: false,
        reason: 'Erreur lors de la vérification'
      };
    }
  }
};

export type { ConversionData, ConversionResult };
