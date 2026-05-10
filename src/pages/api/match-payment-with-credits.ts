import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let {
      projectId,
      professionalId,
      matchId, // optional: resolve from match_payments if provided
      paymentMethod, // 'credits' | 'card'
      successUrl,
      cancelUrl,
    } = req.body;

    // Validation des paramètres
    if (!paymentMethod || !['credits', 'card'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Méthode de paiement invalide' });
    }

    // Validation des IDs pour éviter l'injection
    if (
      projectId &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        projectId
      )
    ) {
      return res.status(400).json({ error: 'Project ID invalide' });
    }
    if (
      professionalId &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        professionalId
      )
    ) {
      return res.status(400).json({ error: 'Professional ID invalide' });
    }
    if (
      matchId &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        matchId
      )
    ) {
      return res.status(400).json({ error: 'Match ID invalide' });
    }

    // Si matchId fourni mais pas projectId/professionalId, résoudre depuis match_payments
    if (matchId && (!projectId || !professionalId)) {
      const { data: matchPayment, error: matchErr } = await supabaseAdmin
        .from('match_payments')
        .select('project_id, professional_id')
        .eq('id', matchId)
        .maybeSingle();

      if (!matchPayment) {
        // Essayer project_interests
        const { data: interest } = await supabaseAdmin
          .from('project_interests')
          .select('project_id, professional_id')
          .eq('id', matchId)
          .maybeSingle();
        if (interest) {
          projectId = interest.project_id;
          professionalId = interest.professional_id;
        }
      } else {
        projectId = matchPayment.project_id;
        professionalId = matchPayment.professional_id;
      }
    }

    if (!projectId || !professionalId || !paymentMethod) {
      return res.status(400).json({
        error:
          'Missing required fields (projectId, professionalId, paymentMethod)',
      });
    }

    // Récupérer les infos du projet
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select(
        'id, title, estimated_budget_min, estimated_budget_max, client_id, status'
      )
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Vérifier si le paiement matching est activé (setting admin)
    const { data: paymentSetting } = await supabaseAdmin
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'match_payment_enabled')
      .maybeSingle();

    const isPaymentEnabled = paymentSetting?.setting_value?.value ?? true;

    // Calculer le prix selon le budget
    const estimatedBudget =
      project.estimated_budget_max || project.estimated_budget_min || 0;

    // Récupérer le prix depuis les paliers
    const { data: priceTier, error: priceError } = await supabaseAdmin.rpc(
      'get_match_price',
      { p_budget: estimatedBudget }
    );

    if (priceError || !priceTier || priceTier.length === 0) {
      return res.status(500).json({ error: 'Could not determine match price' });
    }

    const tier = priceTier[0];
    const priceInCents = isPaymentEnabled ? tier.price_cents : 0;
    const priceInEuros = priceInCents / 100;

    // Vérifier si le professionnel a déjà payé pour ce projet
    const { data: existingPayment } = await supabaseAdmin
      .from('match_payments')
      .select('id, status')
      .eq('project_id', projectId)
      .eq('professional_id', professionalId)
      .single();

    if (
      existingPayment &&
      ['paid', 'completed'].includes(existingPayment.status)
    ) {
      return res.status(400).json({ error: 'Already paid for this project' });
    }

    // CAS 0: Matching gratuit (offre lancement - paiement désactivé)
    if (priceInCents === 0) {
      // Créer le match payment gratuit
      const { data: matchPayment, error: matchError } = await supabaseAdmin
        .from('match_payments')
        .insert({
          project_id: projectId,
          professional_id: professionalId,
          amount_cents: 0,
          amount_euros: 0,
          currency: 'eur',
          status: 'paid',
          payment_method: 'free_promo',
          credits_used: 0,
          paid_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (matchError) throw matchError;

      // Créer la conversation
      await supabaseAdmin.from('conversations').insert({
        project_id: projectId,
        professional_id: professionalId,
        client_id: project.client_id,
        status: 'active',
        match_payment_id: matchPayment.id,
      });

      // Logger l'événement KPI
      await supabaseAdmin.from('kpi_events').insert({
        event_type: 'match_free_promo',
        project_id: projectId,
        professional_id: professionalId,
        metadata: {
          amount_euros: 0,
          reason: 'match_payment_enabled=false',
        },
      });

      return res.status(200).json({
        success: true,
        payment: matchPayment,
        creditsUsed: 0,
        newBalance: null,
        message: 'Matching gratuit créé avec succès (offre lancement)',
      });
    }

    // CAS 1: Paiement par crédits
    if (paymentMethod === 'credits') {
      // Vérifier le solde de crédits
      const { data: pro, error: proError } = await supabaseAdmin
        .from('professionals')
        .select('credits_balance, user_id')
        .eq('id', professionalId)
        .single();

      if (proError || !pro) {
        return res.status(404).json({ error: 'Professional not found' });
      }

      const currentBalance = pro.credits_balance || 0;
      const requiredCredits = Math.ceil(priceInEuros / 5); // 1 crédit = ~5€

      if (currentBalance < requiredCredits) {
        return res.status(400).json({
          error: 'Insufficient credits',
          currentBalance,
          requiredCredits,
          shortfall: requiredCredits - currentBalance,
        });
      }

      // Déduire les crédits
      const newBalance = currentBalance - requiredCredits;

      const { error: updateError } = await supabaseAdmin
        .from('professionals')
        .update({ credits_balance: newBalance })
        .eq('id', professionalId);

      if (updateError) throw updateError;

      // Créer la transaction de crédits
      await supabaseAdmin.from('credit_transactions').insert({
        professional_id: professionalId,
        type: 'usage',
        amount: -requiredCredits,
        balance_after: newBalance,
        description: `Mise en relation projet: ${project.title}`,
        reference_type: 'match',
        reference_id: projectId,
      });

      // Créer le match payment
      const { data: matchPayment, error: matchError } = await supabaseAdmin
        .from('match_payments')
        .insert({
          project_id: projectId,
          professional_id: professionalId,
          amount_cents: priceInCents,
          amount_euros: priceInEuros,
          currency: 'eur',
          status: 'paid',
          payment_method: 'credits',
          credits_used: requiredCredits,
          paid_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (matchError) throw matchError;

      // Créer la conversation
      await supabaseAdmin.from('conversations').insert({
        project_id: projectId,
        professional_id: professionalId,
        client_id: project.client_id,
        status: 'active',
        match_payment_id: matchPayment.id,
      });

      // Logger l'événement KPI
      await supabaseAdmin.from('kpi_events').insert({
        event_type: 'match_paid_with_credits',
        project_id: projectId,
        professional_id: professionalId,
        metadata: {
          amount_euros: priceInEuros,
          credits_used: requiredCredits,
        },
      });

      return res.status(200).json({
        success: true,
        payment: matchPayment,
        creditsUsed: requiredCredits,
        newBalance,
        message: 'Payment successful with credits',
      });
    }

    // CAS 2: Paiement par carte (Stripe)
    if (paymentMethod === 'card') {
      // Récupérer l'email du professionnel
      const { data: pro, error: proError } = await supabaseAdmin
        .from('professionals')
        .select('user_id')
        .eq('id', professionalId)
        .single();

      if (proError || !pro) {
        return res.status(404).json({ error: 'Professional not found' });
      }

      const { data: userData, error: userError } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('id', pro.user_id)
        .single();

      if (userError || !userData?.email) {
        return res.status(404).json({ error: 'User email not found' });
      }

      // Créer le match payment en attente
      const { data: matchPayment, error: matchError } = await supabaseAdmin
        .from('match_payments')
        .insert({
          project_id: projectId,
          professional_id: professionalId,
          amount_cents: priceInCents,
          amount_euros: priceInEuros,
          currency: 'eur',
          status: 'pending',
          payment_method: 'card',
        })
        .select()
        .single();

      if (matchError) throw matchError;

      // Créer la session Stripe Checkout
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: `Mise en relation - ${project.title}`,
                description: `Contact client pour le projet ${project.title}`,
              },
              unit_amount: priceInCents,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url:
          successUrl ||
          `${process.env.NEXT_PUBLIC_APP_URL}/professionnel/match-success?session_id={CHECKOUT_SESSION_ID}&match_id=${matchPayment.id}`,
        cancel_url:
          cancelUrl ||
          `${process.env.NEXT_PUBLIC_APP_URL}/professionnel/match-cancel?match_id=${matchPayment.id}`,
        customer_email: userData.email,
        metadata: {
          match_payment_id: matchPayment.id,
          project_id: projectId,
          professional_id: professionalId,
          type: 'match_payment',
        },
      });

      // Mettre à jour le match payment avec la session Stripe
      await supabaseAdmin
        .from('match_payments')
        .update({ stripe_session_id: session.id })
        .eq('id', matchPayment.id);

      return res.status(200).json({
        success: true,
        sessionId: session.id,
        url: session.url,
        matchPaymentId: matchPayment.id,
        amount: priceInEuros,
      });
    }

    return res.status(400).json({ error: 'Invalid payment method' });
  } catch (error: any) {
    console.error('Error processing match payment:', error);
    return res.status(500).json({
      error: 'Failed to process payment',
      details: error.message,
    });
  }
}
