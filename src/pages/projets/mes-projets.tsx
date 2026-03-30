import { SEO } from "@/components/SEO";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft,
  Plus,
  Search,
  Filter,
  MapPin,
  Euro,
  Calendar,
  Clock,
  MessageSquare,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import type { Database } from "@/integrations/supabase/types";

type Project = Database["public"]["Tables"]["projects"]["Row"] & {
  client?: {
    full_name?: string;
  };
  _count?: {
    project_interests: number;
  };
};

export default function ProjectsManagementPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { user, role } = useAuth();
      console.log("USER:", user?.id);
      console.log("ROLE:", role);
      
      if (!user) {
        router.push("/auth/login");
        return;
      }

      // Récupérer le profil de l'utilisateur
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile) {
        router.push("/auth/login");
        return;
      }

      let query;
      if (profile?.role === "professional") {
        // Pour les professionnels: charger leurs projets
        const { data: professional } = await supabase
          .from("professionals")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (professional) {
          query = (supabase as any)
            .from("projects")
            .select(`
              *,
              client:profiles!projects_client_id_fkey(full_name),
              _count: project_interests(count)
            `)
            .eq("professional_id", professional.id);
        }
      } else {
        // Pour les clients: charger leurs projets
        query = supabase
          .from("projects")
          .select(`
            *,
            client:profiles!projects_client_id_fkey(full_name),
            _count: project_interests(count)
          `)
          .eq("client_id", user.id);
      }

      const { data, error } = await query || { data: [], error: null };
      if (error) throw error;
      
      setProjects(data || []);
    } catch (err: any) {
      console.error("Error loading projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || project.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "default";
      case "in_progress": return "default";
      case "completed": return "default";
      case "draft": return "secondary";
      case "pending": return "secondary";
      default: return "secondary";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "draft": return "Brouillon";
      case "published": return "Publié";
      case "pending": return "En attente";
      case "matched": return "Match trouvé";
      case "in_progress": return "En cours";
      case "completed": return "Terminé";
      case "cancelled": return "Annulé";
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="Mes Projets - SwipeTonPro"
        description="Gérez vos projets et suivez leur avancement"
      />
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold">Mes Projets</h1>
              <p className="text-muted-foreground">
                Gérez vos projets et suivez leur avancement
              </p>
            </div>
            
            <div className="flex gap-3">
              <Link href="/particulier/create-project">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau projet
                </Button>
              </Link>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Rechercher un projet..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-md"
                    />
                  </div>
                </div>
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border rounded-md bg-background"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="draft">Brouillons</option>
                  <option value="published">Publiés</option>
                  <option value="pending">En attente</option>
                  <option value="matched">Match trouvé</option>
                  <option value="in_progress">En cours</option>
                  <option value="completed">Terminés</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Projects List */}
          <div className="space-y-4">
            {filteredProjects.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-muted-foreground">
                    {searchTerm || filterStatus !== "all" 
                      ? "Aucun projet trouvé pour ces critères" 
                      : "Vous n'avez pas encore de projets"
                    }
                  </div>
                  {!searchTerm && filterStatus === "all" && (
                    <Link href="/particulier/create-project" className="inline-block mt-4">
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Créer mon premier projet
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredProjects.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <h3 className="text-lg font-semibold">{project.title}</h3>
                          <Badge variant={getStatusColor(project.status)}>
                            {getStatusText(project.status)}
                          </Badge>
                        </div>
                        
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                          {project.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {project.city}
                          </div>
                          
                          {project.budget_max && (
                            <div className="flex items-center gap-1">
                              <Euro className="w-4 h-4" />
                              {project.budget_min && project.budget_max
                                ? `${project.budget_min.toLocaleString()}€ - ${project.budget_max.toLocaleString()}€`
                                : `Jusqu'à ${project.budget_max.toLocaleString()}€`
                              }
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            {project._count?.project_interests || 0} candidature(s)
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(project.created_at).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 lg:w-48">
                        <Link href={`/projets/${project.id}`}>
                          <Button variant="outline" className="w-full">
                            Voir les détails
                          </Button>
                        </Link>
                        
                        {project.status === 'draft' && (
                          <Link href={`/particulier/create-project?id=${project.id}`}>
                            <Button variant="secondary" className="w-full">
                              Modifier
                            </Button>
                          </Link>
                        )}
                        
                        {project.status === 'published' && (
                          <Link href={`/projets/${project.id}/candidatures`}>
                            <Button variant="secondary" className="w-full">
                              Voir les candidatures
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
