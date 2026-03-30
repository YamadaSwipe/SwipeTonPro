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
  MapPin, 
  Euro, 
  Calendar, 
  Clock, 
  ArrowLeft,
  Star,
  CheckCircle,
  Shield
} from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import type { Database } from "@/integrations/supabase/types";

type Project = Database["public"]["Tables"]["projects"]["Row"] & {
  // Removed sensitive client and professional info for public view
};

export default function ProjectDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);
  const [isProfessional, setIsProfessional] = useState(false);

  useEffect(() => {
    if (id) {
      loadProject();
      checkAuth();
    }
  }, [id]);

  const checkAuth = async () => {
    const { user, role } = useAuth();
    console.log("USER:", user?.id);
    console.log("ROLE:", role);
    setUser(user);
    
    if (user) {
      // Check if user is professional
      const { data: professional } = await supabase
        .from('professionals')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      setIsProfessional(!!professional);
    }
  };

  const loadProject = async () => {
    try {
      const projectId = Array.isArray(id) ? id[0] : id;
      if (!projectId) return;

      // Only load basic project info for public view
      const { data, error } = await supabase
        .from("projects")
        .select(`
          id,
          title,
          description,
          category,
          work_types,
          city,
          urgency,
          status,
          estimated_budget_min,
          estimated_budget_max,
          photos,
          ai_analysis,
          created_at,
          updated_at
        `)
        .eq("id", projectId)
        .single();

      if (error) throw error;
      setProject(data as any);
    } catch (err: any) {
      console.error("Error loading project:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !project) {
    const currentProjectId = Array.isArray(id) ? id[0] : id;
    console.log("Debug - Project data:", { project, error, projectId: currentProjectId });
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Projet non trouvé</h2>
            <p className="text-muted-foreground mb-4">
              {error || "Ce projet n'existe pas ou a été supprimé."}
            </p>
            <Link href="/projets/parcourir">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour aux projets
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title={`${project.title} - SwipeTonPro`}
        description={project.description}
      />
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <Link href="/">
              <Button variant="outline" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à l'accueil
              </Button>
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{project.category}</Badge>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    {project.city}
                  </Badge>
                  {project.urgency === 'high' && (
                    <Badge variant="destructive">Urgent</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Description du projet</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-text-secondary whitespace-pre-wrap">
                    {project.description}
                  </p>
                </CardContent>
              </Card>

              {/* Budget & Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Budget et délais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Euro className="w-5 h-5 text-success" />
                      <div>
                        <p className="text-sm text-text-muted">Budget estimé</p>
                        <p className="font-semibold">
                          {project.estimated_budget_min && project.estimated_budget_max
                            ? `${project.estimated_budget_min.toLocaleString()}€ - ${project.estimated_budget_max.toLocaleString()}€`
                            : project.estimated_budget_max
                              ? `Jusqu'à ${project.estimated_budget_max.toLocaleString()}€`
                              : project.estimated_budget_min
                                ? `À partir de ${project.estimated_budget_min.toLocaleString()}€`
                                : 'Budget à définir'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-text-muted">Durée estimée</p>
                        <p className="font-semibold">
                          Non spécifiée
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Analysis */}
              {project.ai_analysis && (
                <Card>
                  <CardHeader>
                    <CardTitle>🤖 Estimation IA</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-text-secondary space-y-1">
                      {typeof project.ai_analysis === 'object' ? (
                        <>
                          {(project.ai_analysis as any)?.estimated_cost && (
                            <p>Coût estimé: {(project.ai_analysis as any).estimated_cost}€</p>
                          )}
                          {(project.ai_analysis as any)?.duration_days && (
                            <p>Durée: {(project.ai_analysis as any).duration_days} jours</p>
                          )}
                          {(project.ai_analysis as any)?.complexity && (
                            <p>Complexité: {(project.ai_analysis as any).complexity}</p>
                          )}
                        </>
                      ) : (
                        <p className="whitespace-pre-wrap">{project.ai_analysis}</p>
                      )}
                    </div>
                    <p className="text-xs text-text-muted italic mt-2">
                      * À titre indicatif, ne peut être prise pour valeur contractuelle
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Photos */}
              {project.photos && Array.isArray(project.photos) && project.photos.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Photos du projet</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {project.photos.map((photo, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                          <img
                            src={photo as string}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* CTA Card */}
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-semibold mb-2">Intéressé par ce projet ?</h3>
                  <p className="text-sm text-text-secondary mb-4">
                    {isProfessional 
                      ? "Postulez dès maintenant pour ce projet"
                      : "Inscrivez-vous pour postuler à ce projet"
                    }
                  </p>
                  
                  {isProfessional ? (
                    <Link href={`/professionnel/dashboard?project=${project.id}`}>
                      <Button className="w-full gradient-primary text-white">
                        Postuler à ce projet
                      </Button>
                    </Link>
                  ) : user ? (
                    <Link href="/professionnel/create-account">
                      <Button className="w-full gradient-primary text-white">
                        Devenir professionnel
                      </Button>
                    </Link>
                  ) : (
                    <div className="space-y-2">
                      <Link href="/login">
                        <Button className="w-full" variant="outline">
                          Se connecter
                        </Button>
                      </Link>
                      <Link href="/professionnel/create-account">
                        <Button className="w-full gradient-primary text-white">
                          S'inscrire comme professionnel
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Project Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-accent" />
                    <div>
                      <p className="text-sm text-text-muted">Localisation</p>
                      <p className="font-medium">{project.city}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-sm text-text-muted">Publié le</p>
                      <p className="font-medium">
                        {new Date(project.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <div>
                      <p className="text-sm text-text-muted">Type de travaux</p>
                      <p className="font-medium">{project.work_types}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trust Badge */}
              <Card className="bg-success/5 border-success/20">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-6 h-6 text-success" />
                  </div>
                  <h4 className="font-semibold mb-1">Service sécurisé</h4>
                  <p className="text-xs text-text-secondary">
                    Plateforme de mise en relation sécurisée avec paiement protégé
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
