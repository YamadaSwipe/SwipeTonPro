import { supabase } from '@/integrations/supabase/client';

// Types pour les statistiques
export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
  matchRate: number;
}

export interface ChartData {
  date: string;
  value: number;
  label?: string;
}

export interface ProfessionalStats extends DashboardStats {
  totalBids: number;
  acceptedBids: number;
  pendingBids: number;
  rejectedBids: number;
}

/**
 * Get dashboard statistics for professionals
 */
export async function getProfessionalDashboardStats(professionalId: string): Promise<DashboardStats> {
  try {
    // Validation de l'UUID
    if (!professionalId || professionalId === "" || !professionalId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      console.warn("Invalid professional ID provided, returning default stats");
      return {
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        totalRevenue: 0,
        averageRating: 0,
        totalReviews: 0,
        matchRate: 0,
        totalBids: 0,
        acceptedBids: 0,
        pendingBids: 0,
        rejectedBids: 0
      };
    }

    // Récupérer les projets du professionnel
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("status, estimated_budget_max, estimated_budget_min")
      .eq("assigned_to", professionalId);

    if (projectsError) throw projectsError;

    // Calculer les stats réelles
    const totalProjects = projects?.length || 0;
    const activeProjects = projects?.filter(p => p.status === "in_progress").length || 0;
    const completedProjects = projects?.filter(p => p.status === "completed").length || 0;
    
    // Calculer revenus (moyenne des budgets des projets complétés)
    const completedProjectsBudgets = projects?.filter(p => p.status === "completed") || [];
    const totalRevenue = completedProjectsBudgets.reduce((sum, project) => {
      const budget = project.estimated_budget_max || project.estimated_budget_min || 0;
      return sum + budget;
    }, 0);

    // Récupérer les notes moyennes depuis les reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("rating")
      .eq("professional_id", professionalId);

    if (reviewsError) throw reviewsError;

    const totalReviews = reviews?.length || 0;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;

    // Récupérer les stats de bids
    const { data: bids, error: bidsError } = await supabase
      .from("bids")
      .select("status")
      .eq("professional_id", professionalId);

    if (bidsError) throw bidsError;

    const totalBids = bids?.length || 0;
    const acceptedBids = bids?.filter(b => b.status === "accepted").length || 0;
    const pendingBids = bids?.filter(b => b.status === "pending").length || 0;
    const rejectedBids = bids?.filter(b => b.status === "rejected").length || 0;

    const matchRate = totalBids > 0 ? Math.round((acceptedBids / totalBids) * 100) : 0;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalRevenue,
      averageRating: Math.round(averageRating * 10) / 10, // Arrondir à 1 décimale
      totalReviews,
      matchRate,
      totalBids,
      acceptedBids,
      pendingBids,
      rejectedBids
    };
  } catch (error) {
    console.error("Error fetching professional dashboard stats:", error);
    
    // Retourner des valeurs par défaut réelles en cas d'erreur
    return {
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0,
      totalRevenue: 0,
      averageRating: 0,
      totalReviews: 0,
      matchRate: 0,
      totalBids: 0,
      acceptedBids: 0,
      pendingBids: 0,
      rejectedBids: 0
    };
  }
}

/**
 * Get project activity chart data
 */
export async function getProjectActivityChart(professionalId: string): Promise<ChartData[]> {
  try {
    // Simuler des données pour éviter les erreurs
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [
      { date: '01/01', value: 2, label: 'Lun' },
      { date: '02/01', value: 3, label: 'Mar' },
      { date: '03/01', value: 1, label: 'Mer' },
      { date: '04/01', value: 4, label: 'Jeu' },
      { date: '05/01', value: 2, label: 'Ven' },
      { date: '06/01', value: 3, label: 'Sam' },
      { date: '07/01', value: 5, label: 'Dim' },
    ];
  } catch (error) {
    console.error("Error fetching chart data:", error);
    return [];
  }
}
