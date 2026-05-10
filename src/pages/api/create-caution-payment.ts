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

  const { quoteId, conversationId } = req.body;
  if (!quoteId || !conversationId)
    return res.status(400).json({ error: 'Paramètres manquants' });

  // Validation des IDs pour éviter l'injection
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      quoteId
    ) ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      conversationId
    )
  ) {
    return res.status(400).json({ error: 'IDs invalides' });
  }

  try {
    // Récupérer le devis
    const { data: quote, error: qErr } = await supabase
      .from('quotes')
      .select('*, conversation:conversations(project:projects(title))')
      .eq('id', quoteId)
      .single();

    if (qErr || !quote)
      return res.status(404).json({ error: 'Devis introuvable' });
    if (quote.status !== 'pending')
      return res.status(400).json({ error: 'Devis déjà traité' });

    // Validation stricte du montant
    const quoteAmount = parseFloat(quote.amount);
    if (isNaN(quoteAmount) || quoteAmount <= 0 || quoteAmount > 100000) {
      return res.status(400).json({ error: 'Montant invalide' });
    }

    const cautionAmount = Math.round(quoteAmount * 0.3 * 100); // centimes
    const projectTitle = quote.conversation?.project?.title || 'Projet BTP';

    // Créer Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Caution sécurisée — ${projectTitle}`,
              description: `30% du devis de ${quote.amount.toLocaleString('fr-FR')}€. Versé au professionnel à la validation des travaux.`,
            },
            unit_amount: cautionAmount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        quoteId,
        conversationId,
        type: 'caution',
        fullAmount: quote.amount.toString(),
      },
      success_url: `${BASE_URL}/chat/${conversationId}?caution=success`,
      cancel_url: `${BASE_URL}/chat/${conversationId}?caution=cancelled`,
    });

    // Mettre à jour le devis avec le payment intent
    await supabase
      .from('quotes')
      .update({
        stripe_payment_intent_id: session.payment_intent as string,
        status: 'accepted',
      })
      .eq('id', quoteId);

    // Mettre à jour la conversation
    await supabase
      .from('conversations')
      .update({
        phase: 'in_progress',
        work_status: 'started',
      })
      .eq('id', conversationId);

    // Notification au pro
    await supabase.from('notifications').insert({
      user_id: quote.client_id, // sera remplacé par pro ci-dessous
      title: '💰 Caution payée !',
      message: `La caution de ${(quote.amount * 0.3).toLocaleString('fr-FR')}€ a été sécurisée. Vous pouvez commencer les travaux.`,
      type: 'caution_paid',
      is_read: false,
      data: { conversation_id: conversationId, quote_id: quoteId },
    });

    // Notifier le pro
    const { data: pro } = await supabase
      .from('professionals')
      .select('user_id')
      .eq('id', quote.professional_id)
      .single();

    if (pro) {
      await supabase.from('notifications').insert({
        user_id: pro.user_id,
        title: '💰 Caution sécurisée !',
        message: `La caution de ${(quote.amount * 0.3).toLocaleString('fr-FR')}€ a été placée en séquestre. Démarrez les travaux.`,
        type: 'caution_paid',
        is_read: false,
        data: { conversation_id: conversationId, quote_id: quoteId },
      });
    }

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe error:', err);
    return res.status(500).json({ error: err.message });
  }
}
