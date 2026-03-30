import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Bid = Database["public"]["Tables"]["bids"]["Row"];
type BidInsert = Database["public"]["Tables"]["bids"]["Insert"];

export const bidService = {
  /**
   * Create a bid for a project
   */
  async createBid(bidData: Omit<BidInsert, "professional_id">): Promise<{ data: Bid | null; error: Error | null }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { data: null, error: new Error("Non authentifié") };
      }

      // Get professional ID
      const { data: professional, error: profError } = await supabase
        .from("professionals")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profError || !professional) {
        return { data: null, error: new Error("Profil professionnel introuvable") };
      }

      // Create bid directly (no credit check needed)
      const { data, error } = await supabase
        .from("bids")
        .insert({
          ...bidData,
          professional_id: professional.id
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating bid:", error);
        return { data: null, error: new Error(error.message) };
      }

      return { data, error: null };
    } catch (err) {
      console.error("Error in createBid:", err);
      return { data: null, error: err as Error };
    }
  },

  /**
   * Get professional's bids
   */
  async getMyBids(): Promise<{ data: (Bid & { project?: any })[] | null; error: Error | null }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { data: null, error: new Error("Non authentifié") };
      }

      const { data: professional, error: profError } = await supabase
        .from("professionals")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profError || !professional) {
        return { data: null, error: new Error("Profil professionnel introuvable") };
      }

      const { data, error } = await supabase
        .from("bids")
        .select(`
          *,
          project:projects(*)
        `)
        .eq("professional_id", professional.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching bids:", error);
        return { data: null, error: new Error(error.message) };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.error("Error in getMyBids:", err);
      return { data: null, error: err as Error };
    }
  },

  /**
   * Update bid status
   */
  async updateBidStatus(bidId: string, status: "accepted" | "rejected"): Promise<{ data: Bid | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from("bids")
        .update({ status })
        .eq("id", bidId)
        .select()
        .single();

      if (error) {
        console.error("Error updating bid:", error);
        return { data: null, error: new Error(error.message) };
      }

      return { data, error: null };
    } catch (err) {
      console.error("Error in updateBidStatus:", err);
      return { data: null, error: err as Error };
    }
  }
};