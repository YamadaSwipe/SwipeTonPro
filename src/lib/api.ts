// Fonctions API pour la communication avec Supabase
// À implémenter avec les endpoints réels

export interface UserProfile {
  id: string;
  type: "particulier" | "professionnel";
  email: string;
  created_at: string;
}

export interface ProProfile extends UserProfile {
  company: string;
  siret: string;
  specialites: string[];
  credits: number;
  certifie: boolean;
  documents_verified: boolean;
}

export interface ParticulierProfile extends UserProfile {
  projects: string[];
}

export interface Project {
  id: string;
  user_id: string;
  type: string;
  description: string;
  location: string;
  budget: number;
  estimation_haute: number;
  photos: string[];
  status: "draft" | "published" | "matched" | "completed";
  created_at: string;
}

export interface Candidature {
  id: string;
  project_id: string;
  pro_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
}

// Mock API - Remplacer par vraies requêtes Supabase
export const api = {
  // Authentification
  async signUp(email: string, password: string, userType: "particulier" | "professionnel") {
    // Inscription avec Supabase Auth
    try {
      const { data, error } = await (await import("@/integrations/supabase/client")).supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role: userType }
        }
      });
      if (error) return { success: false, error: error.message };
      return { success: true, userId: data.user?.id };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async signIn(email: string, password: string) {
    // Connexion avec Supabase Auth
    try {
      const { data, error } = await (await import("@/integrations/supabase/client")).supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) return { success: false, error: error.message };
      return { success: true, userId: data.user?.id };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async signOut() {
    // Déconnexion avec Supabase Auth
    try {
      const { error } = await (await import("@/integrations/supabase/client")).supabase.auth.signOut();
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // Projets
  async createProject(projectData: any) {
    // Création d'un projet avec Supabase
    try {
      const { data: { user }, error: authError } = await (await import("@/integrations/supabase/client")).supabase.auth.getUser();
      if (authError || !user) return { success: false, error: "Non authentifié" };
      const { data, error } = await (await import("@/integrations/supabase/client")).supabase
        .from("projects")
        .insert({ 
          title: projectData.title || "Sans titre",
          category: projectData.category || "renovation_complete",
          city: projectData.city || "",
          postal_code: projectData.postal_code || "",
          description: projectData.description,
          location: projectData.location,
          budget_min: projectData.budget_min,
          budget_max: projectData.budget_max,
          client_id: user.id
        })
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, projectId: data.id };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async getProjects(userId: string) {
    // Récupérer les projets d'un utilisateur
    try {
      const { data, error } = await (await import("@/integrations/supabase/client")).supabase
        .from("projects")
        .select("*")
        .eq("client_id", userId);
      if (error) return [];
      return data || [];
    } catch {
      return [];
    }
  },

  async getAvailableProjects() {
    // Récupérer tous les projets publiés
    try {
      const { data, error } = await (await import("@/integrations/supabase/client")).supabase
        .from("projects")
        .select("*")
        .eq("status", "published");
      if (error) return [];
      return data || [];
    } catch {
      return [];
    }
  },

  // Candidatures (table bids)
  async submitCandidature(projectId: string, proId: string) {
    // Soumettre une candidature et déduire un crédit
    try {
      const { data, error } = await (await import("@/integrations/supabase/client")).supabase
        .from("bids")
        .insert({ 
          project_id: projectId, 
          professional_id: proId,
          proposed_price: 0,
          status: "pending" 
        })
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      // Déduire crédit (à compléter selon logique métier)
      return { success: true, candidatureId: data.id };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async getCandidatures(projectId: string) {
    // Récupérer les candidatures d'un projet
    try {
      const { data, error } = await (await import("@/integrations/supabase/client")).supabase
        .from("bids")
        .select("*")
        .eq("project_id", projectId);
      if (error) return [];
      return data || [];
    } catch {
      return [];
    }
  },

  async acceptCandidature(candidatureId: string) {
    // Accepter une candidature et déclencher le paiement Stripe
    try {
      const { data, error } = await (await import("@/integrations/supabase/client")).supabase
        .from("bids")
        .update({ status: "accepted" })
        .eq("id", candidatureId)
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      // Appel API Next.js pour créer un PaymentIntent Stripe
      const response = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 1500, // exemple montant
          currency: "eur",
          professionalId: data.professional_id,
          projectId: data.project_id,
          description: "Paiement match unlock"
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.message };
      }
      const { clientSecret } = await response.json();
      return { success: true, clientSecret };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // Professionnels
  async createProProfile(proData: any) {
    // Création profil pro
    try {
      const { data: { user }, error: authError } = await (await import("@/integrations/supabase/client")).supabase.auth.getUser();
      if (authError || !user) return { success: false, error: "Non authentifié" };
      const { data, error } = await (await import("@/integrations/supabase/client")).supabase
        .from("professionals")
        .insert({ 
          user_id: user.id,
          company_name: proData.company_name || proData.company || "Entreprise",
          siret: proData.siret,
          certifications: proData.certifications,
          experience_years: proData.experience_years,
          specialities: proData.specialities,
          coverage_radius: proData.coverage_radius
        })
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, profileId: data.id };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async uploadDocuments(documents: { siret: File; assurance: File }) {
    // Upload documents via Supabase Storage
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return { success: false, error: "Non authentifié" };
      // Upload SIRET
      const siretRes = await supabase.storage.from("documents").upload(`siret/${user.id}_${Date.now()}.pdf`, documents.siret);
      if (siretRes.error) return { success: false, error: siretRes.error.message };
      // Upload Assurance
      const assuranceRes = await supabase.storage.from("documents").upload(`assurance/${user.id}_${Date.now()}.pdf`, documents.assurance);
      if (assuranceRes.error) return { success: false, error: assuranceRes.error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async getProCredits(proId: string) {
    // Récupérer crédits pro
    try {
      const { data, error } = await (await import("@/integrations/supabase/client")).supabase
        .from("professionals")
        .select("credits_balance")
        .eq("id", proId)
        .single();
      if (error) return { credits: 0 };
      return { credits: data.credits_balance };
    } catch {
      return { credits: 0 };
    }
  },

  async rechargeCredits(proId: string, amount: number) {
    // Recharger crédits via Stripe puis mettre à jour Supabase
    try {
      // Appel API Next.js pour créer un PaymentIntent Stripe
      const response = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount * 100, // en centimes
          currency: "eur",
          professionalId: proId,
          description: "Recharge crédits"
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.message };
      }
      const { clientSecret } = await response.json();
      // Le frontend doit ensuite confirmer le paiement avec Stripe.js
      // Après confirmation, mettre à jour Supabase
      // (Ici, on simule la mise à jour)
      const { data, error } = await (await import("@/integrations/supabase/client")).supabase
        .from("professionals")
        .update({ credits_balance: amount })
        .eq("id", proId)
        .select("credits_balance")
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, newBalance: data.credits_balance, clientSecret };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async estimateProject(input: any) {
    // Proxy vers le service IA d'estimation
    try {
      const { generateEstimationWithFallback } = await import("@/services/aiEstimationService");
      return await generateEstimationWithFallback(input);
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
};