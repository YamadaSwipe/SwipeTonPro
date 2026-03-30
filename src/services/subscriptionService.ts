import { supabase } from '@/integrations/supabase/client';

interface LeadPack {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  leadsCount: number;
  validityDays: number;
  features: string[];
  active: boolean;
  popular?: boolean;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingInterval: 'month' | 'year';
  features: string[];
  leadsPerMonth: number;
  popular?: boolean;
  stripePriceId: string;
  active: boolean;
}

class SubscriptionService {
  // Packs de leads disponibles
  leadPacks: {
    discovery: LeadPack;
    professional: LeadPack;
    premium: LeadPack;
  } = {
    discovery: {
      id: 'pack-discovery',
      name: 'Pack Découverte',
      description: 'Idéal pour commencer',
      price: 149,
      currency: 'EUR',
      leadsCount: 5,
      validityDays: 30,
      features: [
        '5 leads qualifiés',
        'Support email',
        'Garantie satisfaction 7j',
        'Export CSV',
      ],
      active: true,
    },
    professional: {
      id: 'pack-professional',
      name: 'Pack Professionnel',
      description: 'Pour les professionnels actifs',
      price: 399,
      currency: 'EUR',
      leadsCount: 15,
      validityDays: 60,
      features: [
        '15 leads qualifiés',
        'Support prioritaire',
        'Garantie satisfaction 14j',
        'Filtres avancés',
        'Alertes instantanées',
      ],
      active: true,
      popular: true,
    },
    premium: {
      id: 'pack-premium',
      name: 'Pack Premium',
      description: 'Maximum de leads et de fonctionnalités',
      price: 999,
      currency: 'EUR',
      leadsCount: 50,
      validityDays: 90,
      features: [
        '50 leads qualifiés',
        'Support dédié 24/7',
        'Garantie satisfaction 30j',
        'Accès API',
        'Leads exclusifs',
        'Coaching personnalisé',
      ],
      active: true,
    },
  };

  // Plans d'abonnement
  subscriptionPlans: {
    basic: SubscriptionPlan;
    pro: SubscriptionPlan;
    enterprise: SubscriptionPlan;
  } = {
    basic: {
      id: 'plan-basic',
      name: 'Basic',
      description: 'Pour démarrer',
      price: 99,
      currency: 'EUR',
      billingInterval: 'month',
      leadsPerMonth: 10,
      features: [
        '10 leads/mois',
        'Support email',
        'Filtres de base',
        'Rapports mensuels',
      ],
      stripePriceId: 'price_basic_monthly',
      active: true,
    },
    pro: {
      id: 'plan-pro',
      name: 'Pro',
      description: 'Le plus populaire',
      price: 249,
      currency: 'EUR',
      billingInterval: 'month',
      leadsPerMonth: 30,
      features: [
        '30 leads/mois',
        'Support prioritaire',
        'Filtres avancés',
        'Alertes temps réel',
        'Analytics détaillées',
      ],
      popular: true,
      stripePriceId: 'price_pro_monthly',
      active: true,
    },
    enterprise: {
      id: 'plan-enterprise',
      name: 'Enterprise',
      description: 'Pour les grandes entreprises',
      price: 499,
      currency: 'EUR',
      billingInterval: 'month',
      leadsPerMonth: 100,
      features: [
        '100 leads/mois',
        'Support dédié',
        'Accès API complet',
        'Intégrations personnalisées',
        'Account manager',
      ],
      stripePriceId: 'price_enterprise_monthly',
      active: true,
    },
  };

  /**
   * Acheter un pack de leads
   */
  async purchaseLeadPack(
    userId: string,
    packId: string,
    paymentMethodId: string
  ): Promise<{ success: boolean; error?: string; packId?: string }> {
    try {
      const pack = this.leadPacks[packId as keyof typeof this.leadPacks];
      if (!pack) {
        return { success: false, error: 'Pack non trouvé' };
      }

      // Simulation d'un paiement réussi
      const paymentIntent = { status: 'succeeded' };

      if (paymentIntent.status !== 'succeeded') {
        return { success: false, error: 'Paiement échoué' };
      }

      // Créer l'achat du pack
      const { data: purchase, error } = await (supabase as any)
        .from('lead_pack_purchases')
        .insert({
          user_id: userId,
          pack_id: packId,
          price: pack.price,
          currency: pack.currency,
          leads_count: pack.leadsCount,
          leads_remaining: pack.leadsCount,
          validity_days: pack.validityDays,
          expires_at: new Date(Date.now() + pack.validityDays * 24 * 60 * 60 * 1000).toISOString(),
          stripe_payment_intent_id: 'sim_' + Math.random().toString(36).substr(2, 9),
          status: 'active',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, packId };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * S'abonner à un plan
   */
  async subscribeToPlan(
    userId: string,
    planId: string,
    paymentMethodId: string
  ): Promise<{ success: boolean; error?: string; subscriptionId?: string }> {
    try {
      const plan = this.subscriptionPlans[planId as keyof typeof this.subscriptionPlans];
      if (!plan) {
        return { success: false, error: 'Plan non trouvé' };
      }

      // Simulation d'un abonnement réussi
      const subscriptionId = 'sub_' + Math.random().toString(36).substr(2, 9);

      // Créer l'abonnement
      const { data: subscription, error } = await (supabase as any)
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_id: planId,
          price: plan.price,
          currency: plan.currency,
          billing_interval: plan.billingInterval,
          leads_per_month: plan.leadsPerMonth,
          leads_remaining: plan.leadsPerMonth,
          stripe_subscription_id: subscriptionId,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, subscriptionId };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Obtenir les packs de leads disponibles
   */
  getAvailableLeadPacks(): LeadPack[] {
    return Object.values(this.leadPacks).filter(pack => pack.active);
  }

  /**
   * Obtenir les plans d'abonnement disponibles
   */
  getAvailableSubscriptionPlans(): SubscriptionPlan[] {
    return Object.values(this.subscriptionPlans).filter(plan => plan.active);
  }

  /**
   * Obtenir les achats de packs d'un utilisateur
   */
  async getUserLeadPurchases(userId: string): Promise<{ data: any[]; error: any }> {
    try {
      const { data, error } = await (supabase as any)
        .from('lead_pack_purchases')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      return { data: data || [], error };
    } catch (error) {
      return { data: [], error };
    }
  }

  /**
   * Obtenir les abonnements d'un utilisateur
   */
  async getUserSubscriptions(userId: string): Promise<{ data: any[]; error: any }> {
    try {
      const { data, error } = await (supabase as any)
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      return { data: data || [], error };
    } catch (error) {
      return { data: [], error };
    }
  }
}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;
