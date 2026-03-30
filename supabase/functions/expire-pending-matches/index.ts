import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Find all payment_pending matches where deadline has passed
    const { data: expiredMatches, error: fetchError } = await supabaseClient
      .from("project_interests")
      .select("id, professional_id, project_id")
      .eq("status", "payment_pending")
      .lt("payment_deadline", new Date().toISOString());

    if (fetchError) {
      console.error("Error fetching expired matches:", fetchError);
      throw fetchError;
    }

    if (!expiredMatches || expiredMatches.length === 0) {
      return new Response(
        JSON.stringify({ message: "No expired matches found", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Update status to rejected for all expired matches
    const { error: updateError } = await supabaseClient
      .from("project_interests")
      .update({ 
        status: "rejected",
        payment_deadline: null 
      })
      .in("id", expiredMatches.map(m => m.id));

    if (updateError) {
      console.error("Error updating expired matches:", updateError);
      throw updateError;
    }

    // Create notifications for professionals
    const notifications = expiredMatches.map(match => ({
      user_id: match.professional_id,
      type: "match_expired",
      title: "Match expiré",
      message: "Le délai de paiement pour un match a expiré. Le client peut choisir un autre professionnel.",
      data: { 
        project_id: match.project_id,
        interest_id: match.id 
      }
    }));

    await supabaseClient.from("notifications").insert(notifications);

    console.log(`Expired ${expiredMatches.length} matches`);

    return new Response(
      JSON.stringify({ 
        message: "Expired matches processed successfully", 
        count: expiredMatches.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Error in expire-pending-matches:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});