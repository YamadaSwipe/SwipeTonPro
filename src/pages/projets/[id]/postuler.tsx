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
  ArrowLeft,
  CheckCircle,
  User,
  Star,
  Clock,
  FileText
} from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import type { Database } from "@/integrations/supabase/types";

type Project = Database["public"]["Tables"]["projects"]["Row"] & {
  client?: {
    full_name?: string;
    email?: string;
    phone?: string;
  };
};

export default function ProjectPostulerPage() {
  const router = useRouter();
  const { id } = router.query;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState({
    message: "",
    proposed_price: "",
    estimated_duration: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadProject();
    }
  }, [id]);

  const loadProject = async () => {
    try {
      const projectId = Array.isArray(id) ? id[0] : id;
      if (!projectId) return;

      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          client:profiles!projects_client_id_fkey(
            full_name,
            email,
            phone
          )
        `)
        .eq("id", projectId)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (err: any) {
      console.error("Error loading project:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { user, role } = useAuth();
      console.log("USER:", user?.id);
      console.log("ROLE:", role);
      
      if (!user) {
        router.push("/auth/login");
        return;
      }

      // Récupérer le profil professionnel
      const { data: professional } = await supabase
        .from("professionals")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!professional) {
        alert("Vous devez avoir un profil professionnel pour postuler");
        return;
      }

      // Créer une candidature (project_interest)
      await supabase
        .from("project_interests")
        .insert({
          project_id: project.id,
          professional_id: professional.id,
          status: "pending",
          message: proposal.message,
          proposed_price: parseInt(proposal.proposed_price) || null,
          estimated_duration: parseInt(proposal.estimated_duration) || null,
        });

      alert("Candidature envoyée avec succès!");
      router.push("/professionnel/dashboard");
    } catch (err: any) {
      console.error("Error submitting proposal:", err);
      alert("Erreur lors de l'envoi de la candidature");
    } finally {
      setSubmitting(false);
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
        title={`Postuler - ${project.title} - SwipeTonPro`}
        description={`Postuler au projet: ${project.title}`}
      />
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <Link href={`/projets/${id}`}>
                <Button variant="outline" className="mb-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour au projet
                </Button>
              </Link>
              
              <h1 className="text-3xl font-bold mb-2">Postuler à ce projet</h1>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Catégorie</p>
                    <p className="font-medium">{project.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Localisation</p>
                    <p className="font-medium">{project.city}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Budget client</p>
                    <p className="font-medium">
                      {project.budget_min && project.budget_max
                        ? `${project.budget_min.toLocaleString()}€ - ${project.budget_max.toLocaleString()}€`
                        : project.budget_max 
                          ? `Jusqu'à ${project.budget_max.toLocaleString()}€`
                          : 'Non spécifié'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Statut</p>
                    <Badge variant={project.status === 'published' ? 'default' : 'secondary'}>
                      {project.status}
                    </Badge>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">Description</p>
                  <p className="text-sm whitespace-pre-wrap">{project.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Application Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Votre proposition
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Message de présentation *
                    </label>
                    <textarea
                      value={proposal.message}
                      onChange={(e) => setProposal(prev => ({ ...prev, message: e.target.value }))}
                      className="w-full min-h-32 p-3 border rounded-md resize-none"
                      placeholder="Présentez-vous, décrivez votre expérience pour ce type de projet, votre disponibilité, etc..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Prix proposé (€) *
                      </label>
                      <input
                        type="number"
                        value={proposal.proposed_price}
                        onChange={(e) => setProposal(prev => ({ ...prev, proposed_price: e.target.value }))}
                        className="w-full p-3 border rounded-md"
                        placeholder="Ex: 1500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Durée estimée (jours) *
                      </label>
                      <input
                        type="number"
                        value={proposal.estimated_duration}
                        onChange={(e) => setProposal(prev => ({ ...prev, estimated_duration: e.target.value }))}
                        className="w-full p-3 border rounded-md"
                        placeholder="Ex: 7"
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-md">
                    <h4 className="font-medium text-blue-900 mb-2">Important:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Votre candidature sera visible par le client</li>
                      <li>• Si le client est intéressé, il pourra accepter votre proposition</li>
                      <li>• Une fois accepté, vous pourrez communiquer directement</li>
                      <li>• Le déblocage des coordonnées sera payant pour le professionnel</li>
                    </ul>
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <Link href={`/projets/${id}`}>
                      <Button variant="outline" type="button">
                        Annuler
                      </Button>
                    </Link>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? "Envoi en cours..." : "Envoyer ma candidature"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
