import { supabase } from '@/integrations/supabase/client';

interface CommissionTier {
  id: string;
  name: string;
  minLeads: number;
  maxLeads: number;
  commissionRate: number; // Pourcentage
  baseCommission: number; // Commission de base
  bonusThreshold: number;
  bonusRate: number;
}

interface CommissionCalculation {
  userId: string;
  period: string; // YYYY-MM
  totalLeads: number;
  totalRevenue: number;
  baseCommission: number;
  tierBonus: number;
  performanceBonus: number;
  totalCommission: number;
  tier: CommissionTier;
}

interface PerformanceMetrics {
  leadConversionRate: number;
  averageLeadValue: number;
  responseTime: number;
  customerSatisfaction: number;
  repeatBusinessRate: number;
}

interface CommissionPayout {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  period: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  paidAt?: string;
  approvedAt?: string;
  rejectedReason?: string;
  bankDetails: {
    iban: string;
    bankName: string;
    accountHolder: string;
  };
  createdAt: string;
}

export const commissionService = {
  // Tiers de commission
  commissionTiers: {
    bronze: {
      id: 'bronze',
      name: 'Bronze',
      minLeads: 0,
      maxLeads: 10,
      commissionRate: 0.10, // 10%
      baseCommission: 5, // 5€ par lead
      bonusThreshold: 5,
      bonusRate: 0.02, // 2% bonus
    },
    silver: {
      id: 'silver',
      name: 'Argent',
      minLeads: 11,
      maxLeads: 25,
      commissionRate: 0.12, // 12%
      baseCommission: 7, // 7€ par lead
      bonusThreshold: 15,
      bonusRate: 0.03, // 3% bonus
    },
    gold: {
      id: 'gold',
      name: 'Or',
      minLeads: 26,
      maxLeads: 50,
      commissionRate: 0.15, // 15%
      baseCommission: 10, // 10€ par lead
      bonusThreshold: 30,
      bonusRate: 0.05, // 5% bonus
    },
    platinum: {
      id: 'platinum',
      name: 'Platine',
      minLeads: 51,
      maxLeads: Infinity,
      commissionRate: 0.20, // 20%
      baseCommission: 15, // 15€ par lead
      bonusThreshold: 40,
      bonusRate: 0.08, // 8% bonus
    },
  } as Record<string, CommissionTier>,

  /**
   * Calculer les commissions pour un utilisateur et une période
   */
  async calculateCommission(
    userId: string,
    period: string // YYYY-MM
  ): Promise<CommissionCalculation | null> {
    try {
      // Récupérer les leads vendus pour la période
      const startDate = new Date(period + '-01');
      const endDate = new Date(period + '-01');
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(-1); // Dernier jour du mois

      const { data: soldLeads, error } = await (supabase as any)
        .from('lead_purchases')
        .select(`
          purchase_price,
          leads_for_sale!inner(
            qualification_score,
            project_details
          )
        `)
        .eq('buyer_id', userId)
        .gte('purchased_at', startDate.toISOString())
        .lte('purchased_at', endDate.toISOString())
        .eq('payment_status', 'completed');

      if (error) throw error;

      const totalLeads = soldLeads?.length || 0;
      const totalRevenue = soldLeads?.reduce((sum, lead) => sum + lead.purchase_price, 0) || 0;

      // Déterminer le tier
      const tier = this.getCommissionTier(totalLeads);

      // Calculer la commission de base
      const baseCommission = totalLeads * tier.baseCommission;

      // Calculer le bonus de tier
      const tierBonus = totalLeads > tier.bonusThreshold 
        ? totalRevenue * tier.bonusRate 
        : 0;

      // Calculer les bonus de performance
      const performance = await this.calculatePerformanceMetrics(userId, period);
      const performanceBonus = this.calculatePerformanceBonus(performance, totalRevenue);

      // Commission totale
      const totalCommission = baseCommission + tierBonus + performanceBonus;

      return {
        userId,
        period,
        totalLeads,
        totalRevenue,
        baseCommission,
        tierBonus,
        performanceBonus,
        totalCommission,
        tier,
      };
    } catch (error) {
      console.error('Erreur calcul commission:', error);
      return null;
    }
  },

  /**
   * Obtenir le tier de commission
   */
  getCommissionTier(leadsCount: number): CommissionTier {
    for (const [key, tier] of Object.entries(this.commissionTiers)) {
      if (leadsCount >= (tier as any).minLeads && leadsCount <= (tier as any).maxLeads) {
        return tier as CommissionTier;
      }
    }
    return this.commissionTiers.platinum; // Par défaut
  },

  /**
   * Calculer les métriques de performance
   */
  async calculatePerformanceMetrics(
    userId: string,
    period: string
  ): Promise<PerformanceMetrics> {
    try {
      // Récupérer les données de performance
      const { data: performanceData } = await (supabase as any)
        .from('performance_metrics')
        .select('*')
        .eq('user_id', userId)
        .eq('period', period)
        .single();

      if (performanceData) {
        return {
          leadConversionRate: performanceData.lead_conversion_rate || 0,
          averageLeadValue: performanceData.average_lead_value || 0,
          responseTime: performanceData.response_time || 0,
          customerSatisfaction: performanceData.customer_satisfaction || 0,
          repeatBusinessRate: performanceData.repeat_business_rate || 0,
        };
      }

      // Calculer depuis les données brutes si pas de données pré-calculées
      return await this.calculatePerformanceFromRawData(userId, period);
    } catch (error) {
      console.error('Erreur métriques performance:', error);
      return {
        leadConversionRate: 0,
        averageLeadValue: 0,
        responseTime: 0,
        customerSatisfaction: 0,
        repeatBusinessRate: 0,
      };
    }
  },

  /**
   * Calculer la performance depuis les données brutes
   */
  async calculatePerformanceFromRawData(
    userId: string,
    period: string
  ): Promise<PerformanceMetrics> {
    // Implémentation simplifiée - en production, calculer depuis les données réelles
    return {
      leadConversionRate: 0.75, // 75%
      averageLeadValue: 150,
      responseTime: 2.5, // heures
      customerSatisfaction: 4.2, // sur 5
      repeatBusinessRate: 0.25, // 25%
    };
  },

  /**
   * Calculer les bonus de performance
   */
  calculatePerformanceBonus(
    performance: PerformanceMetrics,
    totalRevenue: number
  ): number {
    let bonus = 0;

    // Bonus de conversion (jusqu'à 5%)
    if (performance.leadConversionRate > 0.8) {
      bonus += totalRevenue * 0.05;
    } else if (performance.leadConversionRate > 0.6) {
      bonus += totalRevenue * 0.03;
    } else if (performance.leadConversionRate > 0.4) {
      bonus += totalRevenue * 0.01;
    }

    // Bonus de satisfaction (jusqu'à 3%)
    if (performance.customerSatisfaction > 4.5) {
      bonus += totalRevenue * 0.03;
    } else if (performance.customerSatisfaction > 4.0) {
      bonus += totalRevenue * 0.02;
    } else if (performance.customerSatisfaction > 3.5) {
      bonus += totalRevenue * 0.01;
    }

    // Bonus de rapidité (jusqu'à 2%)
    if (performance.responseTime < 1) {
      bonus += totalRevenue * 0.02;
    } else if (performance.responseTime < 2) {
      bonus += totalRevenue * 0.01;
    }

    // Bonus de fidélisation (jusqu'à 2%)
    if (performance.repeatBusinessRate > 0.3) {
      bonus += totalRevenue * 0.02;
    } else if (performance.repeatBusinessRate > 0.2) {
      bonus += totalRevenue * 0.01;
    }

    return bonus;
  },

  /**
   * Créer une demande de paiement
   */
  async createPayoutRequest(
    userId: string,
    period: string,
    bankDetails: CommissionPayout['bankDetails']
  ): Promise<{ success: boolean; error?: string; payoutId?: string }> {
    try {
      // Calculer la commission
      const commission = await this.calculateCommission(userId, period);
      if (!commission) {
        return { success: false, error: 'Impossible de calculer la commission' };
      }

      // Vérifier si une demande existe déjà
      const { data: existingPayout } = await (supabase as any)
        .from('commission_payouts')
        .select('*')
        .eq('user_id', userId)
        .eq('period', period)
        .single();

      if (existingPayout) {
        return { success: false, error: 'Une demande de paiement existe déjà pour cette période' };
      }

      // Créer la demande de paiement
      const { data: payout, error } = await (supabase as any)
        .from('commission_payouts')
        .insert({
          user_id: userId,
          amount: commission.totalCommission,
          currency: 'EUR',
          period,
          status: 'pending',
          bank_details: bankDetails,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, payoutId: payout.id };
    } catch (error) {
      console.error('Erreur demande paiement:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Approuver une demande de paiement
   */
  async approvePayout(
    payoutId: string,
    approvedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase as any)
        .from('commission_payouts')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: approvedBy,
        })
        .eq('id', payoutId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur approbation paiement:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Marquer une demande comme payée
   */
  async markPayoutAsPaid(
    payoutId: string,
    transactionId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase as any)
        .from('commission_payouts')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          transaction_id: transactionId,
        })
        .eq('id', payoutId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur marquage paiement:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Rejeter une demande de paiement
   */
  async rejectPayout(
    payoutId: string,
    reason: string,
    rejectedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase as any)
        .from('commission_payouts')
        .update({
          status: 'rejected',
          rejected_reason: reason,
          rejected_by: rejectedBy,
          rejected_at: new Date().toISOString(),
        })
        .eq('id', payoutId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur rejet paiement:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Obtenir l'historique des commissions
   */
  async getCommissionHistory(
    userId: string,
    limit: number = 12
  ): Promise<CommissionCalculation[]> {
    try {
      const periods = this.generatePeriods(limit);
      const commissions: CommissionCalculation[] = [];

      for (const period of periods) {
        const commission = await this.calculateCommission(userId, period);
        if (commission) {
          commissions.push(commission);
        }
      }

      return commissions.sort((a, b) => b.period.localeCompare(a.period));
    } catch (error) {
      console.error('Erreur historique commissions:', error);
      return [];
    }
  },

  /**
   * Obtenir les demandes de paiement
   */
  async getPayoutRequests(
    userId?: string,
    status?: string
  ): Promise<CommissionPayout[]> {
    try {
      let query = (supabase as any)
        .from('commission_payouts')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Erreur demandes paiement:', error);
      return [];
    }
  },

  /**
   * Obtenir le tableau de bord des commissions
   */
  async getCommissionDashboard(userId: string): Promise<any> {
    try {
      // Historique des commissions
      const commissionHistory = await this.getCommissionHistory(userId, 6);
      
      // Demandes de paiement
      const payoutRequests = await this.getPayoutRequests(userId);

      // Statistiques actuelles
      const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM
      const currentCommission = await this.calculateCommission(userId, currentPeriod);

      // Projections
      const projections = this.calculateProjections(commissionHistory);

      // Tier actuel
      const currentTier = currentCommission 
        ? this.getCommissionTier(currentCommission.totalLeads)
        : this.commissionTiers.bronze;

      // Prochain tier
      const nextTier = this.getNextTier(currentTier);

      return {
        currentPeriod: currentCommission,
        commissionHistory,
        payoutRequests,
        projections,
        currentTier,
        nextTier,
        summary: {
          totalEarned: commissionHistory.reduce((sum, c) => sum + c.totalCommission, 0),
          totalLeads: commissionHistory.reduce((sum, c) => sum + c.totalLeads, 0),
          averageCommission: commissionHistory.length > 0 
            ? commissionHistory.reduce((sum, c) => sum + c.totalCommission, 0) / commissionHistory.length 
            : 0,
          pendingPayouts: payoutRequests
            .filter(p => p.status === 'pending' || p.status === 'approved')
            .reduce((sum, p) => sum + p.amount, 0),
        },
      };
    } catch (error) {
      console.error('Erreur dashboard commissions:', error);
      return null;
    }
  },

  /**
   * Calculer les projections
   */
  calculateProjections(history: CommissionCalculation[]): any {
    if (history.length < 2) {
      return {
        monthlyTrend: 0,
        projectedMonthly: 0,
        projectedYearly: 0,
      };
    }

    // Calculer la tendance mensuelle
    const recentMonths = history.slice(3); // 3 derniers mois
    const monthlyTrend = this.calculateTrend(recentMonths.map(h => h.totalCommission));

    // Projeter le mois suivant
    const lastMonth = history[0]?.totalCommission || 0;
    const projectedMonthly = lastMonth * (1 + monthlyTrend);

    // Projeter l'année
    const projectedYearly = projectedMonthly * 12;

    return {
      monthlyTrend: Math.round(monthlyTrend * 100) / 100,
      projectedMonthly: Math.round(projectedMonthly * 100) / 100,
      projectedYearly: Math.round(projectedYearly * 100) / 100,
    };
  },

  /**
   * Calculer la tendance
   */
  calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const sumX = values.reduce((sum, _, i) => sum + i, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + i * val, 0);
    const sumXX = values.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    return slope;
  },

  /**
   * Obtenir le prochain tier
   */
  getNextTier(currentTier: CommissionTier): CommissionTier | null {
    const tiers = Object.values(this.commissionTiers);
    const currentIndex = tiers.findIndex((t: any) => t.id === currentTier.id);
    
    if (currentIndex < tiers.length - 1) {
      return tiers[currentIndex + 1] as CommissionTier;
    }
    
    return null; // Déjà au tier maximum
  },

  /**
   * Générer les périodes
   */
  generatePeriods(count: number): string[] {
    const periods: string[] = [];
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      periods.push(date.toISOString().slice(0, 7)); // YYYY-MM
    }
    
    return periods;
  },

  /**
   * Exporter les commissions en CSV
   */
  async exportCommissionsCSV(userId: string): Promise<string> {
    try {
      const history = await this.getCommissionHistory(userId, 24);
      
      const headers = [
        'Période',
        'Leads vendus',
        'Revenu total (€)',
        'Commission de base (€)',
        'Bonus de tier (€)',
        'Bonus performance (€)',
        'Commission totale (€)',
        'Tier',
        'Taux de commission',
      ];

      const rows = history.map(commission => [
        commission.period,
        commission.totalLeads,
        commission.totalRevenue.toFixed(2),
        commission.baseCommission.toFixed(2),
        commission.tierBonus.toFixed(2),
        commission.performanceBonus.toFixed(2),
        commission.totalCommission.toFixed(2),
        commission.tier.name,
        `${(commission.tier.commissionRate * 100).toFixed(1)}%`,
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    } catch (error) {
      console.error('Erreur export CSV:', error);
      return '';
    }
  },

  /**
   * Obtenir les statistiques globales des commissions
   */
  async getGlobalCommissionStats(): Promise<any> {
    try {
      const { data, error } = await (supabase as any)
        .from('commission_calculations')
        .select('*');

      if (error) throw error;

      const totalCommissions = data?.reduce((sum, record) => sum + record.total_commission, 0) || 0;
      const totalLeads = data?.reduce((sum, record) => sum + record.total_leads, 0) || 0;
      const averageCommission = data?.length > 0 ? totalCommissions / data.length : 0;

      // Répartition par tier
      const tierDistribution = Object.keys(this.commissionTiers).map(tierId => {
        const tier = this.commissionTiers[tierId];
        const count = data?.filter(record => record.tier_id === tierId).length || 0;
        return {
          tier: tier.name,
          count,
          percentage: data?.length > 0 ? (count / data.length) * 100 : 0,
        };
      });

      return {
        totalCommissions,
        totalLeads,
        averageCommission,
        tierDistribution,
        monthlyTrend: this.calculateTrend(
          data?.slice(0, 12).map(d => d.total_commission) || []
        ),
      };
    } catch (error) {
      console.error('Erreur stats globales commissions:', error);
      return null;
    }
  },
};

export default commissionService;
