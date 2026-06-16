import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { withAuth, AuthenticatedRequest } from '@/middleware/withAuth';
import { calculateUnlockPrice } from '@/config/matchPricingTiers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * API pour débloquer un contact en utilisant des crédits
 * Méthode: POST
 * Body: { projectId, professionalId }
 */
export default withAuth(async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { projectId, professionalId } = req.body;

    // Validation des paramètres
    if (!projectId || !professionalId) {
      return res.status(400).json({
        error: 'Paramètres manquants: projectId et professionalId requis',
      });
    }

    // Validation UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId) || !uuidRegex.test(professionalId)) {
      return res.status(400).json({ error: 'IDs invalides' });
    }

    // Vérifier que l'utilisateur est bien le professionnel
    const { data: professional, error: proError } = await supabaseAdmin
      .from('professionals')
      .select('id, user_id, credits_balance')
      .eq('id', professionalId)
      .single();

    if (proError || !professional) {
      return res.status(404).json({ error: 'Professionnel non trouvé' });
    }

    if (professional.user_id !== req.user.id) {
      return res.status(403).json({
        error: 'Non autorisé: vous ne pouvez débloquer que vos propres contacts',
      });
    }

    // Récupérer les informations du projet
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select(
        'id, title, estimated_budget_min, estimated_budget_max, client_id, status'
      )
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    // Vérifier qu'il y a bien un match mutuel
    const { data: interest, error: interestError } = await supabaseAdmin
      .from('project_interests')
      .select('id, status, is_unlocked, client_interested')
      .eq('project_id', projectId)
      .eq('professional_id', professionalId)
      .single();

    if (interestError || !interest) {
      return res.status(404).json({
        error: 'Aucun intérêt trouvé pour ce projet',
      });
    }

    // Vérifier que c'est un match mutuel
    if (!interest.client_interested) {
      return res.status(400).json({
        error: 'Le client n\'a pas encore manifesté d\'intérêt pour votre profil',
      });
    }

    // Vérifier si déjà débloqué
    if (interest.is_unlocked) {
      return res.status(400).json({
        error: 'Ce contact est déjà débloqué',
      });
    }

    // Vérifier s'il existe déjà un paiement réussi
    const { data: existingPayment } = await supabaseAdmin
      .from('match_payments')
      .select('id, status')
      .eq('project_id', projectId)
      .eq('professional_id', professionalId)
      .maybeSingle();

    if (
      existingPayment &&
      (existingPayment.status === 'paid' || existingPayment.status === 'completed')
    ) {
      return res.status(400).json({
        error: 'Paiement déjà effectué pour ce contact',
      });
    }

    // Calculer le prix selon l'estimation du projet
    const pricing = calculateUnlockPrice(
      project.estimated_budget_min || 0,
      project.estimated_budget_max || 0
    );

    const requiredCredits = pricing.creditsCost;

    // Vérifier le solde de crédits
    const currentBalance = professional.credits_balance || 0;
    if (currentBalance < requiredCredits) {
      return res.status(400).json({
        error: 'Crédits insuffisants',
        required: requiredCredits,
        current: currentBalance,
        shortfall: requiredCredits - currentBalance,
      });
    }

    // Utiliser la fonction atomique spend_credits pour éviter les race conditions
    const { data: spendResult, error: spendError } = await supabaseAdmin.rpc(
      'spend_credits',
      {
        p_professional_id: professionalId,
        p_amount: requiredCredits,
        p_description: `Déblocage contact - ${project.title}`,
        p_reference_type: 'contact_unlock',
        p_reference_id: projectId,
      }
    );

    if (spendError) {
      console.error('Erreur spend_credits:', spendError);
      return res.status(500).json({
        error: 'Erreur lors de la dépense des crédits',
        details: spendError.message,
      });
    }

    if (!spendResult || !spendResult.success) {
      return res.status(400).json({
        error: spendResult?.error || 'Crédits insuffisants',
        error_code: spendResult?.error_code,
        currentBalance: spendResult?.current_balance,
        requiredCredits: spendResult?.required || requiredCredits,
        shortfall: spendResult?.shortfall,
      });
    }

    const newBalance = spendResult.new_balance;

    // Créer le match_payment avec statut 'paid'
    const { data: matchPayment, error: matchError } = await supabaseAdmin
      .from('match_payments')
      .insert({
        project_id: projectId,
        professional_id: professionalId,
        amount_cents: pricing.priceCents,
        amount_euros: pricing.priceEuros,
        currency: 'eur',
        status: 'paid',
        payment_method: 'credits',
        credits_used: requiredCredits,
        paid_at: new Date().toISOString(),
        pricing_tier_id: pricing.tier?.key,
      })
      .select()
      .single();

    if (matchError) {
      console.error('Erreur création match_payment:', matchError);
      // Tenter de rembourser les crédits en cas d'erreur
      await supabaseAdmin.rpc('add_credits', {
        p_professional_id: professionalId,
        p_amount: requiredCredits,
        p_description: `Remboursement - Erreur déblocage contact ${project.title}`,
        p_reference_type: 'refund',
        p_reference_id: projectId,
      });

      return res.status(500).json({
        error: 'Erreur lors de la création du paiement',
        details: matchError.message,
      });
    }

    // Le trigger unlock_contact_after_payment va automatiquement:
    // - Mettre à jour project_interests (is_unlocked = true)
    // - Créer ou activer la conversation

    // Logger l'événement
    await supabaseAdmin.from('admin_actions').insert({
      admin_id: professional.user_id,
      action_type: 'contact_unlocked_with_credits',
      target_type: 'match_payment',
      target_id: matchPayment.id,
      details: {
        project_id: projectId,
        professional_id: professionalId,
        credits_used: requiredCredits,
        new_balance: newBalance,
        tier: pricing.tier?.key,
      },
    });

    // Créer une notification pour le client
    await supabaseAdmin.from('notifications').insert({
      user_id: project.client_id,
      type: 'match_unlocked',
      title: 'Un artisan a débloqué votre projet',
      message: `Un professionnel a débloqué les coordonnées pour votre projet "${project.title}". Vous pouvez maintenant échanger directement.`,
      data: {
        project_id: projectId,
        professional_id: professionalId,
        match_payment_id: matchPayment.id,
      },
    });

    return res.status(200).json({
      success: true,
      payment: matchPayment,
      creditsUsed: requiredCredits,
      newBalance,
      pricing: {
        amount: pricing.priceEuros,
        tier: pricing.tier?.label,
        description: pricing.tier?.description,
      },
      message: 'Contact débloqué avec succès',
    });
  } catch (error: any) {
    console.error('Erreur lors du déblocage avec crédits:', error);
    return res.status(500).json({
      error: 'Erreur serveur lors du déblocage du contact',
      details: error.message,
    });
  }
});
