import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type PromoCode = Database["public"]["Tables"]["promo_codes"]["Row"];
type PromoCodeInsert = Database["public"]["Tables"]["promo_codes"]["Insert"];
type PromoCodeUpdate = Database["public"]["Tables"]["promo_codes"]["Update"];

/**
 * Service pour gérer les codes promotionnels
 */

/**
 * Crée un nouveau code promo (admin uniquement)
 */
export async function createPromoCode(
  promoData: Omit<PromoCodeInsert, "id" | "created_at" | "updated_at">
): Promise<PromoCode> {
  const { data, error } = await supabase
    .from("promo_codes")
    .insert({
      ...promoData,
      code: promoData.code.toUpperCase(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating promo code:", error);
    throw new Error(`Échec de la création du code promo: ${error.message}`);
  }

  return data;
}

/**
 * Liste tous les codes promo
 */
export async function listPromoCodes(activeOnly: boolean = false): Promise<PromoCode[]> {
  let query = supabase
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error listing promo codes:", error);
    throw new Error(`Impossible de récupérer les codes promo: ${error.message}`);
  }

  return data || [];
}

/**
 * Valide et applique un code promo
 */
export async function validateAndApplyPromoCode(
  code: string,
  professionalId: string
): Promise<{
  valid: boolean;
  discount: number;
  discountType: "percentage" | "fixed" | null;
  message: string;
}> {
  const { data: promo, error } = await supabase
    .from("promo_codes")
    .select("*")
    .eq("code", code.toUpperCase())
    .eq("is_active", true)
    .single();

  if (error || !promo) {
    return {
      valid: false,
      discount: 0,
      discountType: null,
      message: "Code promo invalide ou expiré",
    };
  }

  const now = new Date();
  const validFrom = promo.valid_from ? new Date(promo.valid_from) : null;
  const validUntil = promo.valid_until ? new Date(promo.valid_until) : null;

  if (validFrom && now < validFrom) {
    return {
      valid: false,
      discount: 0,
      discountType: null,
      message: "Ce code promo n'est pas encore actif",
    };
  }

  if (validUntil && now > validUntil) {
    return {
      valid: false,
      discount: 0,
      discountType: null,
      message: "Ce code promo a expiré",
    };
  }

  if (promo.max_uses && promo.uses_count >= promo.max_uses) {
    return {
      valid: false,
      discount: 0,
      discountType: null,
      message: "Ce code promo a atteint sa limite d'utilisation",
    };
  }

  // Incrémenter le compteur d'utilisation
  await supabase
    .from("promo_codes")
    .update({ uses_count: (promo.uses_count || 0) + 1 })
    .eq("id", promo.id);

  const discountMessage =
    promo.discount_type === "percentage"
      ? `${promo.discount_value}% de bonus`
      : `+${promo.discount_value} crédits bonus`;

  return {
    valid: true,
    discount: promo.discount_value || 0,
    discountType: promo.discount_type as "percentage" | "fixed" | null, // Cast pour éviter erreur TS
    message: `Code appliqué ! ${discountMessage}`,
  };
}

/**
 * Met à jour un code promo (admin uniquement)
 */
export async function updatePromoCode(
  id: string,
  updates: PromoCodeUpdate
): Promise<PromoCode> {
  const { data, error } = await supabase
    .from("promo_codes")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating promo code:", error);
    throw new Error("Échec de la mise à jour du code promo");
  }

  return data;
}

/**
 * Active/désactive un code promo
 */
export async function togglePromoCode(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from("promo_codes")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) {
    console.error("Error toggling promo code:", error);
    throw new Error("Échec du changement de statut");
  }
}

/**
 * Supprime un code promo
 */
export async function deletePromoCode(id: string): Promise<void> {
  const { error } = await supabase
    .from("promo_codes")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting promo code:", error);
    throw new Error("Échec de la suppression du code promo");
  }
}

/**
 * Statistiques des codes promo
 */
export async function getPromoStats() {
  const promoCodes = await listPromoCodes();
  
  const totalCodes = promoCodes.length;
  const activeCodes = promoCodes.filter(p => p.is_active).length;
  const totalUsage = promoCodes.reduce((sum, p) => sum + (p.uses_count || 0), 0);
  const expiredCodes = promoCodes.filter(p => {
    if (!p.valid_until) return false;
    return new Date(p.valid_until) < new Date();
  }).length;

  return {
    totalCodes,
    activeCodes,
    totalUsage,
    expiredCodes,
  };
}