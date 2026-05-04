/**
 * @fileoverview API Stripe pour créer un PaymentIntent (App Router)
 * @author Senior Architect
 * @version 1.0.0
 *
 * API sécurisée pour créer un PaymentIntent Stripe avec authentification
 * Compatible App Router (Next.js 13+)
 */

import { NextRequest, NextResponse } from 'next/server';
import AuthMiddleware from '@/middleware/authMiddleware';
import { createClient } from '@supabase/supabase-js';

// Initialisation Supabase côté serveur
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialisation Stripe
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Interface pour les données de création de PaymentIntent
 */
interface CreatePaymentIntentRequest {
  amount: number;
  currency: string;
  description: string;
  metadata?: Record<string, string>;
  // professionalId supprimé - sera dérivé du user.id côté backend
}

/**
 * Fonction principale de l'API (App Router)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔒 Stripe API: Creating payment intent (App Router)');

    // ÉTAPE 0: Authentification via middleware (SÉCURITÉ RENFORCÉE)
    const authResult = await AuthMiddleware.authenticate(request);

    if (authResult.error) {
      console.error('❌ Stripe API: Authentication failed:', authResult.error);
      return AuthMiddleware.createErrorResponse(authResult.error);
    }

    if (!authResult.user) {
      console.error('❌ Stripe API: No user found');
      return AuthMiddleware.createErrorResponse('Utilisateur non authentifié');
    }

    console.log('✅ Stripe API: User authenticated:', authResult.user.email);
    console.log('🔍 Stripe API: User role:', authResult.role);

    // ÉTAPE 1: Valider les données de la requête
    const body = await request.json();
    const { amount, currency, description, metadata } =
      body as CreatePaymentIntentRequest;

    console.log('🔍 DEBUG: Request body received:', {
      amount,
      currency,
      description,
    });

    if (!amount || !currency || !description) {
      console.error('❌ Stripe API: Missing required fields', {
        amount,
        currency,
        description,
      });
      return NextResponse.json(
        {
          error: 'Missing required fields',
          message: 'Données requises manquantes',
        },
        { status: 400 }
      );
    }

    // ÉTAPE 1.1: Valider que l'utilisateur est bien un professionnel
    if (!AuthMiddleware.hasRole(authResult.role, 'professional')) {
      console.error('❌ Stripe API: User not professional:', authResult.role);
      return AuthMiddleware.createPermissionError(
        'Seul un professionnel peut acheter des crédits'
      );
    }

    if (!authResult.professional) {
      console.error('❌ Stripe API: Professional profile not found');
      return AuthMiddleware.createPermissionError(
        'Profil professionnel non trouvé'
      );
    }

    console.log(
      '✅ Stripe API: Professional validated:',
      authResult.professional.company_name
    );

    if (authResult.professional.status !== 'verified') {
      console.error('❌ Stripe API: Professional not verified', {
        status: authResult.professional.status,
      });
      return AuthMiddleware.createPermissionError('Professionnel non vérifié');
    }

    console.log(
      '✅ Stripe API: Professional verified:',
      authResult.professional.company_name
    );

    // ÉTAPE 5: Créer le PaymentIntent Stripe
    console.log('💳 Creating Stripe PaymentIntent...');

    const paymentIntentData = {
      amount: Math.round(amount), // S'assurer que c'est un entier
      currency: currency.toLowerCase(),
      description,
      metadata: {
        ...metadata,
        user_id: authResult.user.id,
        professional_id: authResult.professional.id,
        professional_name: authResult.professional.company_name,
        created_at: new Date().toISOString(),
      },
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
    };

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    console.log('✅ PaymentIntent created:', paymentIntent.id);

    // ÉTAPE 6: Logger la création pour audit
    try {
      await supabase.from('payment_logs').insert({
        payment_intent_id: paymentIntent.id,
        user_id: authResult.user.id,
        professional_id: authResult.professional.id,
        amount: amount,
        currency: currency,
        status: 'created',
        metadata: paymentIntentData.metadata,
        created_at: new Date().toISOString(),
      });

      console.log('✅ Payment logged successfully');
    } catch (logError) {
      console.warn('⚠️ Could not log payment:', logError);
      // Ne pas bloquer si le logging échoue
    }

    // ÉTAPE 7: Retourner le client_secret
    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      user: {
        id: authResult.user.id,
        email: authResult.user.email,
      },
      professional: {
        id: authResult.professional.id,
        company_name: authResult.professional.company_name,
      },
    });
  } catch (error) {
    console.error('❌ Stripe API error:', error);

    // Gérer les erreurs Stripe spécifiques
    if (error.type === 'StripeCardError') {
      return NextResponse.json(
        {
          error: 'Card error',
          message: error.message || 'Erreur de carte bancaire',
        },
        { status: 400 }
      );
    }

    if (error.type === 'StripeRateLimitError') {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Trop de tentatives, veuillez réessayer plus tard',
        },
        { status: 429 }
      );
    }

    // Erreur générique
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Erreur interne du serveur',
        details:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
