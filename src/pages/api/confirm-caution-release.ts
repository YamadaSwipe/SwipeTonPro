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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const { quoteId, conversationId } = req.body;
  if (!quoteId || !conversationId)
    return res.status(400).json({ error: 'Paramètres manquants' });

  try {
    // Récupérer le devis
    const { data: quote, error: qErr } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (qErr || !quote)
      return res.status(404).json({ error: 'Devis introuvable' });
    if (quote.status === 'released')
      return res.status(400).json({ error: 'Déjà libéré' });

    // Récupérer le compte Stripe Connect du professionnel
    const { data: pro } = await supabase
      .from('professionals')
      .select('user_id, stripe_account_id')
      .eq('id', quote.professional_id)
      .single();

    const cautionAmount = Math.round(quote.amount * 0.3 * 100); // centimes

    let transferId: string | null = null;

    if (pro?.stripe_account_id) {
      // Virement vers le compte Connect du pro
      const transfer = await stripe.transfers.create({
        amount: cautionAmount,
        currency: 'eur',
        destination: pro.stripe_account_id,
        description: `Libération caution — projet ${conversationId}`,
        metadata: { quoteId, conversationId },
      });
      transferId = transfer.id;
    }

    // Mettre à jour le devis
    await supabase
      .from('quotes')
      .update({
        status: 'released',
        stripe_transfer_id: transferId,
        released_at: new Date().toISOString(),
      })
      .eq('id', quoteId);

    // Mettre à jour la conversation
    await supabase
      .from('conversations')
      .update({
        phase: 'completed',
        work_status: 'completed',
      })
      .eq('id', conversationId);

    // Notifier le pro
    if (pro) {
      await supabase.from('notifications').insert({
        user_id: pro.user_id,
        title: '🎉 Caution versée !',
        message: `${(quote.amount * 0.3).toLocaleString('fr-FR')}€ ont été virés sur votre compte. Travaux validés par le client.`,
        type: 'caution_released',
        is_read: false,
        data: { conversation_id: conversationId, quote_id: quoteId },
      });
    }

    return res.status(200).json({ success: true, transferId });
  } catch (err: any) {
    console.error('Release error:', err);
    return res.status(500).json({ error: err.message });
  }
}
