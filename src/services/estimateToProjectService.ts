import { supabase } from '@/integrations/supabase/client';
import { projectService } from '@/services/projectService';
import { notificationService } from '@/services/notificationService';
import { authService } from '@/services/authService';
import { matchPaymentService } from '@/services/matchPaymentService';
import type { AIEstimation } from '@/services/aiEstimationService';
import type { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
type Match = Database['public']['Tables']['matches']['Row'];
type MatchInsert = Database['public']['Tables']['matches']['Insert'];

interface EstimateData {
  // Contact info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;

  // Project info
  description: string;
  workType: string;
  location: string;
  surface?: number;
  budgetMin: number;
  budgetMax: number;
  deadline: string;
  requiredCertifications: string[];
  photos: File[];

  // AI estimation
  aiEstimation: AIEstimation | null;
}

interface ConvertEstimateResult {
  success: boolean;
  projectId?: string;
  matchId?: string;
  stripeCheckoutUrl?: string;
  error?: string;
}

export const estimateToProjectService = {
  /**
   * Convertit une estimation en projet réel
   * @param estimateData - Données de l'estimation
   * @param professionalId - ID du professionnel qui a fait l'estimation
   * @returns Résultat de la conversion avec URL Stripe si applicable
   */
  async convertEstimateToProject(
    estimateData: EstimateData,
    professionalId: string
  ): Promise<ConvertEstimateResult> {
    try {
      console.log('🔄 Début conversion estimation -> projet', {
        professionalId,
        workType: estimateData.workType,
        budgetRange: `${estimateData.budgetMin} - ${estimateData.budgetMax}`
      });

      // 1. Créer le projet à partir des données d'estimation
      const projectData: ProjectInsert = {
        title: `Projet ${estimateData.workType} - ${estimateData.city}`,
        description: estimateData.description,
        category: estimateData.workType,
        city: estimateData.city,
        postal_code: estimateData.postal_code,
        estimated_budget_min: estimateData.budgetMin,
        estimated_budget_max: estimateData.budgetMax,
        desired_start_period: estimateData.deadline,
        urgency: 'normal',
        surface: estimateData.surface || null,
        property_type: estimateData.location || 'Non spécifié',
        status: 'pending',
        validation_status: 'pending',
        ai_analysis: estimateData.aiEstimation ? JSON.stringify(estimateData.aiEstimation) : null,
        client_id: (await this.getCurrentUserId()) || undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single();

      if (projectError || !project) {
        console.error('❌ Erreur création projet:', projectError);
        return { success: false, error: 'Impossible de créer le projet' };
      }

      console.log('✅ Projet créé:', project.id);

      // 2. Uploader les photos si présentes
      if (estimateData.photos.length > 0) {
        const uploadResult = await projectService.uploadProjectImages(
          project.id,
          estimateData.photos
        );
        if (uploadResult.error) {
          console.warn('⚠️ Erreur upload photos:', uploadResult.error);
        }
      }

      // 3. Créer le match entre le client et le professionnel
      const matchData: MatchInsert = {
        professional_id: professionalId,
        project_id: project.id,
        status: 'pending_payment',
        client_interest: true,
        professional_interest: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: match, error: matchError } = await supabase
        .from('matches')
        .insert(matchData)
        .select()
        .single();

      if (matchError || !match) {
        console.error('❌ Erreur création match:', matchError);
        return { success: false, error: 'Impossible de créer le match' };
      }

      console.log('✅ Match créé:', match.id);

      // 4. Calculer le prix du match basé sur l'estimation
      const estimatedBudget = estimateData.aiEstimation 
        ? (estimateData.aiEstimation.estimation_min + estimateData.aiEstimation.estimation_max) / 2
        : (estimateData.budgetMin + estimateData.budgetMax) / 2;

      const budgetInCents = Math.round(estimatedBudget * 100);
      
      const { data: pricing, error: pricingError } = await supabase
        .rpc('get_match_price', { p_budget: budgetInCents });

      if (pricingError || !pricing || pricing.length === 0) {
        console.error('❌ Erreur récupération prix:', pricingError);
        return { success: false, error: 'Impossible de déterminer le tarif' };
      }

      const pricingTier = pricing[0];
      console.log('💰 Prix calculé:', {
        tier: pricingTier.key,
        credits: pricingTier.credits_cost,
        price: pricingTier.price_cents
      });

      // 5. Créer la transaction de paiement et la session Stripe
      const paymentResult = await matchPaymentService.createPaymentIntent({
        professionalId,
        projectId: project.id,
        matchId: match.id,
        pricingTierId: pricingTier.id,
        amount: pricingTier.price_cents,
        creditsCost: pricingTier.credits_cost,
        currency: 'eur',
      });

      if (paymentResult.error || !paymentResult.data) {
        console.error('❌ Erreur création paiement:', paymentResult.error);
        return { success: false, error: 'Impossible de créer le paiement' };
      }

      // 6. Notifier le professionnel
      await this.notifyProfessional(professionalId, project.id, match.id);

      console.log('🎉 Conversion estimation -> projet terminée avec succès');
      
      return {
        success: true,
        projectId: project.id,
        matchId: match.id,
        stripeCheckoutUrl: paymentResult.data.checkoutUrl
      };

    } catch (error) {
      console.error('❌ Erreur conversion estimation:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      };
    }
  },

  /**
   * Notifie le professionnel que le client veut transformer l'estimation en projet
   */
  async notifyProfessional(
    professionalId: string,
    projectId: string,
    matchId: string
  ): Promise<void> {
    try {
      // Récupérer les détails du projet
      const { data: project } = await supabase
        .from('projects')
        .select('title, category, city, estimated_budget_min, estimated_budget_max')
        .eq('id', projectId)
        .single();

      if (!project) return;

      const notificationData = {
        title: '🎉 Projet confirmé !',
        message: `Un client souhaite transformer votre estimation en projet réel : ${project.title}`,
        type: 'match_confirmed',
        data: {
          projectId,
          matchId,
          projectTitle: project.title,
          category: project.category,
          city: project.city,
          budgetRange: `${project.estimated_budget_min}€ - ${project.estimated_budget_max}€`
        }
      };

      await notificationService.sendNotification(professionalId, notificationData);
      console.log('📧 Notification envoyée au professionnel:', professionalId);

    } catch (error) {
      console.error('❌ Erreur notification professionnel:', error);
    }
  },

  /**
   * Récupère l'ID de l'utilisateur connecté
   */
  async getCurrentUserId(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
    } catch (error) {
      console.error('❌ Erreur récupération user ID:', error);
      return null;
    }
  },

  /**
   * Vérifie si une estimation peut être convertie (vérifications métier)
   */
  async canConvertEstimate(
    estimateData: EstimateData,
    professionalId: string
  ): Promise<{ canConvert: boolean; reason?: string }> {
    try {
      // Vérifier si le professionnel existe
      const { data: professional } = await supabase
        .from('professionals')
        .select('id, status')
        .eq('id', professionalId)
        .single();

      if (!professional) {
        return { canConvert: false, reason: 'Professionnel non trouvé' };
      }

      if (professional.status !== 'approved') {
        return { canConvert: false, reason: 'Professionnel non validé' };
      }

      // Vérifier si les données minimales sont présentes
      if (!estimateData.description || estimateData.description.length < 20) {
        return { canConvert: false, reason: 'Description trop courte' };
      }

      if (!estimateData.workType) {
        return { canConvert: false, reason: 'Type de travaux non spécifié' };
      }

      if (estimateData.budgetMin <= 0 || estimateData.budgetMax <= 0) {
        return { canConvert: false, reason: 'Budget invalide' };
      }

      if (estimateData.budgetMin >= estimateData.budgetMax) {
        return { canConvert: false, reason: 'Budget minimum supérieur au maximum' };
      }

      return { canConvert: true };

    } catch (error) {
      console.error('❌ Erreur vérification conversion:', error);
      return { canConvert: false, reason: 'Erreur de vérification' };
    }
  }
};

export type { EstimateData, ConvertEstimateResult };
