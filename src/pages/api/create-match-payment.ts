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
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const { interestId, projectId, projectTitle } = req.body;
  if (!interestId || !projectId)
    return res.status(400).json({ error: 'Paramètres manquants' });

  // Validation des IDs pour éviter l'injection
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      interestId
    ) ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      projectId
    )
  ) {
    return res.status(400).json({ error: 'IDs invalides' });
  }

  try {
    // Vérifier l'intérêt
    const { data: interest } = await supabase
      .from('project_interests')
      .select('*, professional:professionals(user_id)')
      .eq('id', interestId)
      .single();

    if (!interest) return res.status(404).json({ error: 'Match introuvable' });
    if (interest.status === 'paid')
      return res.status(400).json({ error: 'Déjà payé' });

    // Vérifier si le paiement matching est activé (setting admin)
    const { data: paymentSetting } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'match_payment_enabled')
      .maybeSingle();

    const isPaymentEnabled = paymentSetting?.setting_value?.value ?? true;

    if (!isPaymentEnabled) {
      return res.status(400).json({
        error: 'Paiement désactivé',
        message:
          'Le paiement pour les matchings est actuellement désactivé (offre gratuite). Utilisez match-payment-with-credits avec paymentMethod="credits" et 0 crédits.',
      });
    }

    // Récupérer le projet pour calculer le prix selon la grille tarifaire
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('estimated_budget_min, estimated_budget_max')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: 'Projet introuvable' });
    }

    // Calculer le prix selon le budget (grille tarifaire dynamique)
    const estimatedBudget =
      project.estimated_budget_max || project.estimated_budget_min || 0;

    const { data: priceTier, error: priceError } = await supabase.rpc(
      'get_match_price',
      { p_budget: estimatedBudget }
    );

    if (priceError || !priceTier || priceTier.length === 0) {
      return res
        .status(500)
        .json({ error: 'Impossible de déterminer le prix' });
    }

    const tier = priceTier[0];
    const priceInCents = tier.price_cents;
    const priceInEuros = priceInCents / 100;

    // Créer la session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Mise en relation — ${projectTitle || 'Projet BTP'}`,
              description:
                'Accès aux coordonnées du client et déblocage du chat complet.',
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        interestId,
        projectId,
        type: 'mise_en_relation',
      },
      success_url: `${BASE_URL}/professionnel/matches?payment=success&interestId=${interestId}`,
      cancel_url: `${BASE_URL}/professionnel/matches?payment=cancelled`,
    });

    // Enregistrer le payment intent
    await supabase.from('match_payments').insert({
      project_id: projectId,
      professional_id: interest.professional_id,
      amount_cents: priceInCents,
      amount_euros: priceInEuros,
      currency: 'eur',
      status: 'pending',
      stripe_payment_intent_id: session.payment_intent as string,
      stripe_session_id: session.id,
      metadata: { interest_id: interestId, session_id: session.id },
    });

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error('Match payment error:', err);
    return res.status(500).json({ error: err.message });
  }
}
