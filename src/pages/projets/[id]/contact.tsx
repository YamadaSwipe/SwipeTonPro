import { SEO } from "@/components/SEO";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  MapPin, 
  Euro, 
  Calendar, 
  ArrowLeft,
  MessageSquare,
  User,
  Phone,
  Mail,
  Star,
  CheckCircle
} from "lucide-react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import type { Database } from "@/integrations/supabase/types";

type Project = Database["public"]["Tables"]["projects"]["Row"] & {
  client?: {
    full_name?: string;
    email?: string;
    phone?: string;
  };
  professional?: {
    company_name?: string;
    email?: string;
    phone?: string;
  };
};

export default function ProjectContactPage() {
  const router = useRouter();
  const { id } = router.query;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

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
    if (!message.trim() || !project) return;

    setSending(true);
    try {
      // Créer une conversation ou ajouter un message
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Vérifier si une conversation existe déjà
      const { data: existingConv } = await supabase
        .from("conversations")
        .select("*")
        .eq("project_id", project.id)
        .eq("client_id", project.client_id)
        .maybeSingle();

      if (existingConv) {
        // Ajouter un message à la conversation existante
        await supabase
          .from("messages")
          .insert({
            conversation_id: existingConv.id,
            sender_id: user.id,
            content: message,
          });
      } else {
        // Créer une nouvelle conversation (pour les professionnels)
        // Cette logique sera à adapter selon le type d'utilisateur
      }

      setMessage("");
      alert("Message envoyé avec succès!");
    } catch (err: any) {
      console.error("Error sending message:", err);
      alert("Erreur lors de l'envoi du message");
    } finally {
      setSending(false);
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
        title={`Contacter - ${project.title} - SwipeTonPro`}
        description={`Contacter le client pour le projet: ${project.title}`}
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
              
              <h1 className="text-3xl font-bold mb-2">Contacter le client</h1>
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

            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Envoyer un message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Votre message
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full min-h-32 p-3 border rounded-md resize-none"
                      placeholder="Décrivez votre intérêt pour ce projet, vos disponibilités, etc..."
                      required
                    />
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <Link href={`/projets/${id}`}>
                      <Button variant="outline" type="button">
                        Annuler
                      </Button>
                    </Link>
                    <Button type="submit" disabled={sending || !message.trim()}>
                      {sending ? "Envoi en cours..." : "Envoyer le message"}
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
