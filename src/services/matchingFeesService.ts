import { supabase } from '@/integrations/supabase/client';

interface MatchingFee {
  id: string;
  min_amount: number;
  max_amount: number;
  fee_amount: number;
  is_percentage: boolean;
  percentage_value?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CalculateFeeResult {
  success: boolean;
  feeAmount?: number;
  feeDetails?: {
    baseAmount: number;
    feeAmount: number;
    totalAmount: number;
    tier: string;
  };
  error?: string;
}

// Cache pour les paliers actifs
let feeTiersCache: MatchingFee[] | null = null;
let feeCacheTimestamp: number = 0;
const FEE_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export const matchingFeesService = {
  /**
   * Récupère tous les paliers de frais actifs
   */
  async getActiveTiers(): Promise<MatchingFee[]> {
    const now = Date.now();
    
    // Utiliser le cache si valide
    if (feeTiersCache && (now - feeCacheTimestamp) < FEE_CACHE_TTL) {
      console.log('⚡ Fee tiers from cache');
      return feeTiersCache;
    }

    try {
      const { data, error } = await supabase
        .from('matching_fees')
        .select('*')
        .eq('is_active', true)
        .order('min_amount', { ascending: true });

      if (error) {
        console.error('❌ Erreur récupération frais:', error);
        return [];
      }

      feeTiersCache = data || [];
      feeCacheTimestamp = now;

      return feeTiersCache;
    } catch (error) {
      console.error('❌ Erreur service getActiveTiers:', error);
      return [];
    }
  },

  /**
   * Calcule les frais pour un montant donné
   */
  async calculateFee(projectAmount: number): Promise<CalculateFeeResult> {
    try {
      // Utiliser la fonction RPC si disponible
      const { data, error } = await supabase
        .rpc('calculate_matching_fee', {
          p_project_amount: projectAmount
        });

      if (error) {
        console.error('❌ Erreur calcul frais RPC:', error);
        // Fallback sur le calcul local
        return this.calculateFeeLocal(projectAmount);
      }

      return {
        success: true,
        feeAmount: data,
        feeDetails: {
          baseAmount: projectAmount,
          feeAmount: data,
          totalAmount: projectAmount + data,
          tier: 'calculated'
        }
      };
    } catch (error) {
      console.error('❌ Erreur service calculateFee:', error);
      return this.calculateFeeLocal(projectAmount);
    }
  },

  /**
   * Calcul local des frais (fallback)
   */
  async calculateFeeLocal(projectAmount: number): Promise<CalculateFeeResult> {
    try {
      const tiers = await this.getActiveTiers();
      
      if (tiers.length === 0) {
        // Valeurs par défaut si aucun palier configuré
        const defaultFee = projectAmount <= 50000 ? 1500 : // 15€
                           projectAmount <= 100000 ? 2900 : // 29€
                           projectAmount <= 200000 ? 4900 : // 49€
                           projectAmount <= 500000 ? 9900 : // 99€
                           projectAmount <= 1000000 ? 14900 : // 149€
                           24900; // 249€
        
        return {
          success: true,
          feeAmount: defaultFee,
          feeDetails: {
            baseAmount: projectAmount,
            feeAmount: defaultFee,
            totalAmount: projectAmount + defaultFee,
            tier: 'default'
          }
        };
      }

      // Trouver le palier applicable
      const tier = tiers.find(t => 
        projectAmount >= t.min_amount && 
        (t.max_amount === null || projectAmount <= t.max_amount)
      );

      if (!tier) {
        return {
          success: false,
          error: 'Aucun palier de frais trouvé pour ce montant'
        };
      }

      let feeAmount: number;
      if (tier.is_percentage && tier.percentage_value) {
        feeAmount = Math.round(projectAmount * (tier.percentage_value / 100));
      } else {
        feeAmount = tier.fee_amount;
      }

      return {
        success: true,
        feeAmount,
        feeDetails: {
          baseAmount: projectAmount,
          feeAmount,
          totalAmount: projectAmount + feeAmount,
          tier: `${tier.min_amount}-${tier.max_amount || '∞'}`
        }
      };
    } catch (error) {
      console.error('❌ Erreur service calculateFeeLocal:', error);
      return {
        success: false,
        error: 'Erreur lors du calcul des frais'
      };
    }
  },

  /**
   * CRUD - Crée un nouveau palier
   */
  async createTier(
    tierData: Omit<MatchingFee, 'id' | 'created_at' | 'updated_at'>,
    createdBy: string
  ): Promise<{ success: boolean; tierId?: string; error?: string }> {
    try {
      // Validation
      if (tierData.min_amount >= (tierData.max_amount || Infinity)) {
        return { success: false, error: 'Le montant min doit être inférieur au montant max' };
      }

      if (tierData.is_percentage && (!tierData.percentage_value || tierData.percentage_value <= 0)) {
        return { success: false, error: 'Le pourcentage doit être positif' };
      }

      if (!tierData.is_percentage && tierData.fee_amount <= 0) {
        return { success: false, error: 'Le montant des frais doit être positif' };
      }

      const { data, error } = await supabase
        .from('matching_fees')
        .insert({
          ...tierData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur création palier:', error);
        return { success: false, error: 'Erreur lors de la création du palier' };
      }

      // Invalider le cache
      this.invalidateCache();

      await this.logAdminAction('create_tier', data.id, tierData, createdBy);

      return { success: true, tierId: data.id };
    } catch (error) {
      console.error('❌ Erreur service createTier:', error);
      return { success: false, error: 'Erreur serveur' };
    }
  },

  /**
   * CRUD - Met à jour un palier
   */
  async updateTier(
    tierId: string,
    updates: Partial<MatchingFee>,
    updatedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validation
      if (updates.min_amount !== undefined && updates.max_amount !== undefined) {
        if (updates.min_amount >= updates.max_amount) {
          return { success: false, error: 'Le montant min doit être inférieur au montant max' };
        }
      }

      const { error } = await supabase
        .from('matching_fees')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', tierId);

      if (error) {
        console.error('❌ Erreur mise à jour palier:', error);
        return { success: false, error: 'Erreur lors de la mise à jour' };
      }

      this.invalidateCache();

      await this.logAdminAction('update_tier', tierId, updates, updatedBy);

      return { success: true };
    } catch (error) {
      console.error('❌ Erreur service updateTier:', error);
      return { success: false, error: 'Erreur serveur' };
    }
  },

  /**
   * CRUD - Supprime (désactive) un palier
   */
  async deleteTier(
    tierId: string,
    deletedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Soft delete - désactiver plutôt que supprimer
      const { error } = await supabase
        .from('matching_fees')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', tierId);

      if (error) {
        console.error('❌ Erreur suppression palier:', error);
        return { success: false, error: 'Erreur lors de la suppression' };
      }

      this.invalidateCache();

      await this.logAdminAction('delete_tier', tierId, { is_active: false }, deletedBy);

      return { success: true };
    } catch (error) {
      console.error('❌ Erreur service deleteTier:', error);
      return { success: false, error: 'Erreur serveur' };
    }
  },

  /**
   * Récupère les statistiques d'utilisation des frais
   */
  async getFeeStats(): Promise<{
    totalTiers: number;
    activeTiers: number;
    avgFeeAmount: number;
    mostUsedTier?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('matching_fees')
        .select('*');

      if (error) {
        console.error('❌ Erreur récupération stats:', error);
        return { totalTiers: 0, activeTiers: 0, avgFeeAmount: 0 };
      }

      const totalTiers = data?.length || 0;
      const activeTiers = data?.filter(t => t.is_active).length || 0;
      const avgFeeAmount = data?.length 
        ? data.reduce((sum, t) => sum + (t.fee_amount || 0), 0) / data.length 
        : 0;

      return {
        totalTiers,
        activeTiers,
        avgFeeAmount: Math.round(avgFeeAmount)
      };
    } catch (error) {
      console.error('❌ Erreur service getFeeStats:', error);
      return { totalTiers: 0, activeTiers: 0, avgFeeAmount: 0 };
    }
  },

  /**
   * Prévisualise les frais pour différents montants
   */
  async previewFees(amounts: number[]): Promise<Array<{
    amount: number;
    fee: number;
    total: number;
  }>> {
    const results = [];
    for (const amount of amounts) {
      const result = await this.calculateFee(amount);
      if (result.success) {
        results.push({
          amount,
          fee: result.feeAmount || 0,
          total: amount + (result.feeAmount || 0)
        });
      }
    }
    return results;
  },

  /**
   * Invalide le cache
   */
  invalidateCache(): void {
    feeTiersCache = null;
    feeCacheTimestamp = 0;
    console.log('🗑️ Cache matching fees invalidé');
  },

  /**
   * Logger les actions admin
   */
  private async logAdminAction(
    action: string,
    tierId: string,
    data: any,
    userId: string
  ): Promise<void> {
    console.log('📝 ADMIN FEE ACTION:', {
      action,
      tierId,
      data,
      userId,
      timestamp: new Date().toISOString()
    });
  }
};

export type { MatchingFee, CalculateFeeResult };
