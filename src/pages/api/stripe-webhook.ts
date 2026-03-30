import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { buffer } from 'micro';

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-01-27.acacia' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature']!;
  const rawBody = await buffer(req);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { type, interestId, quoteId, conversationId } = session.metadata || {};

    // ============================================
    // PAIEMENT MISE EN RELATION (pro paie pour accéder au client)
    // ============================================
    if (type === 'mise_en_relation' && interestId) {
      try {
        // 1. Mettre à jour project_interests → paid
        const { data: interest } = await supabase
          .from('project_interests')
          .update({ status: 'paid' })
          .eq('id', interestId)
          .select('*, project:projects(id, title, client_id)')
          .maybeSingle();

        if (!interest) throw new Error('Intérêt introuvable');

        // 2. Mettre à jour match_payments
        await supabase
          .from('match_payments')
          .update({ status: 'paid', paid_at: new Date().toISOString(), stripe_charge_id: session.payment_intent as string })
          .eq('stripe_payment_intent_id', session.payment_intent as string);

        // 3. Passer la conversation en "active"
        await supabase
          .from('conversations')
          .update({ phase: 'active', status: 'active', matched_at: new Date().toISOString() })
          .eq('project_id', (interest as any).project_id)
          .eq('professional_id', interest.professional_id);

        // 4. Notifier le client
        await supabase.from('notifications').insert({
          user_id: (interest as any).project?.client_id,
          title: '✅ Professionnel débloqué !',
          message: `Le professionnel a payé la mise en relation pour votre projet "${(interest as any).project?.title}". Le chat est maintenant ouvert.`,
          type: 'payment_confirmed',
          is_read: false,
          data: { project_id: (interest as any).project_id, interest_id: interestId },
        });

        // 5. Notifier le pro
        const { data: pro } = await supabase
          .from('professionals')
          .select('user_id')
          .eq('id', interest.professional_id)
          .single();

        if (pro) {
          await supabase.from('notifications').insert({
            user_id: pro.user_id,
            title: '🎉 Accès débloqué !',
            message: 'Votre paiement a été confirmé. Vous pouvez maintenant échanger librement avec le client.',
            type: 'payment_confirmed',
            is_read: false,
            data: { project_id: (interest as any).project_id, interest_id: interestId },
          });
        }

        console.log(`✅ Match payment confirmed: interest ${interestId}`);
      } catch (err) {
        console.error('Error processing mise_en_relation:', err);
      }
    }

    // ============================================
    // PAIEMENT CAUTION (client paie 30% du devis)
    // ============================================
    if (type === 'caution' && quoteId && conversationId) {
      try {
        // 1. Mettre à jour le devis
        await supabase.from('quotes')
          .update({
            status: 'accepted',
            paid_at: new Date().toISOString(),
            stripe_payment_intent_id: session.payment_intent as string,
          })
          .eq('id', quoteId);

        // 2. Passer la conversation en in_progress
        await supabase.from('conversations')
          .update({ phase: 'in_progress', work_status: 'started' })
          .eq('id', conversationId);

        // 3. Récupérer infos
        const { data: quote } = await supabase
          .from('quotes')
          .select('amount, professional_id, client_id')
          .eq('id', quoteId)
          .single();

        if (quote) {
          const { data: pro } = await supabase
            .from('professionals')
            .select('user_id')
            .eq('id', quote.professional_id)
            .single();

          if (pro) {
            await supabase.from('notifications').insert({
              user_id: pro.user_id,
              title: '💰 Caution sécurisée !',
              message: `${(quote.amount * 0.3).toLocaleString('fr-FR')}€ sont en séquestre. Vous pouvez démarrer les travaux.`,
              type: 'caution_paid',
              is_read: false,
              data: { conversation_id: conversationId, quote_id: quoteId },
            });
          }
        }

        console.log(`✅ Caution payment confirmed: quote ${quoteId}`);
      } catch (err) {
        console.error('Error processing caution:', err);
      }
    }
  }

  res.status(200).json({ received: true });
}
