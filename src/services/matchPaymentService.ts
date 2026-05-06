import { supabase } from '@/integrations/supabase/client';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

export interface MatchPricing {
  key: string;
  label: string;
  price_cents: number;
  price_euros: number;
  currency: string;
  description: string;
}

export interface PricingTier {
  id: string;
  key: string;
  label: string;
  budget_min: number;
  budget_max: number | null;
  price_cents: number;
  price_euros: number;
  currency: string;
  description: string;
  is_active: boolean;
}

// Prix de secours si la DB est inaccessible
const FALLBACK_PRICE: MatchPricing = {
  key: 'fallback',
  label: 'Mise en relation standard',
  price_cents: 6500,
  price_euros: 65,
  currency: 'eur',
  description: 'Prix standard de mise en relation',
};

/**
 * Récupère le prix selon le budget du projet via la fonction RPC
 * Paliers configurables depuis le dashboard admin
 */
export async function getMatchPriceForBudget(
  projectBudget: number
): Promise<MatchPricing> {
  try {
    const { data, error } = await (supabase as any).rpc('get_match_price', {
      p_budget: projectBudget,
    });

    if (error || !data || data.length === 0) {
      console.warn('Palier non trouvé, utilisation du prix de secours');
      return FALLBACK_PRICE;
    }

    const tier = data[0];
    return {
      key: tier.key,
      label: tier.label,
      price_cents: tier.price_cents,
      price_euros: tier.price_cents / 100,
      currency: tier.currency,
      description: tier.description,
    };
  } catch (error) {
    console.error('Erreur récupération prix match:', error);
    return FALLBACK_PRICE;
  }
}

/**
 * Récupère tous les paliers tarifaires (affichage admin + page tarifs)
 */
export async function getAllPricingTiers(): Promise<PricingTier[]> {
  try {
    const { data, error } = await supabase
      .from('pricing_config')
      .select('*')
      .order('budget_min', { ascending: true });

    if (error || !data) return [];

    return data.map((tier: any) => ({
      ...tier,
      price_euros: tier.price_cents / 100,
    }));
  } catch (error) {
    console.error('Erreur récupération paliers:', error);
    return [];
  }
}

/**
 * Met à jour un palier tarifaire - admin uniquement
 */
export async function updatePricingTier(
  tierId: string,
  updates: {
    price_cents?: number;
    label?: string;
    description?: string;
    is_active?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('pricing_config')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', tierId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Erreur mise à jour palier:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Crée un Payment Intent Stripe
 * Prix calculé automatiquement selon le budget du projet
 */
export async function createMatchPaymentIntent(
  professionalId: string,
  projectId: string
): Promise<{
  clientSecret: string;
  paymentIntentId: string;
  pricing: MatchPricing;
}> {
  try {
    // Vérifier qu'un match n'existe pas déjà
    const { data: existingMatch } = await supabase
      .from('project_interests')
      .select('id')
      .eq('professional_id', professionalId)
      .eq('project_id', projectId)
      .eq('status', 'accepted')
      .maybeSingle();

    if (existingMatch) {
      throw new Error('Vous avez déjà accès à ce projet');
    }

    // Vérifier qu'un paiement n'est pas déjà en cours
    const { data: existingPayment } = await supabase
      .from('match_payments' as any)
      .select('id, status')
      .eq('professional_id', professionalId)
      .eq('project_id', projectId)
      .in('status', ['pending', 'succeeded'])
      .maybeSingle();

    const payment = existingPayment as any;
    if (payment?.status === 'succeeded')
      throw new Error('Paiement déjà effectué pour ce projet');
    if (payment?.status === 'pending')
      throw new Error('Un paiement est déjà en cours pour ce projet');

    // Récupérer le projet et son budget
    const { data: project } = await supabase
      .from('projects')
      .select('title, budget_max, budget_min')
      .eq('id', projectId)
      .single();

    if (!project) throw new Error('Projet introuvable');

    // Calculer le prix selon le budget du projet
    const projectBudget = project.budget_max || project.budget_min || 0;
    const pricing = await getMatchPriceForBudget(projectBudget);

    // Créer le Payment Intent via l'API Next.js
    const response = await fetch('/api/stripe/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: pricing.price_cents,
        currency: pricing.currency,
        professionalId,
        projectId,
        description: `${pricing.label} - ${project.title}`,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Erreur lors de la création du paiement');
    }

    const data = await response.json();

    // Enregistrer le paiement en statut pending
    await supabase.from('match_payments' as any).insert({
      professional_id: professionalId,
      project_id: projectId,
      stripe_payment_intent_id: data.paymentIntentId,
      amount_cents: pricing.price_cents,
      currency: pricing.currency,
      pricing_key: pricing.key,
      status: 'pending',
    });

    return {
      clientSecret: data.clientSecret,
      paymentIntentId: data.paymentIntentId,
      pricing,
    };
  } catch (error) {
    console.error('Erreur création payment intent:', error);
    throw error;
  }
}

/**
 * Confirme le paiement, crée le match et envoie les 3 notifications email
 * (pro + particulier + support)
 */
export async function confirmMatchPayment(
  professionalId: string,
  projectId: string,
  paymentIntentId: string
): Promise<{ success: boolean; matchId?: string; message: string }> {
  try {
    // Créer le match de manière atomique via RPC
    const { data, error } = await supabase.rpc('create_paid_match', {
      p_professional_id: professionalId,
      p_project_id: projectId,
      p_stripe_payment_intent_id: paymentIntentId,
    });

    if (error) throw error;

    const result = Array.isArray(data) ? data[0] : data;

    if (!result.success) {
      return {
        success: false,
        message: result.message || 'Erreur lors de la création du match',
      };
    }

    // Récupérer le client_id et le montant payé pour les notifications
    const { data: project } = await supabase
      .from('projects')
      .select('client_id')
      .eq('id', projectId)
      .single();

    // Récupérer le montant exact payé depuis match_payments
    const { data: paymentRecord } = await supabase
      .from('match_payments' as any)
      .select('amount_cents')
      .eq('professional_id', professionalId)
      .eq('project_id', projectId)
      .eq('stripe_payment_intent_id', paymentIntentId)
      .maybeSingle();

    const pricePaid = paymentRecord
      ? ((paymentRecord as any).amount_cents / 100).toFixed(2)
      : null;

    if (project?.client_id) {
      // Envoyer les 3 emails via l'API notify-match (pro + particulier + support)
      await fetch('/api/notify-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          professionalId,
          clientId: project.client_id,
          pricePaid,
        }),
      });
    }

    return {
      success: true,
      matchId: result.match_id,
      message:
        'Match confirmé ! Vous pouvez maintenant contacter le client et organiser un rendez-vous.',
    };
  } catch (error) {
    console.error('Erreur confirmation paiement:', error);
    return {
      success: false,
      message: 'Erreur lors de la confirmation du paiement',
    };
  }
}

/**
 * Vérifie le statut d'un paiement existant
 */
export async function checkPaymentStatus(
  professionalId: string,
  projectId: string
): Promise<{
  hasPaid: boolean;
  status?: string;
  matchId?: string;
  pricing?: MatchPricing;
}> {
  try {
    const { data: paymentData } = await supabase
      .from('match_payments' as any)
      .select('status, id, amount_cents, currency, pricing_key')
      .eq('professional_id', professionalId)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const payment = paymentData as any;

    if (!payment || payment.status !== 'succeeded') {
      return { hasPaid: false };
    }

    const { data: match } = await supabase
      .from('project_interests')
      .select('id')
      .eq('professional_id', professionalId)
      .eq('project_id', projectId)
      .eq('status', 'accepted')
      .maybeSingle();

    return {
      hasPaid: true,
      status: payment.status,
      matchId: match?.id,
      pricing: payment.amount_cents
        ? {
            key: payment.pricing_key || 'unknown',
            label: 'Mise en relation',
            price_cents: payment.amount_cents,
            price_euros: payment.amount_cents / 100,
            currency: payment.currency,
            description: '',
          }
        : undefined,
    };
  } catch (error) {
    console.error('Erreur vérification statut paiement:', error);
    return { hasPaid: false };
  }
}

/**
 * Historique des paiements d'un professionnel
 */
export async function getPaymentHistory(professionalId: string) {
  try {
    const { data, error } = await supabase
      .from('match_payments' as any)
      .select(`*, projects(title, city, category, budget_max)`)
      .eq('professional_id', professionalId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as any[];
  } catch (error) {
    console.error('Erreur historique paiements:', error);
    return [];
  }
}

/**
 * Statistiques de paiement d'un professionnel
 */
export async function getPaymentStats(professionalId: string) {
  try {
    const { data, error } = await supabase
      .from('match_payments' as any)
      .select('amount_cents, status, created_at')
      .eq('professional_id', professionalId);

    if (error) throw error;

    const payments = (data || []) as any[];
    const succeeded = payments.filter((p) => p.status === 'succeeded');
    const total = succeeded.reduce((sum, p) => sum + p.amount_cents, 0);
    const now = new Date();
    const thisMonth = succeeded.filter((p) => {
      const date = new Date(p.created_at);
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }).length;

    return {
      totalSpent: total / 100,
      matchesUnlocked: succeeded.length,
      thisMonth,
    };
  } catch (error) {
    console.error('Erreur statistiques paiements:', error);
    return { totalSpent: 0, matchesUnlocked: 0, thisMonth: 0 };
  }
}

// Service objet exporté pour les imports nommés
export const matchPaymentService = {
  createPaymentIntent: async (params: {
    professionalId: string;
    projectId: string;
    matchId: string;
  }) => {
    const price = await getMatchPriceForBudget(1000); // Budget par défaut
    return createMatchPayment(params.matchId, price.price_cents);
  },
  getMatchPriceForBudget,
  createMatchPayment,
  confirmMatchPayment,
};

// Fonction utilitaire pour calculer les frais
export async function calculateMatchingFee(budget: number): Promise<number> {
  const price = await getMatchPriceForBudget(budget);
  return price.price_cents;
}
