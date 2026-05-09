import { supabase } from '@/integrations/supabase/client';

// Types pour les packages de crédits
export interface CreditPackage {
  id: string;
  name: string;
  credits_amount: number;
  price_euros: number;
  bonus_credits: number;
  total_credits: number; // credits_amount + bonus_credits
  is_promotional: boolean;
  promotion_label?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreditPackageInput {
  name: string;
  credits_amount: number;
  price_euros: number;
  bonus_credits?: number;
  is_promotional?: boolean;
  promotion_label?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface CreditTransaction {
  id: string;
  professional_id: string;
  type: 'purchase' | 'usage' | 'refund' | 'bonus' | 'adjustment';
  amount: number;
  balance_after: number;
  description: string;
  related_project_id?: string;
  stripe_payment_intent_id?: string;
  created_by?: string;
  created_at: string;
}

export interface ProfessionalCredits {
  professional_id: string;
  balance: number;
  total_purchased: number;
  total_used: number;
  last_transaction_at?: string;
}

/**
 * Récupère tous les packages de crédits actifs
 */
export async function getActiveCreditPackages(): Promise<CreditPackage[]> {
  try {
    const { data, error } = await supabase
      .from('credit_packages')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    return (data || []).map((pkg) => ({
      ...pkg,
      total_credits: pkg.credits_amount + (pkg.bonus_credits || 0),
    }));
  } catch (error) {
    console.error('Error fetching credit packages:', error);
    return [];
  }
}

/**
 * Récupère tous les packages (admin)
 */
export async function getAllCreditPackages(): Promise<CreditPackage[]> {
  try {
    const { data, error } = await supabase
      .from('credit_packages')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;

    return (data || []).map((pkg) => ({
      ...pkg,
      total_credits: pkg.credits_amount + (pkg.bonus_credits || 0),
    }));
  } catch (error) {
    console.error('Error fetching all credit packages:', error);
    return [];
  }
}

/**
 * Crée un nouveau package de crédits
 */
export async function createCreditPackage(
  pkg: CreditPackageInput
): Promise<{ success: boolean; package?: CreditPackage; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('credit_packages')
      .insert({
        name: pkg.name,
        credits_amount: pkg.credits_amount,
        price_euros: pkg.price_euros,
        bonus_credits: pkg.bonus_credits || 0,
        is_promotional: pkg.is_promotional || false,
        promotion_label: pkg.promotion_label,
        is_active: pkg.is_active ?? true,
        sort_order: pkg.sort_order || 0,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      package: {
        ...data,
        total_credits: data.credits_amount + data.bonus_credits,
      },
    };
  } catch (error: any) {
    console.error('Error creating credit package:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Met à jour un package de crédits
 */
export async function updateCreditPackage(
  packageId: string,
  updates: Partial<CreditPackageInput>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('credit_packages')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', packageId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error updating credit package:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Supprime un package de crédits
 */
export async function deleteCreditPackage(
  packageId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('credit_packages')
      .delete()
      .eq('id', packageId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting credit package:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Récupère le solde de crédits d'un professionnel
 */
export async function getProfessionalCredits(
  professionalId: string
): Promise<ProfessionalCredits | null> {
  try {
    // Récupérer le solde actuel
    const { data: pro, error: proError } = await supabase
      .from('professionals')
      .select('credits_balance')
      .eq('id', professionalId)
      .single();

    if (proError) throw proError;

    // Calculer les totaux depuis les transactions
    const { data: transactions, error: transError } = await supabase
      .from('credit_transactions')
      .select('type, amount, created_at')
      .eq('professional_id', professionalId);

    if (transError) throw transError;

    const totalPurchased =
      transactions
        ?.filter((t) => t.type === 'purchase' || t.type === 'bonus')
        ?.reduce((sum, t) => sum + t.amount, 0) || 0;

    const totalUsed =
      transactions
        ?.filter((t) => t.type === 'usage')
        ?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

    const lastTransaction = transactions?.[transactions.length - 1];

    return {
      professional_id: professionalId,
      balance: pro?.credits_balance || 0,
      total_purchased: totalPurchased,
      total_used: totalUsed,
      last_transaction_at: lastTransaction?.created_at,
    };
  } catch (error) {
    console.error('Error fetching professional credits:', error);
    return null;
  }
}

/**
 * Ajoute des crédits à un professionnel (achat ou bonus)
 */
export async function addCreditsToProfessional(
  professionalId: string,
  amount: number,
  type: 'purchase' | 'bonus' | 'adjustment',
  description: string,
  metadata?: {
    stripe_payment_intent_id?: string;
    package_id?: string;
    created_by?: string;
  }
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  try {
    // Récupérer le solde actuel
    const { data: pro, error: proError } = await supabase
      .from('professionals')
      .select('credits_balance')
      .eq('id', professionalId)
      .single();

    if (proError) throw proError;

    const currentBalance = pro?.credits_balance || 0;
    const newBalance = currentBalance + amount;

    // Mettre à jour le solde
    const { error: updateError } = await supabase
      .from('professionals')
      .update({ credits_balance: newBalance })
      .eq('id', professionalId);

    if (updateError) throw updateError;

    // Créer la transaction
    const { error: transError } = await supabase
      .from('credit_transactions')
      .insert({
        professional_id: professionalId,
        type,
        amount,
        balance_after: newBalance,
        description,
        stripe_payment_intent_id: metadata?.stripe_payment_intent_id,
        created_by: metadata?.created_by,
      });

    if (transError) throw transError;

    return { success: true, newBalance };
  } catch (error: any) {
    console.error('Error adding credits:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Utilise des crédits (déduit le solde)
 */
export async function useCredits(
  professionalId: string,
  amount: number,
  description: string,
  relatedProjectId?: string
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  try {
    // Récupérer le solde actuel
    const { data: pro, error: proError } = await supabase
      .from('professionals')
      .select('credits_balance')
      .eq('id', professionalId)
      .single();

    if (proError) throw proError;

    const currentBalance = pro?.credits_balance || 0;

    if (currentBalance < amount) {
      return { success: false, error: 'Solde insuffisant' };
    }

    const newBalance = currentBalance - amount;

    // Mettre à jour le solde
    const { error: updateError } = await supabase
      .from('professionals')
      .update({ credits_balance: newBalance })
      .eq('id', professionalId);

    if (updateError) throw updateError;

    // Créer la transaction
    const { error: transError } = await supabase
      .from('credit_transactions')
      .insert({
        professional_id: professionalId,
        type: 'usage',
        amount: -amount,
        balance_after: newBalance,
        description,
        related_project_id: relatedProjectId,
      });

    if (transError) throw transError;

    return { success: true, newBalance };
  } catch (error: any) {
    console.error('Error using credits:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Vérifie si un professionnel a assez de crédits
 */
export async function hasEnoughCredits(
  professionalId: string,
  requiredAmount: number
): Promise<boolean> {
  try {
    const { data: pro, error } = await supabase
      .from('professionals')
      .select('credits_balance')
      .eq('id', professionalId)
      .single();

    if (error) throw error;

    return (pro?.credits_balance || 0) >= requiredAmount;
  } catch (error) {
    console.error('Error checking credits:', error);
    return false;
  }
}

/**
 * Récupère l'historique des transactions
 */
export async function getCreditTransactions(
  professionalId: string,
  limit: number = 50
): Promise<CreditTransaction[]> {
  try {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('professional_id', professionalId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching credit transactions:', error);
    return [];
  }
}

/**
 * Calcule le prix avec éventuelle remise promo
 */
export function calculatePackagePrice(
  pkg: CreditPackage,
  discountPercent?: number
): { originalPrice: number; finalPrice: number; savings: number } {
  const originalPrice = pkg.price_euros;
  const discount = discountPercent || 0;
  const finalPrice =
    Math.round(originalPrice * (1 - discount / 100) * 100) / 100;
  const savings = Math.round((originalPrice - finalPrice) * 100) / 100;

  return { originalPrice, finalPrice, savings };
}

/**
 * Récupère les statistiques globales des crédits (admin)
 */
export async function getCreditStats(): Promise<{
  totalCreditsInCirculation: number;
  totalPurchases: number;
  totalRevenue: number;
  activeProfessionals: number;
  avgBalance: number;
}> {
  try {
    // Solde total en circulation
    const { data: pros, error: proError } = await supabase
      .from('professionals')
      .select('credits_balance');

    if (proError) throw proError;

    const totalCreditsInCirculation =
      pros?.reduce((sum, p) => sum + (p.credits_balance || 0), 0) || 0;
    const activeProfessionals =
      pros?.filter((p) => (p.credits_balance || 0) > 0).length || 0;
    const avgBalance =
      activeProfessionals > 0
        ? totalCreditsInCirculation / activeProfessionals
        : 0;

    // Stats d'achat
    const { data: transactions, error: transError } = await supabase
      .from('credit_transactions')
      .select('type, amount, description')
      .eq('type', 'purchase');

    if (transError) throw transError;

    const totalPurchases = transactions?.length || 0;

    // Revenu total (approximatif depuis les packages)
    const { data: packages } = await supabase
      .from('credit_packages')
      .select('price_euros, credits_amount');

    const avgPricePerCredit =
      packages && packages.length > 0
        ? packages.reduce(
            (sum, p) => sum + p.price_euros / p.credits_amount,
            0
          ) / packages.length
        : 1;

    const totalRevenue =
      Math.round(totalPurchases * avgPricePerCredit * 100) / 100;

    return {
      totalCreditsInCirculation,
      totalPurchases,
      totalRevenue,
      activeProfessionals,
      avgBalance: Math.round(avgBalance * 10) / 10,
    };
  } catch (error) {
    console.error('Error fetching credit stats:', error);
    return {
      totalCreditsInCirculation: 0,
      totalPurchases: 0,
      totalRevenue: 0,
      activeProfessionals: 0,
      avgBalance: 0,
    };
  }
}

export default {
  getActiveCreditPackages,
  getAllCreditPackages,
  createCreditPackage,
  updateCreditPackage,
  deleteCreditPackage,
  getProfessionalCredits,
  addCreditsToProfessional,
  useCredits,
  hasEnoughCredits,
  getCreditTransactions,
  calculatePackagePrice,
  getCreditStats,
};
