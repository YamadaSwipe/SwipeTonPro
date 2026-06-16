import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { buffer } from 'micro';

export const config = { api: { bodyParser: false } };

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
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature']!;
  const rawBody = await buffer(req);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  // ✅ IDEMPOTENCE: Vérifier si l'événement a déjà été traité
  const { data: existingEvent } = await supabase
    .from('webhook_events')
    .select('id, status')
    .eq('stripe_event_id', event.id)
    .single();

  if (existingEvent) {
    console.log(`✅ Webhook ${event.id} already processed, skipping`);
    return res.status(200).json({ 
      received: true, 
      already_processed: true,
      event_id: event.id 
    });
  }

  // Enregistrer l'événement comme en cours de traitement
  const { error: insertError } = await supabase
    .from('webhook_events')
    .insert({
      stripe_event_id: event.id,
      event_type: event.type,
      metadata: event.data.object,
      status: 'processing'
    });

  if (insertError) {
    console.error('Error inserting webhook event:', insertError);
    // Si erreur d'insertion (probablement duplicate), considérer comme déjà traité
    if (insertError.code === '23505') {
      return res.status(200).json({ received: true, already_processed: true });
    }
  }

  // ============================================
  // GESTION DES ABONNEMENTS STRIPE
  // ============================================
  if (event.type === 'customer.subscription.created' || 
      event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription;
    
    try {
      // Récupérer l'utilisateur via le customer ID
      const { data: stripeCustomer } = await supabase
        .from('stripe_customers')
        .select('user_id')
        .eq('stripe_customer_id', subscription.customer as string)
        .single();

      if (!stripeCustomer) {
        console.warn('⚠️ Customer not found for subscription:', subscription.id);
        await supabase
          .from('webhook_events')
          .update({ status: 'completed', processed_at: new Date().toISOString() })
          .eq('stripe_event_id', event.id);
        return res.status(200).json({ received: true, warning: 'customer_not_found' });
      }

      // Récupérer le professionnel
      const { data: professional } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', stripeCustomer.user_id)
        .single();

      if (!professional) {
        console.warn('⚠️ Professional not found for user:', stripeCustomer.user_id);
        await supabase
          .from('webhook_events')
          .update({ status: 'completed', processed_at: new Date().toISOString() })
          .eq('stripe_event_id', event.id);
        return res.status(200).json({ received: true, warning: 'professional_not_found' });
      }

      const isActive = subscription.status === 'active' || subscription.status === 'trialing';
      
      // Mettre à jour ou créer l'abonnement dans la base de données
      const { error: upsertError } = await supabase
        .from('stripe_subscriptions')
        .upsert({
          user_id: stripeCustomer.user_id,
          professional_id: professional.id,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer as string,
          status: subscription.status,
          plan_id: subscription.items.data[0]?.price.id,
          plan_name: subscription.items.data[0]?.price.nickname || 'Premium',
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
          metadata: subscription.metadata,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'stripe_subscription_id'
        });

      if (upsertError) {
        console.error('Error upserting subscription:', upsertError);
        throw upsertError;
      }

      // Mettre à jour le statut du professionnel
      await supabase
        .from('professionals')
        .update({
          subscription_status: subscription.status,
          subscription_id: subscription.id,
          subscription_start_date: new Date(subscription.current_period_start * 1000).toISOString(),
          subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
          can_match: isActive, // Activer le matching si abonnement actif
          updated_at: new Date().toISOString()
        })
        .eq('id', professional.id);

      // Notifier le professionnel
      const notificationTitle = isActive ? '🎉 Abonnement Premium activé !' : '⚠️ Statut abonnement mis à jour';
      const notificationMessage = isActive 
        ? 'Votre abonnement premium est maintenant actif. Vous avez accès à toutes les fonctionnalités de matching.'
        : `Votre abonnement est maintenant en statut: ${subscription.status}`;

      await supabase.from('notifications').insert({
        user_id: stripeCustomer.user_id,
        title: notificationTitle,
        message: notificationMessage,
        type: 'subscription_update',
        is_read: false,
        data: {
          subscription_id: subscription.id,
          status: subscription.status
        }
      });

      console.log(`✅ Subscription ${subscription.status}: ${subscription.id} for professional ${professional.id}`);
    } catch (err) {
      console.error('Error processing subscription:', err);
      await supabase
        .from('webhook_events')
        .update({ status: 'failed', error_message: (err as Error).message })
        .eq('stripe_event_id', event.id);
    }
  }

  // ============================================
  // GESTION DES ÉCHECS DE PAIEMENT D'ABONNEMENT
  // ============================================
  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice;
    
    try {
      // Récupérer l'utilisateur via le customer ID
      const { data: stripeCustomer } = await supabase
        .from('stripe_customers')
        .select('user_id')
        .eq('stripe_customer_id', invoice.customer as string)
        .single();

      if (!stripeCustomer) {
        console.warn('⚠️ Customer not found for failed invoice:', invoice.id);
        await supabase
          .from('webhook_events')
          .update({ status: 'completed', processed_at: new Date().toISOString() })
          .eq('stripe_event_id', event.id);
        return res.status(200).json({ received: true, warning: 'customer_not_found' });
      }

      // Récupérer le professionnel
      const { data: professional } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', stripeCustomer.user_id)
        .single();

      if (professional) {
        // Désactiver les privilèges de matching
        await supabase
          .from('professionals')
          .update({
            can_match: false,
            subscription_status: 'past_due',
            updated_at: new Date().toISOString()
          })
          .eq('id', professional.id);

        // Notifier le professionnel
        await supabase.from('notifications').insert({
          user_id: stripeCustomer.user_id,
          title: '⚠️ Échec de paiement',
          message: 'Le paiement de votre abonnement a échoué. Vos privilèges de matching ont été temporairement désactivés. Veuillez mettre à jour vos informations de paiement.',
          type: 'payment_failed',
          is_read: false,
          data: {
            invoice_id: invoice.id,
            amount_due: invoice.amount_due
          }
        });

        console.log(`⚠️ Payment failed for professional ${professional.id}, matching disabled`);
      }
    } catch (err) {
      console.error('Error processing payment failure:', err);
      await supabase
        .from('webhook_events')
        .update({ status: 'failed', error_message: (err as Error).message })
        .eq('stripe_event_id', event.id);
    }
  }

  // ============================================
  // GESTION DE LA SUPPRESSION D'ABONNEMENT
  // ============================================
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    
    try {
      // Récupérer l'utilisateur via le customer ID
      const { data: stripeCustomer } = await supabase
        .from('stripe_customers')
        .select('user_id')
        .eq('stripe_customer_id', subscription.customer as string)
        .single();

      if (stripeCustomer) {
        const { data: professional } = await supabase
          .from('professionals')
          .select('id')
          .eq('user_id', stripeCustomer.user_id)
          .single();

        if (professional) {
          // Désactiver l'abonnement et les privilèges
          await supabase
            .from('professionals')
            .update({
              subscription_status: 'canceled',
              can_match: false,
              updated_at: new Date().toISOString()
            })
            .eq('id', professional.id);

          // Mettre à jour la table des abonnements
          await supabase
            .from('stripe_subscriptions')
            .update({
              status: 'canceled',
              canceled_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('stripe_subscription_id', subscription.id);

          // Notifier le professionnel
          await supabase.from('notifications').insert({
            user_id: stripeCustomer.user_id,
            title: '❌ Abonnement annulé',
            message: 'Votre abonnement premium a été annulé. Vos privilèges de matching ont été désactivés.',
            type: 'subscription_canceled',
            is_read: false,
            data: {
              subscription_id: subscription.id
            }
          });

          console.log(`❌ Subscription canceled for professional ${professional.id}`);
        }
      }
    } catch (err) {
      console.error('Error processing subscription deletion:', err);
      await supabase
        .from('webhook_events')
        .update({ status: 'failed', error_message: (err as Error).message })
        .eq('stripe_event_id', event.id);
    }
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { type, interestId, quoteId, conversationId } =
      session.metadata || {};

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
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            stripe_charge_id: session.payment_intent as string,
          })
          .eq('stripe_payment_intent_id', session.payment_intent as string);

        // 3. Passer la conversation en "active"
        await supabase
          .from('conversations')
          .update({
            phase: 'active',
            status: 'active',
            matched_at: new Date().toISOString(),
          })
          .eq('project_id', (interest as any).project_id)
          .eq('professional_id', interest.professional_id);

        // 4. Notifier le client
        await supabase.from('notifications').insert({
          user_id: (interest as any).project?.client_id,
          title: '✅ Professionnel débloqué !',
          message: `Le professionnel a payé la mise en relation pour votre projet "${(interest as any).project?.title}". Le chat est maintenant ouvert.`,
          type: 'payment_confirmed',
          is_read: false,
          data: {
            project_id: (interest as any).project_id,
            interest_id: interestId,
          },
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
            message:
              'Votre paiement a été confirmé. Vous pouvez maintenant échanger librement avec le client.',
            type: 'payment_confirmed',
            is_read: false,
            data: {
              project_id: (interest as any).project_id,
              interest_id: interestId,
            },
          });
        }

        console.log(`✅ Match payment confirmed: interest ${interestId}`);
      } catch (err) {
        console.error('Error processing mise_en_relation:', err);
      }
    }

    // ============================================
    // PAIEMENT ACHAT CREDITS (pro achète des crédits)
    // ============================================
    if (type === 'credit_purchase') {
      try {
        const { professional_id, credits_amount, bonus_credits } =
          session.metadata || {};
        if (!professional_id || !credits_amount) {
          console.warn(
            '⚠️ credit_purchase metadata incomplete:',
            session.metadata
          );
          return;
        }

        const totalCredits =
          parseInt(credits_amount) + parseInt(bonus_credits || '0');

        // 1. Récupérer le solde actuel
        const { data: pro } = await supabase
          .from('professionals')
          .select('credits_balance')
          .eq('id', professional_id)
          .single();

        const newBalance = (pro?.credits_balance || 0) + totalCredits;

        // 2. Mettre à jour le solde
        await supabase
          .from('professionals')
          .update({ credits_balance: newBalance })
          .eq('id', professional_id);

        // 3. Créer la transaction
        await supabase.from('credit_transactions').insert({
          professional_id: professional_id,
          type: 'purchase',
          amount: totalCredits,
          balance_after: newBalance,
          description: `Achat ${totalCredits} crédits via Stripe`,
          stripe_payment_intent_id: session.payment_intent as string,
        });

        // 4. Notifier le pro
        const { data: profile } = await supabase
          .from('professionals')
          .select('user_id')
          .eq('id', professional_id)
          .single();

        if (profile) {
          await supabase.from('notifications').insert({
            user_id: profile.user_id,
            title: '💰 Crédits ajoutés !',
            message: `${totalCredits} crédits ont été ajoutés à votre compte. Solde: ${newBalance}`,
            type: 'credit_purchase',
            is_read: false,
          });
        }

        console.log(
          `✅ Credit purchase confirmed: ${totalCredits} credits for pro ${professional_id}`
        );
      } catch (err) {
        console.error('Error processing credit_purchase:', err);
      }
    }

    // ============================================
    // PAIEMENT PACK DE CRÉDITS (nouveau système)
    // ============================================
    if (type === 'credit_pack_purchase') {
      try {
        const { purchase_id, professional_id, pack_id, credits_amount, bonus_credits } =
          session.metadata || {};
        
        if (!purchase_id || !professional_id) {
          console.warn(
            '⚠️ credit_pack_purchase metadata incomplete:',
            session.metadata
          );
          return;
        }

        // 1. Mettre à jour le statut de l'achat à 'completed'
        // Le trigger credit_pack_purchase_completed va automatiquement créditer le compte
        await supabase
          .from('credit_pack_purchases')
          .update({
            status: 'completed',
            stripe_payment_intent_id: session.payment_intent as string,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', purchase_id);

        const totalCredits = parseInt(credits_amount || '0') + parseInt(bonus_credits || '0');

        console.log(
          `✅ Credit pack purchase confirmed: ${totalCredits} credits for pro ${professional_id}, purchase ${purchase_id}`
        );
      } catch (err) {
        console.error('Error processing credit_pack_purchase:', err);
        await supabase
          .from('webhook_events')
          .update({ status: 'failed', error_message: (err as Error).message })
          .eq('stripe_event_id', event.id);
      }
    }

    // ============================================
    // PAIEMENT MATCH PAYMENT (nouveau flow)
    // ============================================
    if (type === 'match_payment') {
      try {
        const { match_payment_id, project_id, professional_id } =
          session.metadata || {};
        if (!match_payment_id) {
          console.warn(
            '⚠️ match_payment metadata incomplete:',
            session.metadata
          );
          return;
        }

        // 1. Mettre à jour match_payments
        await supabase
          .from('match_payments')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            stripe_charge_id: session.payment_intent as string,
          })
          .eq('id', match_payment_id);

        // 2. Créer la conversation si pas existante
        const { data: existingConv } = await supabase
          .from('conversations')
          .select('id')
          .eq('project_id', project_id)
          .eq('professional_id', professional_id)
          .maybeSingle();

        if (!existingConv) {
          const { data: project } = await supabase
            .from('projects')
            .select('client_id')
            .eq('id', project_id)
            .single();

          if (project?.client_id) {
            await supabase.from('conversations').insert({
              project_id: project_id,
              professional_id: professional_id,
              client_id: project.client_id,
              status: 'active',
              phase: 'active',
              matched_at: new Date().toISOString(),
            });
          }
        }

        // 3. Notifications
        const { data: pro } = await supabase
          .from('professionals')
          .select('user_id')
          .eq('id', professional_id)
          .single();

        if (pro) {
          await supabase.from('notifications').insert({
            user_id: pro.user_id,
            title: '🎉 Accès débloqué !',
            message:
              'Votre paiement a été confirmé. Vous pouvez maintenant échanger librement avec le client.',
            type: 'payment_confirmed',
            is_read: false,
          });
        }

        console.log(`✅ Match payment confirmed: ${match_payment_id}`);
      } catch (err) {
        console.error('Error processing match_payment:', err);
      }
    }

    // ============================================
    // PAIEMENT CAUTION (client paie 30% du devis)
    // ============================================
    if (type === 'caution' && quoteId && conversationId) {
      try {
        // 1. Mettre à jour le devis
        await supabase
          .from('quotes')
          .update({
            status: 'accepted',
            paid_at: new Date().toISOString(),
            stripe_payment_intent_id: session.payment_intent as string,
          })
          .eq('id', quoteId);

        // 2. Passer la conversation en in_progress
        await supabase
          .from('conversations')
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

  // Marquer l'événement comme traité avec succès
  await supabase
    .from('webhook_events')
    .update({ 
      status: 'completed', 
      processed_at: new Date().toISOString() 
    })
    .eq('stripe_event_id', event.id);

  res.status(200).json({ received: true });
}
