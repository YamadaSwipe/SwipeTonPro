import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { withAuth, AuthenticatedRequest } from '@/middleware/withAuth';
import { calculateUnlockPrice } from '@/config/matchPricingTiers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * API pour créer un lien de paiement Stripe pour débloquer un contact
 * Méthode: POST
 * Body: { projectId, professionalId, successUrl?, cancelUrl? }
 */
export default withAuth(async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { projectId, professionalId, successUrl, cancelUrl } = req.body;

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
      .select('id, user_id')
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

    // Vérifier s'il existe déjà un paiement en cours ou réussi
    const { data: existingPayment } = await supabaseAdmin
      .from('match_payments')
      .select('id, status, stripe_session_id')
      .eq('project_id', projectId)
      .eq('professional_id', professionalId)
      .maybeSingle();

    if (existingPayment) {
      if (existingPayment.status === 'paid' || existingPayment.status === 'completed') {
        return res.status(400).json({
          error: 'Paiement déjà effectué pour ce contact',
        });
      }
      if (existingPayment.status === 'pending' && existingPayment.stripe_session_id) {
        // Récupérer la session Stripe existante
        try {
          const session = await stripe.checkout.sessions.retrieve(
            existingPayment.stripe_session_id
          );
          if (session.status === 'open') {
            return res.status(200).json({
              success: true,
              sessionId: session.id,
              url: session.url,
              matchPaymentId: existingPayment.id,
              message: 'Session de paiement existante récupérée',
            });
          }
        } catch (err) {
          console.error('Erreur lors de la récupération de la session:', err);
        }
      }
    }

    // Calculer le prix selon l'estimation du projet
    const pricing = calculateUnlockPrice(
      project.estimated_budget_min || 0,
      project.estimated_budget_max || 0
    );

    // Récupérer l'email du professionnel
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name')
      .eq('id', professional.user_id)
      .single();

    if (profileError || !profile?.email) {
      return res.status(404).json({ error: 'Email du professionnel non trouvé' });
    }

    // Créer ou mettre à jour le match_payment
    const { data: matchPayment, error: matchError } = await supabaseAdmin
      .from('match_payments')
      .upsert(
        {
          id: existingPayment?.id,
          project_id: projectId,
          professional_id: professionalId,
          amount_cents: pricing.priceCents,
          amount_euros: pricing.priceEuros,
          currency: 'eur',
          status: 'pending',
          payment_method: 'card',
          pricing_tier_id: pricing.tier?.key,
        },
        {
          onConflict: 'id',
        }
      )
      .select()
      .single();

    if (matchError) {
      console.error('Erreur création match_payment:', matchError);
      return res.status(500).json({
        error: 'Erreur lors de la création du paiement',
        details: matchError.message,
      });
    }

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Déblocage contact - ${project.title}`,
              description: `Accès aux coordonnées du client pour le projet "${project.title}"`,
              metadata: {
                project_id: projectId,
                professional_id: professionalId,
                tier: pricing.tier?.key || 'default',
              },
            },
            unit_amount: pricing.priceCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url:
        successUrl ||
        `${process.env.NEXT_PUBLIC_APP_URL}/professionnel/projets/${projectId}?unlock=success`,
      cancel_url:
        cancelUrl ||
        `${process.env.NEXT_PUBLIC_APP_URL}/professionnel/projets/${projectId}?unlock=cancelled`,
      customer_email: profile.email,
      client_reference_id: matchPayment.id,
      metadata: {
        match_payment_id: matchPayment.id,
        project_id: projectId,
        professional_id: professionalId,
        type: 'contact_unlock',
        tier: pricing.tier?.key || 'default',
      },
    });

    // Mettre à jour le match_payment avec l'ID de session Stripe
    await supabaseAdmin
      .from('match_payments')
      .update({ stripe_session_id: session.id })
      .eq('id', matchPayment.id);

    // Logger l'événement
    await supabaseAdmin.from('admin_actions').insert({
      admin_id: professional.user_id,
      action_type: 'contact_unlock_initiated',
      target_type: 'match_payment',
      target_id: matchPayment.id,
      details: {
        project_id: projectId,
        professional_id: professionalId,
        amount_euros: pricing.priceEuros,
        tier: pricing.tier?.key,
        stripe_session_id: session.id,
      },
    });

    return res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url,
      matchPaymentId: matchPayment.id,
      pricing: {
        amount: pricing.priceEuros,
        tier: pricing.tier?.label,
        description: pricing.tier?.description,
      },
    });
  } catch (error: any) {
    console.error('Erreur lors de la création du lien de paiement:', error);
    return res.status(500).json({
      error: 'Erreur serveur lors de la création du lien de paiement',
      details: error.message,
    });
  }
});
