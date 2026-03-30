import { SEO } from "@/components/SEO";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft,
  Users,
  MapPin,
  Euro,
  Calendar,
  MessageSquare,
  CheckCircle,
  Star,
  Clock,
  FileText
} from "lucide-react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import type { Database } from "@/integrations/supabase/types";

type ProjectInterest = Database["public"]["Tables"]["project_interests"]["Row"] & {
  project: {
    id: string;
    title: string;
    description: string;
    category: string;
    city: string;
    budget_min: number;
    budget_max: number;
    status: string;
    created_at: string;
    client: {
      full_name: string;
      email: string;
      phone: string;
    };
  };
  professional: {
    company_name: string;
    email: string;
    phone: string;
  };
};

export default function ProjectCandidaturesPage() {
  const router = useRouter();
  const { id } = router.query;
  const [project, setProject] = useState<any>(null);
  const [candidatures, setCandidatures] = useState<ProjectInterest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadCandidatures();
    }
  }, [id]);

  const loadCandidatures = async () => {
    try {
      const projectId = Array.isArray(id) ? id[0] : id;
      if (!projectId) return;

      // Charger le projet
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select(`
          *,
          client:profiles!projects_client_id_fkey(full_name, email, phone)
        `)
        .eq("id", projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Charger les candidatures
      const { data: interestsData, error: interestsError } = await supabase
        .from("project_interests")
        .select(`
          *,
          project:projects!project_interests_project_id_fkey(
            title,
            category,
            city,
            budget_min,
            budget_max,
            status,
            created_at,
            client:profiles!projects_client_id_fkey(full_name, email, phone)
          ),
          professional:professionals!project_interests_professional_id_fkey(
            company_name,
            email,
            phone
          )
        `)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (interestsError) throw interestsError;
      
      setCandidatures(interestsData as any || []);
    } catch (err: any) {
      console.error("Error loading candidatures:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptCandidature = async (interestId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Vérifier que l'utilisateur est bien le client du projet
      if (project?.client_id !== user.id) {
        alert("Vous n'êtes pas autorisé à accepter cette candidature");
        return;
      }

      // Mettre à jour le statut de la candidature
      await supabase
        .from("project_interests")
        .update({ 
          status: "accepted",
          client_interested: true
        })
        .eq("id", interestId);

      // Mettre à jour le statut du projet
      await supabase
        .from("projects")
        .update({ status: "in_progress" as any })
        .eq("id", project.id);

      alert("Candidature acceptée!");
      loadCandidatures(); // Recharger la liste
    } catch (err: any) {
      console.error("Error accepting candidature:", err);
      alert("Erreur lors de l'acceptation de la candidature");
    }
  };

  const handleRejectCandidature = async (interestId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (project?.client_id !== user.id) {
        alert("Vous n'êtes pas autorisé à refuser cette candidature");
        return;
      }

      await supabase
        .from("project_interests")
        .update({ status: "rejected" })
        .eq("id", interestId);

      alert("Candidature refusée");
      loadCandidatures();
    } catch (err: any) {
      console.error("Error rejecting candidature:", err);
      alert("Erreur lors du refus de la candidature");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Projet non trouvé</h2>
            <p className="text-muted-foreground mb-4">
              Ce projet n'existe pas ou a été supprimé.
            </p>
            <Link href="/projets/mes-projets">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à mes projets
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
        title={`Candidatures - ${project.title} - SwipeTonPro`}
        description={`Gérer les candidatures pour le projet: ${project.title}`}
      />
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <Link href={`/projets/${id}`}>
                <Button variant="outline" className="mb-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour au projet
                </Button>
              </Link>
              
              <h1 className="text-3xl font-bold mb-2">Candidatures reçues</h1>
              <p className="text-muted-foreground">
                Projet: {project.title}
              </p>
            </div>

            {/* Project Info */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Informations du projet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Catégorie</p>
                    <p className="font-medium">{project.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Localisation</p>
                    <p className="font-medium">{project.city}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Budget</p>
                    <p className="font-medium">
                      {project.budget_min && project.budget_max
                        ? `${project.budget_min.toLocaleString()}€ - ${project.budget_max.toLocaleString()}€`
                        : project.budget_max 
                          ? `Jusqu'à ${project.budget_max.toLocaleString()}€`
                          : 'Non spécifié'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Candidatures List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  {candidatures.length} candidature(s) reçue(s)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {candidatures.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      Aucune candidature reçue pour ce projet
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Les candidatures apparaîtront ici lorsque les professionnels seront intéressés par votre projet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {candidatures.map((candidature) => (
                      <div key={candidature.id} className="border rounded-lg p-4">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-lg font-semibold">
                                {candidature.professional?.company_name || "Professionnel"}
                              </h3>
                              <Badge variant={
                                candidature.status === 'accepted' ? 'default' :
                                candidature.status === 'rejected' ? 'destructive' :
                                candidature.status === 'pending' ? 'secondary' : 'secondary'
                              }>
                                {candidature.status === 'accepted' ? 'Acceptée' :
                                 candidature.status === 'rejected' ? 'Refusée' :
                                 candidature.status === 'pending' ? 'En attente' : candidature.status
                                }
                              </Badge>
                            </div>
                            
                            {(candidature as any)?.message && (
                              <div className="mb-3">
                                <p className="text-sm font-medium mb-1">Message du professionnel:</p>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                  {(candidature as any).message}
                                </p>
                              </div>
                            )}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                              {(candidature as any)?.proposed_price && (
                                <div className="flex items-center gap-1">
                                  <Euro className="w-4 h-4" />
                                  Prix proposé: {(candidature as any).proposed_price.toLocaleString()}€
                                </div>
                              )}
                              
                              {(candidature as any)?.estimated_duration && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  Durée: {(candidature as any).estimated_duration} jours
                                </div>
                              )}
                              
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                Candidature: {new Date(candidature.created_at).toLocaleDateString('fr-FR')}
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <MessageSquare className="w-4 h-4" />
                                {candidature.professional?.email}
                              </div>
                            </div>
                          </div>
                          
                          {candidature.status === 'pending' && (
                            <div className="flex flex-col gap-2 lg:w-48">
                              <Button 
                                onClick={() => handleAcceptCandidature(candidature.id)}
                                className="w-full"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Accepter
                              </Button>
                              
                              <Button 
                                variant="outline"
                                onClick={() => handleRejectCandidature(candidature.id)}
                                className="w-full"
                              >
                                Refuser
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
