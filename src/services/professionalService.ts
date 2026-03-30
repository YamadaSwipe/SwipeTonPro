import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Professional = Database["public"]["Tables"]["professionals"]["Row"];
type ProfessionalInsert = Database["public"]["Tables"]["professionals"]["Insert"];
type ProfessionalUpdate = Database["public"]["Tables"]["professionals"]["Update"];

// Type étendu pour inclure certifications
type ProfessionalWithCertifications = Professional & {
  certifications?: any;
};

export const professionalService = {
  /**
   * Get current professional profile
   */
  async getCurrentProfessional(): Promise<{ data: any | null; error: Error | null }> {
    try {
      // DÉSACTIVÉ TEMPORAIREMENT - BOUCLE INFINIE
      console.log('Professional service désactivé temporairement pour éviter la boucle infinie');
      return { data: null, error: new Error("Service désactivé temporairement") };
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { data: null, error: new Error("Non authentifié") };
      }

      const { data, error } = await supabase
        .from("professionals")
        .select(`
          id,
          company_name,
          experience_years,
          rating,
          user_id,
          created_at,
          updated_at
        `)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error || !data) {
        console.log("Professional profile not found, redirecting to inscription");
        return { data: null, error: error || new Error("Professional profile not found") };
      }

      // Flatten the response for easier usage
      const flattenedData = {
        ...data,
        phone: data.user?.phone,
        city: data.user?.city,
        postal_code: data.user?.postal_code,
        email: data.user?.email,
        full_name: data.user?.full_name,
        is_verified: data.status === 'verified'
      };

      return { data: flattenedData, error: null };
    } catch (err) {
      console.error("Error in getCurrentProfessional:", err);
      return { data: null, error: err as Error };
    }
  },

  /**
   * Create professional profile
   */
  async createProfessional(professionalData: Omit<ProfessionalInsert, "user_id">): Promise<{ data: Professional | null; error: Error | null }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { data: null, error: new Error("Non authentifié") };
      }

      const { data, error } = await supabase
        .from("professionals")
        .insert({
          ...professionalData,
          user_id: user.id
        })
        .select("id, user_id, siret, company_name, specialties, experience_years, coverage_radius, credits_balance, rating_average, rating_count, total_projects, certification_badge, certification_date, insurance_expiry_date, has_rge, has_qualibat, has_qualibois, has_qualipac, has_qualipv, has_qualitenr, has_eco_artisan, other_certifications, status, created_at, updated_at")
        .single();

      // Envoyer les notifications aux équipes admin, support et TEAM
      if (data && !error) {
        try {
          // Notification admin
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: 'admin@swipetonpro.com',
              subject: '🔔 NOUVEAU PROFESSIONNEL À VALIDER',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 24px;">Nouveau Professionnel En Attente</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">SwipeTonPro - Validation Requise</p>
                  </div>
                  <div style="padding: 30px; background: #f9f9f9;">
                    <h2 style="color: #333; margin-top: 0;">Informations du professionnel</h2>
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <p><strong>Entreprise:</strong> ${professionalData.company_name}</p>
                      <p><strong>SIRET:</strong> ${professionalData.siret}</p>
                      <p><strong>Spécialités:</strong> ${professionalData.specialties?.join(', ')}</p>
                      <p><strong>Email:</strong> ${user.email}</p>
                      <p><strong>Date d'inscription:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/professionals-validation" 
                         style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Valider le professionnel
                      </a>
                    </div>
                  </div>
                </div>
              `,
              type: 'admin'
            })
          });

          // Notification support
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: 'support@swipetonpro.com',
              subject: '📋 Support: Nouveau professionnel à valider',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: #f39c12; padding: 20px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 24px;">Support - Nouveau Professionnel</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">En attente de validation</p>
                  </div>
                  <div style="padding: 30px; background: #f9f9f9;">
                    <p>Un nouveau professionnel s'est inscrit et attend validation:</p>
                    <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
                      <p><strong>${professionalData.company_name}</strong> (${professionalData.siret})</p>
                      <p><strong>Email:</strong> ${user.email}</p>
                    </div>
                    <p style="color: #666; font-size: 14px;">Veuillez préparer le support pour activation.</p>
                  </div>
                </div>
              `,
              type: 'support'
            })
          });

          // Notification TEAM
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: 'team@swipetonpro.com',
              subject: '🚀 TEAM: Nouveau professionnel inscrit',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: #27ae60; padding: 20px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 24px;">TEAM - Nouveau Pro</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">Croissance de la plateforme</p>
                  </div>
                  <div style="padding: 30px; background: #f9f9f9;">
                    <p>Excellent! Un nouveau professionnel rejoint SwipeTonPro:</p>
                    <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
                      <p><strong>${professionalData.company_name}</strong></p>
                      <p><strong>Spécialités:</strong> ${professionalData.specialties?.join(', ')}</p>
                      <p><strong>Inscrit le:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
                    </div>
                    <p style="color: #27ae60; font-weight: bold;">🎉 Un professionnel de plus dans notre réseau!</p>
                  </div>
                </div>
              `,
              type: 'team'
            })
          });

          console.log("Notifications envoyées aux équipes admin, support et TEAM");
        } catch (notificationError) {
          console.error("Erreur envoi notifications:", notificationError);
          // Ne pas bloquer l'inscription si les notifications échouent
        }
      }

      return { data: data as ProfessionalWithCertifications, error: null };
    } catch (err) {
      console.error("Error in createProfessional:", err);
      return { data: null, error: err as Error };
    }
  },

  /**
   * Update professional profile
   */
  async updateProfessional(updates: ProfessionalUpdate): Promise<{ data: Professional | null; error: Error | null }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { data: null, error: new Error("Non authentifié") };
      }

      const { data, error } = await supabase
        .from("professionals")
        .update(updates)
        .eq("user_id", user.id)
        .select("id, user_id, siret, company_name, specialties, experience_years, coverage_radius, credits_balance, rating_average, rating_count, total_projects, certification_badge, certification_date, insurance_expiry_date, has_rge, has_qualibat, has_qualibois, has_qualipac, has_qualipv, has_qualitenr, has_eco_artisan, other_certifications, status, created_at, updated_at")
        .single();

      if (error) {
        console.error("Error updating professional:", error);
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as ProfessionalWithCertifications, error: null };
    } catch (err) {
      console.error("Error in updateProfessional:", err);
      return { data: null, error: err as Error };
    }
  },

  /**
   * Update certifications
   */
  async updateCertifications(certifications: {
    qualibat?: { number: string; expiryDate: string; document?: string };
    rge?: { number: string; expiryDate: string; document?: string };
    ecoArtisan?: { number: string; expiryDate: string; document?: string };
    qualitEnr?: { number: string; expiryDate: string; document?: string };
    qualiPV?: { number: string; expiryDate: string; document?: string };
    qualiPAC?: { number: string; expiryDate: string; document?: string };
    qualiBois?: { number: string; expiryDate: string; document?: string };
    other?: { name: string; number: string; expiryDate: string; document?: string }[];
  }): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: new Error("Non authentifié") };
      }

      const { error } = await supabase
        .from("professionals")
        .update({ certifications })
        .eq("user_id", user.id);

      if (error) {
        console.error("Error updating certifications:", error);
        return { success: false, error: new Error(error.message) };
      }

      return { success: true, error: null };
    } catch (err) {
      console.error("Error in updateCertifications:", err);
      return { success: false, error: err as Error };
    }
  },

  /**
   * Search professionals by certifications
   */
  async searchByCertifications(
    requiredCertifications: string[]
  ): Promise<{ data: Professional[]; error: Error | null }> {
    try {
      let query = supabase
        .from("professionals")
        .select("id, user_id, siret, company_name, specialties, experience_years, coverage_radius, credits_balance, rating_average, rating_count, total_projects, certification_badge, certification_date, insurance_expiry_date, has_rge, has_qualibat, has_qualibois, has_qualipac, has_qualipv, has_qualitenr, has_eco_artisan, other_certifications, status, created_at, updated_at")
        .eq("status", "verified");

      // Filtrer par certifications (vérifie que le champ existe dans le JSONB)
      requiredCertifications.forEach(cert => {
        query = query.not("certifications", "is", null).filter(`certifications->${cert}`, "neq", null);
      });

      const { data, error } = await query;

      if (error) {
        console.error("Error searching professionals:", error);
        return { data: [], error: new Error(error.message) };
      }

      return { data: (data || []) as ProfessionalWithCertifications[], error: null };
    } catch (err) {
      console.error("Error in searchByCertifications:", err);
      return { data: [], error: err as Error };
    }
  },

  /**
   * Check if professional has specific certification
   */
  hasCertification(professional: ProfessionalWithCertifications, certificationKey: string): boolean {
    if (!professional.certifications) return false;
    
    const certs = professional.certifications as Record<string, any>;
    return !!certs[certificationKey] && !!certs[certificationKey].number;
  },

  /**
   * Upload document to storage
   */
  async uploadDocument(file: File, documentType: "siret" | "insurance" | "portfolio"): Promise<{ data: { url: string } | null; error: Error | null }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { data: null, error: new Error("Non authentifié") };
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${documentType}_${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("professional-documents")
        .upload(fileName, file);

      if (error) {
        console.error("Error uploading document:", error);
        return { data: null, error: new Error(error.message) };
      }

      const { data: urlData } = supabase.storage
        .from("professional-documents")
        .getPublicUrl(data.path);

      return { data: { url: urlData.publicUrl }, error: null };
    } catch (err) {
      console.error("Error in uploadDocument:", err);
      return { data: null, error: err as Error };
    }
  },

  /**
   * Get professional statistics
   */
  async getStats(): Promise<{ data: { total_bids: number; accepted_bids: number; credits_balance: number } | null; error: Error | null }> {
    try {
      const { data: professional, error: profError } = await this.getCurrentProfessional();
      
      if (profError || !professional) {
        return { data: null, error: profError };
      }

      const { count: totalBids } = await supabase
        .from("bids")
        .select("*", { count: "exact", head: true })
        .eq("professional_id", professional.id);

      const { count: acceptedBids } = await supabase
        .from("bids")
        .select("*", { count: "exact", head: true })
        .eq("professional_id", professional.id)
        .eq("status", "accepted");

      return {
        data: {
          total_bids: totalBids || 0,
          accepted_bids: acceptedBids || 0,
          credits_balance: professional.credits_balance || 0
        },
        error: null
      };
    } catch (err) {
      console.error("Error in getStats:", err);
      return { data: null, error: err as Error };
    }
  }
};