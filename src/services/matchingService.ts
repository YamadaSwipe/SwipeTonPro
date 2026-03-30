import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ProjectInterest = Database["public"]["Tables"]["project_interests"]["Row"];

// Simplified type for the join result to avoid deep recursion issues
type ProjectInterestWithPro = ProjectInterest & {
  professional: any; // Using any to bypass deep type checks for now
};

export const matchingService = {
  /**
   * Professional signals interest in a project
   */
  async signalInterest(projectId: string): Promise<{ data: any; error: Error | null }> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return { data: null, error: new Error("Utilisateur non connecté") };
      }

      // Get professional ID
      const { data: professional } = await (supabase as any)
        .from("professionals")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!professional) {
        return { data: null, error: new Error("Profil professionnel non trouvé") };
      }

      // Check if already interested
      const { data: existingInterest, error: checkError } = await supabase
        .from("project_interests")
        .select("*")
        .eq("project_id", projectId)
        .eq("professional_id", professional.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        return { data: null, error: checkError };
      }

      if (existingInterest) {
        return { data: null, error: new Error("Vous avez déjà signalé votre intérêt pour ce projet") };
      }

      const { data, error } = await supabase
        .from("project_interests")
        .insert({
          project_id: projectId,
          professional_id: professional.id,
          status: "interested"
        })
        .select()
        .single();

      if (error) throw error;

      // Get project details for notification
      const { data: project } = await supabase
        .from("projects")
        .select("title, client_id")
        .eq("id", projectId)
        .single();

      // Send notification to client
      if (project?.client_id) {
        try {
          const notificationData = {
            user_id: project.client_id,
            title: "Nouveau professionnel intéressé",
            message: `Un professionnel a montré de l'intérêt pour votre projet "${project.title}"`,
            type: "new_interest",
            data: {
              project_id: projectId,
              professional_id: professional.id
            }
          };

          console.log("Inserting notification:", notificationData);
          
          const { error: notifError } = await supabase
            .from("notifications")
            .insert(notificationData)
            .select();

          if (notifError) {
            console.error("Notification error details:", notifError);
            throw notifError;
          }
          
          console.log("Notification inserted successfully");
        } catch (notifError) {
          console.warn("Erreur notification:", notifError);
          // Ne pas bloquer l'intérêt si la notification échoue
        }
      }

      return { data, error: null };
    } catch (err) {
      console.error("Error in signalInterest:", err);
      return { data: null, error: err as Error };
    }
  },

  /**
   * Client pauses a professional interest
   */
  async pauseProfessional(interestId: string): Promise<{ data: ProjectInterest | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from("project_interests")
        .update({
          status: "paused",
          paused_at: new Date().toISOString()
        })
        .eq("id", interestId)
        .select()
        .single();

      return { data, error };
    } catch (err) {
      console.error("Error in pauseProfessional:", err);
      return { data: null, error: err as Error };
    }
  },

  /**
   * Client rejects a professional interest
   */
  async rejectProfessional(interestId: string): Promise<{ data: ProjectInterest | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from("project_interests")
        .update({
          status: "rejected",
          rejected_at: new Date().toISOString()
        })
        .eq("id", interestId)
        .select()
        .single();

      return { data, error };
    } catch (err) {
      console.error("Error in rejectProfessional:", err);
      return { data: null, error: err as Error };
    }
  },

  /**
   * Client validates a professional (after successful payment)
   */
  async validateProfessional(interestId: string): Promise<{ data: ProjectInterest | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from("project_interests")
        .update({
          status: "validated",
          validated_at: new Date().toISOString()
        })
        .eq("id", interestId)
        .select()
        .single();

      return { data, error };
    } catch (err) {
      console.error("Error in validateProfessional:", err);
      return { data: null, error: err as Error };
    }
  },

  /**
   * Client accepts a professional (triggers payment pending status)
   */
  async acceptProfessional(interestId: string): Promise<{ data: ProjectInterest | null; error: Error | null }> {
    try {
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + 24);

      // 1. Mettre à jour le statut de l'intérêt
      const { data, error } = await supabase
        .from("project_interests")
        .update({
          status: "payment_pending",
          client_interested: true,
          payment_deadline: deadline.toISOString()
        })
        .eq("id", interestId)
        .select("*, project:projects(id, title, client_id)")
        .single();

      if (error || !data) return { data: null, error: error || new Error("Intérêt introuvable") };

      // 2. Passer la conversation en phase "active" (si elle existe)
      await (supabase as any)
        .from("conversations")
        .update({ phase: "active", matched_at: new Date().toISOString() })
        .eq("project_id", (data as any).project_id)
        .eq("professional_id", data.professional_id);

      // 3. Notifier le pro qu'il a un match
      const { data: pro } = await supabase
        .from("professionals")
        .select("user_id")
        .eq("id", data.professional_id)
        .single();

      if (pro) {
        await supabase.from("notifications").insert({
          user_id: pro.user_id,
          title: "🎉 Vous avez un match !",
          message: `Un particulier a accepté votre candidature pour le projet "${(data as any).project?.title}". Payez les frais de mise en relation pour accéder à ses coordonnées.`,
          type: "match_confirmed",
          is_read: false,
          data: {
            interest_id: interestId,
            project_id: (data as any).project_id,
          },
        });
      }

      return { data, error: null };
    } catch (err) {
      console.error("Error in acceptProfessional:", err);
      return { data: null, error: err as Error };
    }
  },

  /**
   * Validate payment (called after successful payment)
   */
  async validatePayment(interestId: string): Promise<{ data: ProjectInterest | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from("project_interests")
        .update({
          status: "paid",
          payment_deadline: null // Clear deadline as payment is done
        })
        .eq("id", interestId)
        .select()
        .single();

      return { data, error };
    } catch (err) {
      console.error("Error in validatePayment:", err);
      return { data: null, error: err as Error };
    }
  },

  /**
   * Get interests for a project (Client view)
   */
  async getProjectInterests(projectId: string): Promise<{ 
    data: ProjectInterestWithPro[] | null; 
    error: Error | null 
  }> {
    try {
      // Using any for query builder to bypass deep type inference issues with complex joins
      const query = supabase
        .from("project_interests")
        .select(`
          *,
          professional:professionals!project_interests_professional_id_fkey(
            company_name,
            average_rating,
            profile:profiles!professionals_user_id_fkey(full_name)
          )
        `)
        .eq("project_id", projectId);

      const { data, error } = await (query as any);

      return { data: data as any, error };
    } catch (err) {
      console.error("Error in getProjectInterests:", err);
      return { data: null, error: err as Error };
    }
  },

  /**
   * Trouve les professionnels qui correspondent le mieux à un projet
   * Utilise l'algorithme de matching côté base de données (RPC)
   */
  async getMatchingProfessionals(projectId: string, limit: number = 3): Promise<{ data: any[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.rpc('get_matching_professionals', {
        p_project_id: projectId,
        p_limit: limit
      });

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error("Error in getMatchingProfessionals:", err);
      return { data: null, error: err as Error };
    }
  },

  /**
   * Trouve les projets qui correspondent le mieux à un professionnel
   * Utilise l'algorithme de matching côté base de données (RPC)
   */
  async getMatchingProjects(professionalId: string, limit: number = 10, offset: number = 0): Promise<{ data: any[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.rpc('get_matching_projects', {
        p_professional_id: professionalId,
        p_limit: limit,
        p_offset: offset
      });

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error("Error in getMatchingProjects:", err);
      return { data: null, error: err as Error };
    }
  }
};