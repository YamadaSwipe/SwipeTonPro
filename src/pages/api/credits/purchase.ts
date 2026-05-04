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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { packageId, professionalId, successUrl, cancelUrl } = req.body;

    if (!packageId || !professionalId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Récupérer le package
    const { data: pkg, error: pkgError } = await supabaseAdmin
      .from('credit_packages')
      .select('*')
      .eq('id', packageId)
      .single();

    if (pkgError || !pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Récupérer les infos du professionnel
    const { data: pro, error: proError } = await supabaseAdmin
      .from('professionals')
      .select('user_id, company_name')
      .eq('id', professionalId)
      .single();

    if (proError || !pro) {
      return res.status(404).json({ error: 'Professional not found' });
    }

    // Récupérer l'email de l'utilisateur
    const { data: userData, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', pro.user_id)
      .single();

    if (userError || !userData?.email) {
      return res.status(404).json({ error: 'User email not found' });
    }

    const totalCredits = pkg.credits_amount + (pkg.bonus_credits || 0);

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${pkg.name} - ${totalCredits} crédits`,
              description: `${pkg.credits_amount} crédits + ${pkg.bonus_credits || 0} gratuits`,
            },
            unit_amount: Math.round(pkg.price_euros * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/professionnel/credits/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/professionnel/credits/cancel`,
      customer_email: userData.email,
      metadata: {
        professional_id: professionalId,
        package_id: packageId,
        credits_amount: String(pkg.credits_amount),
        bonus_credits: String(pkg.bonus_credits || 0),
        type: 'credit_purchase',
      },
    });

    // Créer une transaction en attente
    await supabaseAdmin.from('credit_transactions').insert({
      professional_id: professionalId,
      type: 'purchase',
      amount: 0, // Sera mis à jour après confirmation paiement
      balance_after: 0, // Sera mis à jour après confirmation
      description: `Achat ${pkg.name} - ${totalCredits} crédits (en attente)`,
      stripe_payment_intent_id: session.id,
      status: 'pending',
    });

    return res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Error creating credit purchase session:', error);
    return res.status(500).json({
      error: 'Failed to create purchase session',
      details: error.message,
    });
  }
}
