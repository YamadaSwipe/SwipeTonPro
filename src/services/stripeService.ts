import { supabase } from "@/integrations/supabase/client";


// Packs de crédits supprimés : Option désactivée

/**
 * Create a Stripe customer for the user if not exists
 */
export async function getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
  try {
    // Check if customer already exists
    const { data: existingCustomer } = await supabase
      .from("stripe_customers")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single();

    if (existingCustomer) {
      return existingCustomer.stripe_customer_id;
    }

    // Create new Stripe customer via API route
    const response = await fetch("/api/stripe/create-customer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, email })
    });

    if (!response.ok) {
      throw new Error("Failed to create Stripe customer");
    }

    const { customerId } = await response.json();
    return customerId;
  } catch (error) {
    console.error("Error getting/creating Stripe customer:", error);
    throw error;
  }
}


// Fonction supprimée : Option de crédit désactivée

/**
 * Get payment intent status
 */
export async function getPaymentIntentStatus(paymentIntentId: string) {
  try {
    const { data, error } = await supabase
      .from("stripe_payment_intents")
      .select("*")
      .eq("stripe_payment_intent_id", paymentIntentId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error getting payment intent:", error);
    throw error;
  }
}

/**
 * Get user's payment history
 */
export async function getPaymentHistory(userId: string) {
  try {
    const { data, error } = await supabase
      .from("stripe_payment_intents")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return [];
  }
}


// Fonction supprimée : Option de crédit désactivée

/**
 * Increment promo code usage count
 */
export async function incrementPromoUsage(promoCode: string): Promise<void> {
  await supabase.rpc("increment_promo_usage", { promo_code: promoCode.toUpperCase() });
}