import { SEO } from "@/components/SEO";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LogOut, 
  Plus, 
  Clock, 
  CheckCircle, 
  Image as ImageIcon,
  MapPin,
  Euro,
  Users,
  ArrowLeft,
  Briefcase,
  XCircle,
  MessageSquare,
  Star,
  Phone,
  Mail,
  User,
  Home,
  Bell
} from "lucide-react";
import Link from "next/link";
import { authService } from "@/services/authService";
import { projectService } from "@/services/projectService";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { PlanningCard } from "@/components/planning/PlanningCard";
import { RatingModal } from "@/components/rating/RatingModal";
import { NotificationCenter } from "@/components/notifications/NotificationCenterDashboard";
import type { Database } from "@/integrations/supabase/types";

type Project = Database["public"]["Tables"]["projects"]["Row"];

export default function ParticulierDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    inProgressProjects: 0,
    completedProjects: 0,
    totalSpent: 0,
  });

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        
        // Charger les projets de l'utilisateur
        const userProjects = await projectService.getUserProjects();
        setProjects((userProjects as any)?.data || []);

        // Calculer les statistiques
        const projectsData = (userProjects as any)?.data || [];
        const stats = {
          totalProjects: projectsData.length,
          inProgressProjects: projectsData.filter((p: any) => p.status === "in_progress").length,
          completedProjects: projectsData.filter((p: any) => p.status === "completed").length,
          totalSpent: projectsData.reduce((sum: number, p: any) => sum + (p.budget_max || 0), 0),
        };
        setStats(stats);
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/auth/login");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <SEO title="Tableau de Bord - Particulier" />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-8">
                <Link href="/particulier/dashboard" className="flex items-center space-x-2 text-primary hover:text-primary">
                  <Home className="w-5 h-5" />
                  <span className="font-medium">Accueil</span>
                </Link>
                <Link href="/particulier/projects" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                  <Briefcase className="w-5 h-5" />
                  <span className="font-medium">Mes Projets</span>
                </Link>
                <Link href="/particulier/planning" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">Planning</span>
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <NotificationCenter userId={user?.id} />
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Déconnexion
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Section d'accueil avec informations propriétaire */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="text-left">
                  <h1 className="text-3xl font-bold text-foreground mb-4">
                    👋 Bienvenue, {user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.full_name || "Utilisateur"} !
                  </h1>
                  <p className="text-lg text-muted-foreground mb-6">
                    Nous sommes ravis de vous accompagner dans vos projets de travaux.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">Votre compte</p>
                        <p className="text-sm text-muted-foreground">
                          {user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.full_name || "Utilisateur"} "Particulier"
                        </p>
                      </div>
                    </div>
                    
                    {user?.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium">Téléphone</p>
                          <p className="text-sm text-muted-foreground">{user.phone}</p>
                        </div>
                      </div>
                    )}
                    
                    {user?.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium">Email</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Projets</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProjects}</div>
                <p className="text-xs text-muted-foreground">Projets créés</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En Cours</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.inProgressProjects}</div>
                <p className="text-xs text-muted-foreground">Projets actifs</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Terminés</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completedProjects}</div>
                <p className="text-xs text-muted-foreground">Projets complétés</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Budget Total</CardTitle>
                <Euro className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSpent.toLocaleString()}€</div>
                <p className="text-xs text-muted-foreground">Montant total</p>
              </CardContent>
            </Card>
          </div>

          {/* Planning Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Mon Planning</h2>
              <Link href="/particulier/planning" className="flex items-center text-primary hover:text-primary">
                <Clock className="w-5 h-5 mr-2" />
                Voir tout le planning
              </Link>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects && projects.length > 0 ? (
                projects.slice(0, 3).map((project) => (
                  <PlanningCard 
                    key={project.id}
                    project={project}
                    bid={(project as any).bids && (project as any).bids.length > 0 ? (project as any).bids[0] : {
                      id: project.id,
                      planning_status: "pending",
                      planning_date: project.desired_start_date || new Date().toISOString().split('T')[0],
                      planning_time: "09:00"
                    }}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucun projet en cours pour le moment</p>
                  <Link href="/particulier/create-project" className="inline-flex items-center text-primary hover:text-primary mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Créer un projet
                  </Link>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
