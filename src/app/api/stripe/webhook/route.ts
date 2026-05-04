import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/integrations/supabase/client';
import { chatService } from '@/services/chatService';
import { emailService } from '@/services/emailService';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case 'checkout.session.expired':
        await handleCheckoutSessionExpired(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice
        );
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error) {
    console.error('Error processing webhook event:', error);
    return new Response('Error processing webhook', { status: 500 });
  }

  return new Response('OK');
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  console.log('Checkout session completed:', session.id);

  try {
    const paiementId = session.metadata?.paiement_id;
    const userId = session.metadata?.user_id;
    const clientId = session.metadata?.clientId;
    const professionalId = session.metadata?.professionalId;
    const projectId = session.metadata?.projectId;

    if (!paiementId) {
      console.error('Missing paiement_id in session metadata');
      return;
    }

    // Mettre à jour le statut du paiement
    const { error: updateError } = await supabase
      .from('match_payments')
      .update({
        status: 'paid',
        updated_at: new Date().toISOString(),
      })
      .eq('id', paiementId);

    if (updateError) {
      console.error('Error updating payment status:', updateError);
      return;
    }

    // Mettre à jour le statut du projet
    if (projectId) {
      await supabase
        .from('projects')
        .update({
          status: 'in_progress',
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId);
    }

    // Débloquer le chat complet
    if (clientId && professionalId && projectId) {
      const { data: conversation } = await chatService.getOrCreateConversation(
        projectId,
        professionalId
      );
      if (conversation) {
        await chatService.activateConversation(conversation.id);
      }
    }

    // Envoyer les emails de notification
    if (clientId && professionalId && projectId) {
      await sendPaymentSuccessEmails(clientId, professionalId, projectId);
    }

    console.log('Payment processed successfully:', paiementId);
  } catch (error) {
    console.error('Error in handleCheckoutSessionCompleted:', error);
  }
}

async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
  console.log('Checkout session expired:', session.id);

  try {
    const paiementId = session.metadata?.paiement_id;
    const clientId = session.metadata?.clientId;
    const professionalId = session.metadata?.professionalId;
    const projectId = session.metadata?.projectId;

    if (!paiementId) {
      console.error('Missing paiement_id in session metadata');
      return;
    }

    // Mettre à jour le statut du paiement
    await supabase
      .from('match_payments')
      .update({
        status: 'expired',
        updated_at: new Date().toISOString(),
      })
      .eq('id', paiementId);

    // Mettre à jour le statut du projet
    if (projectId) {
      await supabase
        .from('projects')
        .update({
          status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId);
    }

    // Envoyer les emails d'expiration
    if (clientId && professionalId && projectId) {
      await sendPaymentExpiredEmails(clientId, professionalId, projectId);
    }

    console.log('Payment expired handled:', paiementId);
  } catch (error) {
    console.error('Error in handleCheckoutSessionExpired:', error);
  }
}

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
) {
  console.log('Payment intent succeeded:', paymentIntent.id);

  try {
    const paiementId = paymentIntent.metadata?.paiement_id;

    if (!paiementId) {
      console.error('Missing paiement_id in payment intent metadata');
      return;
    }

    // Le paiement est déjà traité via checkout.session.completed
    // On peut ajouter une logique supplémentaire si nécessaire
    console.log('Payment intent processed:', paiementId);
  } catch (error) {
    console.error('Error in handlePaymentIntentSucceeded:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment intent failed:', paymentIntent.id);

  try {
    const paiementId = paymentIntent.metadata?.paiement_id;
    const projectId = paymentIntent.metadata?.projectId;

    if (!paiementId) {
      console.error('Missing paiement_id in payment intent metadata');
      return;
    }

    // Mettre à jour le statut du paiement
    await supabase
      .from('match_payments')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
        error_message:
          paymentIntent.last_payment_error?.message || 'Payment failed',
      })
      .eq('id', paiementId);

    // Mettre à jour le statut du projet
    if (projectId) {
      await supabase
        .from('projects')
        .update({
          status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId);
    }

    console.log('Payment failure handled:', paiementId);
  } catch (error) {
    console.error('Error in handlePaymentIntentFailed:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Invoice payment succeeded:', invoice.id);
  // Pour les paiements récurrents si nécessaire
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Invoice payment failed:', invoice.id);
  // Pour les paiements récurrents si nécessaire
}

async function sendPaymentSuccessEmails(
  clientId: string,
  professionalId: string,
  projectId: string
) {
  try {
    // Récupérer les informations du projet
    const { data: projet } = await supabase
      .from('projects')
      .select(
        `
        id,
        title,
        client:profiles!projects_client_id_fkey(email, full_name),
        assigned_professional:profiles!projects_assigned_to_fkey(email, full_name)
      `
      )
      .eq('id', projectId)
      .single();

    if (!projet) {
      console.error('Projet non trouvé pour envoi emails');
      return;
    }

    // Récupérer l'email du professionnel depuis assigned_professional
    const assignedProf = projet.assigned_professional as unknown as Array<{
      email: string;
      full_name: string;
    }>;
    const clientData = projet.client as unknown as Array<{ full_name: string }>;
    const professionalEmail = assignedProf?.[0]?.email;
    const professionalName = assignedProf?.[0]?.full_name;

    // Envoyer l'email au professionnel
    await emailService.sendEmail({
      to: professionalEmail!,
      subject: 'Paiement confirmé - SwipeTonPro',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #28a745, #20c997); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">SwipeTonPro</h1>
          <p style="color: white; margin: 5px 0 0;">✅ Paiement confirmé</p>
        </div>
        
        <div style="padding: 30px; background: white;">
          <h2 style="color: #333; margin-bottom: 20px;">Bonjour ${professionalName},</h2>
          
          <p style="color: #666; line-height: 1.6;">
            Le paiement pour la mise en relation a été confirmé avec succès.
          </p>
          
          <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #155724; margin-top: 0;">📋 Détails du projet</h3>
            <p><strong>Titre:</strong> ${projet.title}</p>
            <p><strong>Client:</strong> ${clientData?.[0]?.full_name}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/professionnel/dashboard" 
               style="background: #ea580c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Accéder à mon dashboard
            </a>
          </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>Cet email a été envoyé via SwipeTonPro</p>
        </div>
      </div>`,
    });

    console.log('Payment success emails sent');
  } catch (error) {
    console.error('Error sending payment success emails:', error);
  }
}

async function sendPaymentExpiredEmails(
  clientId: string,
  professionalId: string,
  projectId: string
) {
  try {
    // Simplifié - juste un log pour l'instant
    console.log('Payment expired emails would be sent for:', {
      clientId,
      professionalId,
      projectId,
    });
  } catch (error) {
    console.error('Error sending payment expired emails:', error);
  }
}
