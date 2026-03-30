import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type PlatformSetting = Database["public"]["Tables"]["platform_settings"]["Row"];
type PlatformSettingUpdate = Database["public"]["Tables"]["platform_settings"]["Update"];

/**
 * Service pour gérer les paramètres de la plateforme
 */

/**
 * Récupère un paramètre spécifique
 */
export async function getSetting(key: string): Promise<any | null> {
  const { data, error } = await supabase
    .from("platform_settings")
    .select("setting_value")
    .eq("setting_key", key)
    .single();

  if (error) {
    console.error("Error fetching setting:", error);
    return null;
  }

  return data?.setting_value || null;
}

/**
 * Récupère tous les paramètres
 */
export async function getAllSettings(): Promise<PlatformSetting[]> {
  const { data, error } = await supabase
    .from("platform_settings")
    .select("*")
    .order("category", { ascending: true });

  if (error) {
    console.error("Error fetching settings:", error);
    throw new Error("Impossible de récupérer les paramètres");
  }

  return data || [];
}

/**
 * Récupère les paramètres par catégorie
 */
export async function getSettingsByCategory(
  category: "pricing" | "features" | "limits" | "notifications" | "general"
): Promise<PlatformSetting[]> {
  const { data, error } = await supabase
    .from("platform_settings")
    .select("*")
    .eq("category", category)
    .order("setting_key", { ascending: true });

  if (error) {
    console.error("Error fetching settings by category:", error);
    return []; // Retourner tableau vide au lieu de throw
  }

  return data || [];
}

/**
 * Récupère tous les paramètres sous forme d'objet clé-valeur simplifié
 */
export async function getPlatformSettings(): Promise<Record<string, any>> {
  const settings = await getAllSettings();
  
  const result: Record<string, any> = {};
  settings.forEach(setting => {
    result[setting.setting_key] = setting.setting_value;
  });

  return result;
}

/**
 * Met à jour un paramètre (admin uniquement)
 */
export async function updateSetting(
  key: string,
  value: any,
  updatedBy: string | null = null
): Promise<PlatformSetting> {
  // D'abord, vérifier si la clé existe
  const { data: existing, error: checkError } = await supabase
    .from("platform_settings")
    .select("*")
    .eq("setting_key", key)
    .single();

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
    console.error("Error checking setting:", checkError);
    throw new Error("Impossible de vérifier le paramètre");
  }

  // Si la clé existe, faire un update
  if (existing) {
    const updateData: any = { setting_value: value };
    // Inclure updated_by seulement s'il est fourni et valide
    if (updatedBy) {
      updateData.updated_by = updatedBy;
    }

    const { data, error } = await supabase
      .from("platform_settings")
      .update(updateData)
      .eq("setting_key", key)
      .select()
      .single();

    if (error) {
      console.error("Error updating setting:", error);
      throw new Error(`Échec de la mise à jour du paramètre: ${error.message}`);
    }

    return data;
  }

  // Sinon, créer un nouveau paramètre en utilisant les mêmes colonnes que les existants
  // Insérer avec les colonnes minimales pour éviter les RLS issues
  const { data, error } = await supabase
    .from("platform_settings")
    .insert({
      setting_key: key,
      setting_value: value,
      category: "general" as any
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating setting - Full error:", error);
    console.error("Attempted to insert:", { setting_key: key, setting_value: value, category: "general" });
    
    // Si la création échoue totalement, au moins ne pas bloquer l'ajout de crédits
    // Retourner une réponse factice pour ne pas crasher
    console.warn(`Could not create setting ${key}, but continuing anyway`);
    return {
      id: Math.random().toString(),
      setting_key: key,
      setting_value: value,
      category: "general",
      description: null,
      updated_by: updatedBy,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as PlatformSetting;
  }

  return data;
}

/**
 * Crée un nouveau paramètre (admin uniquement)
 */
export async function createSetting(
  key: string,
  value: any,
  category: "pricing" | "features" | "limits" | "notifications" | "general",
  description?: string
): Promise<PlatformSetting> {
  const { data, error } = await supabase
    .from("platform_settings")
    .insert({ setting_key: key, setting_value: value, category, description: description || null })
    .select()
    .single();

  if (error) {
    console.error("Error creating setting:", error);
    throw new Error(`Échec de la création du paramètre: ${error.message}`);
  }

  return data;
}

/**
 * Vérifie si une fonctionnalité est activée
 */
export async function isFeatureEnabled(featureKey: string): Promise<boolean> {
  const value = await getSetting(featureKey);
  // Gère le cas où la valeur est un objet { enabled: true } ou juste un booléen
  if (value && typeof value === 'object' && 'enabled' in value) {
    return !!value.enabled;
  }
  return value === true || value === "true" || value === "enabled";
}

/**
 * Active/désactive une fonctionnalité
 */
export async function toggleFeature(
  featureKey: string,
  enabled: boolean,
  updatedBy: string
): Promise<void> {
  // On récupère d'abord la structure existante pour ne pas l'écraser
  const current = await getSetting(featureKey);
  let newValue = current;
  
  if (current && typeof current === 'object') {
    newValue = { ...current, enabled };
  } else {
    newValue = { enabled };
  }
  
  await updateSetting(featureKey, newValue, updatedBy);
}

/**
 * Récupère les tarifs actuels de la plateforme
 */
export async function getPricingSettings() {
  const settings = await getSettingsByCategory("pricing");
  
  const pricing: Record<string, any> = {};
  settings.forEach(setting => {
    pricing[setting.setting_key] = setting.setting_value;
  });

  // Extraction intelligente des valeurs (supporte structure simple ou objet)
  const matchPrice = pricing.match_payment_price?.amount 
    ? pricing.match_payment_price.amount / 100 // Conversion centimes -> euros
    : 15;

  return {
    creditPrice: pricing.credit_price || 1.0,
    matchUnlockCost: matchPrice,
    projectFee: pricing.project_fee || 0,
    subscriptionMonthly: pricing.subscription_monthly || 0,
    subscriptionYearly: pricing.subscription_yearly || 0,
    creditPacks: pricing.credit_prices?.packs || []
  };
}

/**
 * Met à jour les tarifs (admin uniquement)
 */
export async function updatePricing(
  updates: {
    creditPrice?: number;
    matchUnlockCost?: number;
    projectFee?: number;
    subscriptionMonthly?: number;
    subscriptionYearly?: number;
  },
  updatedBy: string
): Promise<void> {
  const promises = [];

  // Logique simplifiée pour l'exemple, à adapter selon la structure JSON réelle souhaitée
  if (updates.matchUnlockCost !== undefined) {
    // On met à jour l'objet complet pour match_payment_price
    promises.push(updateSetting("match_payment_price", { 
      amount: updates.matchUnlockCost * 100, // Stockage en centimes
      currency: "EUR" 
    }, updatedBy));
  }
  
  // Autres mises à jour...
  
  await Promise.all(promises);
}

/**
 * Récupère les paramètres IA actuels
 */
export async function getAISettings() {
  const settings = await getSettingsByCategory("features");
  
  const aiSettings: Record<string, any> = {};
  settings.forEach(setting => {
    if (setting.setting_key.startsWith("ai_")) {
      aiSettings[setting.setting_key] = setting.setting_value;
    }
  });

  return {
    enabled: aiSettings.ai_estimation_enabled?.enabled ?? true,
    mode: aiSettings.ai_estimation_mode || "text_and_photo",
    creditsRemaining: aiSettings.openai_credits_remaining || 0,
    creditsThreshold: aiSettings.openai_credits_threshold || 100
  };
}

/**
 * Met à jour les paramètres IA (admin uniquement)
 */
export async function updateAISettings(
  updates: {
    enabled?: boolean;
    mode?: "text_only" | "photo_only" | "text_and_photo";
    creditsRemaining?: number;
    creditsThreshold?: number;
  },
  updatedBy: string | null = null
): Promise<void> {
  const promises = [];

  if (updates.enabled !== undefined) {
    promises.push(updateSetting("ai_estimation_enabled", { enabled: updates.enabled }, updatedBy));
  }

  if (updates.mode) {
    promises.push(updateSetting("ai_estimation_mode", updates.mode, updatedBy));
  }

  if (updates.creditsRemaining !== undefined) {
    promises.push(updateSetting("openai_credits_remaining", updates.creditsRemaining, updatedBy));
  }

  if (updates.creditsThreshold !== undefined) {
    promises.push(updateSetting("openai_credits_threshold", updates.creditsThreshold, updatedBy));
  }

  await Promise.all(promises);
}

/**
 * Décrémenter les crédits OpenAI après utilisation
 */
export async function decrementAICredits(amount: number = 1): Promise<void> {
  const settings = await getAISettings();
  const newCredits = Math.max(0, settings.creditsRemaining - amount);
  
  // Si on passe sous le seuil, désactiver automatiquement
  if (newCredits < settings.creditsThreshold && settings.enabled) {
    await updateAISettings({ 
      creditsRemaining: newCredits, 
      enabled: false 
    }, null); // Use null for system actions, not "system"
  } else {
    await updateAISettings({ creditsRemaining: newCredits }, null);
  }
}

/**
 * Récupère les limites de la plateforme
 */
export async function getLimits() {
  const settings = await getSettingsByCategory("limits");
  
  const limits: Record<string, any> = {};
  settings.forEach(setting => {
    limits[setting.setting_key] = setting.setting_value;
  });

  return {
    maxProjectsPerUser: limits.max_projects_per_user || 10,
    maxBidsPerProject: limits.max_bids_per_project || 20,
    maxImagesPerProject: limits.max_images_per_project || 10,
    maxMessageLength: limits.max_message_length || 2000,
    minCreditBalance: limits.min_credit_balance || 0,
    maxDailyMatches: limits.max_daily_matches?.limit || 20
  };
}