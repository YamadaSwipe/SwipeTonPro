import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { withAuth, AuthenticatedRequest } from '@/middleware/withAuth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * API pour acheter un pack de crédits via Stripe
 * Méthode: POST
 * Body: { packId, successUrl?, cancelUrl? }
 */
export default withAuth(async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { packId, successUrl, cancelUrl } = req.body;

    // Validation des paramètres
    if (!packId) {
      return res.status(400).json({
        error: 'Paramètre manquant: packId requis',
      });
    }

    // Validation UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(packId)) {
      return res.status(400).json({ error: 'ID de pack invalide' });
    }

    // Récupérer le professionnel
    const { data: professional, error: proError } = await supabaseAdmin
      .from('professionals')
      .select('id, user_id, company_name')
      .eq('user_id', req.user.id)
      .single();

    if (proError || !professional) {
      return res.status(404).json({
        error: 'Profil professionnel non trouvé. Seuls les professionnels peuvent acheter des crédits.',
      });
    }

    // Récupérer les informations du pack
    const { data: pack, error: packError } = await supabaseAdmin
      .from('credit_packs')
      .select('*')
      .eq('id', packId)
      .eq('is_active', true)
      .single();

    if (packError || !pack) {
      return res.status(404).json({
        error: 'Pack de crédits non trouvé ou inactif',
      });
    }

    // Créer l'enregistrement de l'achat en attente
    const { data: purchase, error: purchaseError } = await supabaseAdmin
      .from('credit_pack_purchases')
      .insert({
        professional_id: professional.id,
        credit_pack_id: pack.id,
        credits_purchased: pack.credits_amount,
        bonus_credits: pack.bonus_credits,
        price_paid_cents: pack.price_cents,
        status: 'pending',
        metadata: {
          pack_name: pack.name,
          user_id: req.user.id,
        },
      })
      .select()
      .single();

    if (purchaseError) {
      console.error('Erreur création purchase:', purchaseError);
      return res.status(500).json({
        error: 'Erreur lors de la création de l\'achat',
        details: purchaseError.message,
      });
    }

    // Récupérer ou créer le customer Stripe
    let stripeCustomerId: string;

    const { data: existingCustomer } = await supabaseAdmin
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', req.user.id)
      .single();

    if (existingCustomer?.stripe_customer_id) {
      stripeCustomerId = existingCustomer.stripe_customer_id;
    } else {
      // Créer un nouveau customer Stripe
      const customer = await stripe.customers.create({
        email: req.user.email,
        metadata: {
          user_id: req.user.id,
          professional_id: professional.id,
        },
      });

      stripeCustomerId = customer.id;

      // Enregistrer dans la base de données
      await supabaseAdmin.from('stripe_customers').insert({
        user_id: req.user.id,
        stripe_customer_id: customer.id,
        email: req.user.email,
      });
    }

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: pack.name,
              description: `${pack.credits_amount + pack.bonus_credits} crédits (${pack.credits_amount} + ${pack.bonus_credits} bonus)`,
            },
            unit_amount: pack.price_cents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url:
        successUrl ||
        `${process.env.NEXT_PUBLIC_SITE_URL}/professionnel/credits?success=true&purchase_id=${purchase.id}`,
      cancel_url:
        cancelUrl ||
        `${process.env.NEXT_PUBLIC_SITE_URL}/professionnel/credits?canceled=true`,
      metadata: {
        type: 'credit_pack_purchase',
        purchase_id: purchase.id,
        professional_id: professional.id,
        pack_id: pack.id,
        credits_amount: pack.credits_amount.toString(),
        bonus_credits: pack.bonus_credits.toString(),
      },
    });

    // Mettre à jour l'achat avec l'ID de session Stripe
    await supabaseAdmin
      .from('credit_pack_purchases')
      .update({
        stripe_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', purchase.id);

    // Logger l'événement
    await supabaseAdmin.from('admin_actions').insert({
      admin_id: req.user.id,
      action_type: 'credit_pack_purchase_initiated',
      target_type: 'credit_pack_purchase',
      target_id: purchase.id,
      details: {
        pack_id: pack.id,
        pack_name: pack.name,
        total_credits: pack.credits_amount + pack.bonus_credits,
        price_euros: pack.price_euros,
        stripe_session_id: session.id,
      },
    });

    return res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url,
      purchaseId: purchase.id,
      pack: {
        name: pack.name,
        credits: pack.credits_amount,
        bonus: pack.bonus_credits,
        total: pack.credits_amount + pack.bonus_credits,
        price: pack.price_euros,
      },
    });
  } catch (error: any) {
    console.error('Erreur lors de la création de la session Stripe:', error);
    return res.status(500).json({
      error: 'Erreur serveur lors de la création du paiement',
      details: error.message,
    });
  }
});
