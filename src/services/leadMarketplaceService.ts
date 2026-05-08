import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export interface LeadForSale {
  id: string;
  project_id: string;
  client_id: string;
  title: string;
  category: string;
  city: string;
  budget_min: number;
  budget_max: number;
  qualification_score: number;
  status: 'hot' | 'warm' | 'cold';
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  timeline: string;
  description: string;
  contact_info: {
    email: string;
    phone?: string;
    name: string;
  };
  project_details: {
    work_type: string[];
    surface?: number;
    rooms?: number;
    specific_requirements?: string;
  };
  created_at: string;
  price: number;
  is_available: boolean;
  sold_count: number;
  max_sales: number;
}

export interface LeadPurchase {
  lead_id: string;
  buyer_id: string;
  purchase_price: number;
  payment_status: 'pending' | 'completed' | 'failed';
  purchased_at: string;
  access_granted_at?: string;
  contact_details_revealed: boolean;
}

export const leadMarketplaceService = {
  /**
   * Récupérer les leads disponibles à la vente
   */
  async getAvailableLeads(filters?: {
    category?: string;
    city?: string;
    minBudget?: number;
    maxBudget?: number;
    qualificationLevel?: 'hot' | 'warm' | 'cold';
    urgency?: string;
  }): Promise<{ data: LeadForSale[] | null; error: Error | null }> {
    try {
      let query = (supabase as any)
        .from('leads_for_sale')
        .select('*')
        .eq('is_available', true)
        .order('qualification_score', { ascending: false });

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.city) {
        query = query.eq('city', filters.city);
      }
      if (filters?.minBudget) {
        query = query.gte('budget_min', filters.minBudget);
      }
      if (filters?.maxBudget) {
        query = query.lte('budget_max', filters.maxBudget);
      }
      if (filters?.qualificationLevel) {
        const scoreRange =
          filters.qualificationLevel === 'hot'
            ? [70, 100]
            : filters.qualificationLevel === 'warm'
              ? [40, 69]
              : [0, 39];
        query = query
          .gte('qualification_score', scoreRange[0])
          .lte('qualification_score', scoreRange[1]);
      }
      if (filters?.urgency) {
        query = query.eq('urgency', filters.urgency);
      }

      const { data, error } = await query;
      return { data, error: error as Error };
    } catch (error) {
      console.error('Erreur récupération leads:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Mettre un lead en vente
   */
  async putLeadForSale(
    leadId: string,
    price: number,
    maxSales: number = 3
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Récupérer les informations du lead
      const { data: lead, error: leadError } = await (supabase as any)
        .from('leads')
        .select(
          `
          *,
          project:projects(id, title, category, city, budget_min, budget_max, description, work_type),
          client:profiles(id, email, phone, full_name)
        `
        )
        .eq('id', leadId)
        .single();

      if (leadError || !lead) {
        throw new Error('Lead non trouvé');
      }

      // Préparer les données pour la vente
      const leadForSale = {
        id: lead.id,
        project_id: lead.project_id,
        client_id: lead.client_id,
        title: lead.project?.title || 'Projet sans titre',
        category: lead.project?.category || 'Autre',
        city: lead.project?.city || 'Non spécifié',
        budget_min: lead.project?.budget_min || 0,
        budget_max: lead.project?.budget_max || 0,
        qualification_score: lead.qualification_score || 0,
        status:
          lead.status === 'hot'
            ? 'hot'
            : lead.status === 'qualified'
              ? 'warm'
              : 'cold',
        urgency: lead.urgency || 'medium',
        timeline: lead.timeline || 'Non spécifié',
        description: lead.project?.description || '',
        contact_info: {
          email: lead.client?.email || '',
          phone: lead.client?.phone || '',
          name: lead.client?.full_name || 'Client',
        },
        project_details: {
          work_type: lead.project?.work_type || [],
          surface: 0, // À implémenter
          rooms: 0, // À implémenter
          specific_requirements: '', // À implémenter
        },
        created_at: lead.created_at,
        price: price,
        is_available: true,
        sold_count: 0,
        max_sales: maxSales,
      };

      // Insérer dans la table des leads à vendre
      const { error: insertError } = await (supabase as any)
        .from('leads_for_sale')
        .insert(leadForSale);

      if (insertError) throw insertError;

      // Mettre à jour le statut du lead original
      await (supabase as any)
        .from('leads')
        .update({
          status: 'for_sale',
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId);

      return { success: true };
    } catch (error) {
      console.error('Erreur mise en vente lead:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Acheter un lead
   */
  async purchaseLead(
    leadId: string,
    buyerId: string,
    purchasePrice: number
  ): Promise<{ success: boolean; error?: string; purchaseId?: string }> {
    try {
      // Vérifier que le lead est disponible
      const { data: lead, error: leadError } = await (supabase as any)
        .from('leads_for_sale')
        .select('*')
        .eq('id', leadId)
        .eq('is_available', true)
        .single();

      if (leadError || !lead) {
        throw new Error('Lead non disponible');
      }

      // Vérifier que le nombre de ventes n'est pas dépassé
      if (lead.sold_count >= lead.max_sales) {
        throw new Error('Ce lead a atteint son nombre maximum de ventes');
      }

      // Créer l'enregistrement d'achat
      const purchaseData = {
        lead_id: leadId,
        buyer_id: buyerId,
        purchase_price: purchasePrice,
        payment_status: 'pending',
        purchased_at: new Date().toISOString(),
        contact_details_revealed: false,
      };

      const { data: purchase, error: purchaseError } = await (supabase as any)
        .from('lead_purchases')
        .insert(purchaseData)
        .select()
        .single();

      if (purchaseError || !purchase) {
        throw new Error("Erreur lors de l'achat");
      }

      // Mettre à jour le compteur de ventes
      const newSoldCount = lead.sold_count + 1;
      const isStillAvailable = newSoldCount < lead.max_sales;

      await (supabase as any)
        .from('leads_for_sale')
        .update({
          sold_count: newSoldCount,
          is_available: isStillAvailable,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId);

      return { success: true, purchaseId: purchase.id };
    } catch (error) {
      console.error('Erreur achat lead:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Confirmer le paiement et révéler les informations de contact
   */
  async confirmPaymentAndRevealContact(
    purchaseId: string
  ): Promise<{ success: boolean; error?: string; contactInfo?: any }> {
    try {
      // Récupérer les détails de l'achat
      const { data: purchase, error: purchaseError } = await (supabase as any)
        .from('lead_purchases')
        .select(
          `
          *,
          lead:leads_for_sale(id, title, contact_info, project_details)
        `
        )
        .eq('id', purchaseId)
        .single();

      if (purchaseError || !purchase) {
        throw new Error('Achat non trouvé');
      }

      // Simuler le paiement (dans un vrai système, on intégrerait Stripe ici)
      const paymentSuccessful = true; // Simulation

      if (!paymentSuccessful) {
        throw new Error('Paiement échoué');
      }

      // Mettre à jour le statut du paiement
      await (supabase as any)
        .from('lead_purchases')
        .update({
          payment_status: 'completed',
          contact_details_revealed: true,
          access_granted_at: new Date().toISOString(),
        })
        .eq('id', purchaseId);

      return {
        success: true,
        contactInfo: purchase.lead?.contact_info,
      };
    } catch (error) {
      console.error('Erreur confirmation paiement:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Récupérer les achats d'un professionnel
   */
  async getBuyerPurchases(
    buyerId: string
  ): Promise<{ data: any[] | null; error: Error | null }> {
    try {
      const { data, error } = await (supabase as any)
        .from('lead_purchases')
        .select(
          `
          *,
          lead:leads_for_sale(id, title, category, city, budget_max, price)
        `
        )
        .eq('buyer_id', buyerId)
        .order('purchased_at', { ascending: false });

      return { data, error: error as Error };
    } catch (error) {
      console.error('Erreur récupération achats:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Calculer le prix recommandé pour un lead
   */
  calculateRecommendedPrice(lead: any): number {
    const basePrice = 50; // Prix de base

    // Ajustement selon le score de qualification
    const scoreMultiplier = lead.qualification_score / 100;
    const priceFromScore = basePrice * (1 + scoreMultiplier);

    // Ajustement selon le budget
    const budgetMultiplier = (lead.budget_max || 0) / 10000; // 10€ = 1x
    const priceFromBudget = basePrice * Math.min(budgetMultiplier, 5); // Max 5x

    // Ajustement selon l'urgence
    const urgencyMultiplier =
      lead.urgency === 'urgent'
        ? 1.5
        : lead.urgency === 'high'
          ? 1.2
          : lead.urgency === 'medium'
            ? 1.0
            : 0.8;

    const finalPrice = Math.max(
      basePrice,
      Math.max(priceFromScore, priceFromBudget) * urgencyMultiplier
    );

    return Math.round(finalPrice * 10) / 10; // Arrondir à 10 centimes
  },

  /**
   * Récupérer les statistiques du marketplace
   */
  async getMarketplaceStats(): Promise<{
    totalLeads: number;
    availableLeads: number;
    soldLeads: number;
    totalRevenue: number;
    averagePrice: number;
    topCategories: { category: string; count: number }[];
    topCities: { city: string; count: number }[];
  }> {
    try {
      const { data: leads, error } = await (supabase as any)
        .from('leads_for_sale')
        .select('*');

      if (error || !leads) {
        throw error;
      }

      const totalLeads = leads.length;
      const availableLeads = leads.filter((lead) => lead.is_available).length;
      const soldLeads = leads.reduce((sum, lead) => sum + lead.sold_count, 0);
      const totalRevenue = leads.reduce(
        (sum, lead) => sum + lead.price * lead.sold_count,
        0
      );
      const averagePrice = totalLeads > 0 ? totalRevenue / soldLeads : 0;

      // Calculer les catégories et villes les plus populaires
      const categoryCounts = leads.reduce(
        (acc, lead) => {
          acc[lead.category] = (acc[lead.category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const cityCounts = leads.reduce(
        (acc, lead) => {
          acc[lead.city] = (acc[lead.city] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const topCategories = Object.entries(categoryCounts)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([category, count]) => ({ category, count: count as number }));

      const topCities = Object.entries(cityCounts)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([city, count]) => ({ city, count: count as number }));

      return {
        totalLeads,
        availableLeads,
        soldLeads,
        totalRevenue,
        averagePrice,
        topCategories,
        topCities,
      };
    } catch (error) {
      console.error('Erreur statistiques marketplace:', error);
      return {
        totalLeads: 0,
        availableLeads: 0,
        soldLeads: 0,
        totalRevenue: 0,
        averagePrice: 0,
        topCategories: [],
        topCities: [],
      };
    }
  },
};
