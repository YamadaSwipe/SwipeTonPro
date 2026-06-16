/**
 * @fileoverview API pour débloquer les fonds d'un jalon validé
 * @description Gère le transfert Stripe vers l'artisan après validation du jalon
 * @author Senior Architect
 * @version 1.0.0
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ReleaseFundsRequest {
  milestoneId: string;
  userId: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { milestoneId, userId }: ReleaseFundsRequest = req.body;

    if (!milestoneId || !userId) {
      return res.status(400).json({
        error: 'Paramètres manquants: milestoneId et userId requis',
      });
    }

    // 1. Récupérer les informations du jalon et du projet
    const { data: milestone, error: milestoneError } = await supabase
      .from('project_milestones')
      .select(
        `
        id,
        project_id,
        milestone_type,
        validation_status,
        payment_status,
        payment_amount,
        projects!inner(
          id,
          client_id,
          escrow_enabled,
          escrow_stripe_payment_intent_id,
          escrow_status
        )
      `
      )
      .eq('id', milestoneId)
      .single();

    if (milestoneError || !milestone) {
      console.error('❌ Erreur récupération jalon:', milestoneError);
      return res.status(404).json({ error: 'Jalon non trouvé' });
    }

    // 2. Vérifications de sécurité
    const project = milestone.projects as any;

    // Vérifier que l'utilisateur est bien le client du projet
    if (project.client_id !== userId) {
      console.warn('⚠️ Tentative de déblocage non autorisée:', {
        userId,
        clientId: project.client_id,
        milestoneId,
      });
      return res.status(403).json({
        error: 'Seul le client du projet peut débloquer les fonds',
      });
    }

    // Vérifier que le séquestre est activé
    if (!project.escrow_enabled) {
      return res.status(400).json({
        error: 'Le séquestre n\'est pas activé pour ce projet',
      });
    }

    // Vérifier que le jalon est validé
    if (milestone.validation_status !== 'validated') {
      return res.status(400).json({
        error: 'Le jalon doit être validé par les deux parties avant de débloquer les fonds',
      });
    }

    // Vérifier que les fonds ne sont pas déjà débloqués
    if (milestone.payment_status === 'released') {
      return res.status(400).json({
        error: 'Les fonds de ce jalon ont déjà été débloqués',
      });
    }

    // Vérifier qu'il y a un montant à débloquer
    if (!milestone.payment_amount || milestone.payment_amount <= 0) {
      return res.status(400).json({
        error: 'Aucun montant à débloquer pour ce jalon',
      });
    }

    // 3. Récupérer le professionnel et son compte Stripe Connect
    const { data: interest, error: interestError } = await supabase
      .from('project_interests')
      .select(
        `
        professional_id,
        professionals!inner(
          id,
          user_id,
          stripe_account_id,
          company_name
        )
      `
      )
      .eq('project_id', project.id)
      .eq('status', 'accepted')
      .single();

    if (interestError || !interest) {
      console.error('❌ Erreur récupération professionnel:', interestError);
      return res.status(404).json({
        error: 'Professionnel non trouvé pour ce projet',
      });
    }

    const professional = interest.professionals as any;

    if (!professional.stripe_account_id) {
      return res.status(400).json({
        error: 'Le professionnel n\'a pas configuré son compte Stripe Connect',
      });
    }

    // 4. Marquer le jalon comme "en cours de déblocage"
    await supabase
      .from('project_milestones')
      .update({
        payment_status: 'releasing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', milestoneId);

    // 5. Créer le transfert Stripe vers le compte Connect du professionnel
    let transfer: Stripe.Transfer;
    try {
      // Convertir le montant en centimes pour Stripe
      const amountInCents = Math.round(milestone.payment_amount * 100);

      transfer = await stripe.transfers.create({
        amount: amountInCents,
        currency: 'eur',
        destination: professional.stripe_account_id,
        description: `Déblocage jalon: ${milestone.milestone_type} - Projet ${project.id}`,
        metadata: {
          project_id: project.id,
          milestone_id: milestoneId,
          milestone_type: milestone.milestone_type,
          client_id: project.client_id,
          professional_id: professional.id,
        },
        // Utiliser le PaymentIntent du séquestre comme source
        source_transaction: project.escrow_stripe_payment_intent_id,
      });

      console.log('✅ Transfert Stripe créé:', {
        transferId: transfer.id,
        amount: milestone.payment_amount,
        professional: professional.company_name,
        milestone: milestone.milestone_type,
      });
    } catch (stripeError: any) {
      console.error('❌ Erreur création transfert Stripe:', stripeError);

      // Marquer le jalon comme échec
      await supabase
        .from('project_milestones')
        .update({
          payment_status: 'failed',
          payment_metadata: {
            error: stripeError.message,
            error_code: stripeError.code,
            failed_at: new Date().toISOString(),
          },
        })
        .eq('id', milestoneId);

      return res.status(500).json({
        error: 'Erreur lors du transfert Stripe',
        details: stripeError.message,
      });
    }

    // 6. Appeler la fonction SQL pour finaliser le déblocage
    const { data: releaseResult, error: releaseError } = await supabase.rpc(
      'release_milestone_funds',
      {
        p_milestone_id: milestoneId,
        p_released_by: userId,
        p_stripe_transfer_id: transfer.id,
      }
    );

    if (releaseError) {
      console.error('❌ Erreur fonction release_milestone_funds:', releaseError);
      
      // Tenter d'annuler le transfert Stripe si possible
      try {
        await stripe.transfers.createReversal(transfer.id);
        console.log('⚠️ Transfert Stripe annulé suite à l\'erreur');
      } catch (reversalError) {
        console.error('❌ Impossible d\'annuler le transfert:', reversalError);
      }

      return res.status(500).json({
        error: 'Erreur lors de la finalisation du déblocage',
        details: releaseError.message,
      });
    }

    if (!releaseResult.success) {
      return res.status(400).json({
        error: releaseResult.error || 'Échec du déblocage des fonds',
      });
    }

    // 7. Créer des notifications
    // Notifier le professionnel
    await supabase.from('notifications').insert({
      user_id: professional.user_id,
      title: '💰 Fonds débloqués !',
      message: `${milestone.payment_amount}€ ont été transférés sur votre compte pour le jalon "${milestone.milestone_type}".`,
      type: 'funds_released',
      is_read: false,
      data: {
        project_id: project.id,
        milestone_id: milestoneId,
        amount: milestone.payment_amount,
        transfer_id: transfer.id,
      },
    });

    // Notifier le client
    await supabase.from('notifications').insert({
      user_id: userId,
      title: '✅ Paiement effectué',
      message: `${milestone.payment_amount}€ ont été versés à l'artisan pour le jalon "${milestone.milestone_type}".`,
      type: 'payment_sent',
      is_read: false,
      data: {
        project_id: project.id,
        milestone_id: milestoneId,
        amount: milestone.payment_amount,
        transfer_id: transfer.id,
      },
    });

    // 8. Vérifier si c'est le dernier jalon
    const { data: remainingMilestones } = await supabase
      .from('project_milestones')
      .select('id')
      .eq('project_id', project.id)
      .gt('payment_amount', 0)
      .neq('payment_status', 'released');

    const isLastMilestone = !remainingMilestones || remainingMilestones.length === 0;

    if (isLastMilestone) {
      // Notifier que tous les paiements sont terminés
      await supabase.from('notifications').insert([
        {
          user_id: userId,
          title: '🎉 Projet terminé',
          message: 'Tous les paiements ont été effectués. Le projet est maintenant terminé.',
          type: 'project_completed',
          is_read: false,
          data: { project_id: project.id },
        },
        {
          user_id: professional.user_id,
          title: '🎉 Projet terminé',
          message: 'Tous les paiements ont été reçus. Le projet est maintenant terminé.',
          type: 'project_completed',
          is_read: false,
          data: { project_id: project.id },
        },
      ]);
    }

    return res.status(200).json({
      success: true,
      message: 'Fonds débloqués avec succès',
      data: {
        milestoneId,
        amountReleased: milestone.payment_amount,
        transferId: transfer.id,
        isLastMilestone,
      },
    });
  } catch (error: any) {
    console.error('❌ Erreur API release-milestone-funds:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      details: error.message,
    });
  }
}
