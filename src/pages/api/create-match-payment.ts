import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-01-27.acacia' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const MISE_EN_RELATION_CENTS = 3500; // 35€

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { interestId, projectId, projectTitle } = req.body;
  if (!interestId || !projectId) return res.status(400).json({ error: 'Paramètres manquants' });

  try {
    // Vérifier l'intérêt
    const { data: interest } = await supabase
      .from('project_interests')
      .select('*, professional:professionals(user_id)')
      .eq('id', interestId)
      .single();

    if (!interest) return res.status(404).json({ error: 'Match introuvable' });
    if (interest.status === 'paid') return res.status(400).json({ error: 'Déjà payé' });

    // Créer la session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Mise en relation — ${projectTitle || 'Projet BTP'}`,
            description: 'Accès aux coordonnées du client et déblocage du chat complet.',
          },
          unit_amount: MISE_EN_RELATION_CENTS,
        },
        quantity: 1,
      }],
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
      amount: 35,
      currency: 'eur',
      status: 'pending',
      stripe_payment_intent_id: session.payment_intent as string,
      metadata: { interest_id: interestId, session_id: session.id },
    });

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error('Match payment error:', err);
    return res.status(500).json({ error: err.message });
  }
}
