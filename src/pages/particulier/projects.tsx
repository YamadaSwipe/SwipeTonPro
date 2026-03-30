import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import { authService } from "@/services/authService";
import { projectService } from "@/services/projectService";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, DollarSign, Clock, Plus, Users } from "lucide-react";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => { loadProjects(); }, []);

  const loadProjects = async () => {
    try {
      const session = await authService.getCurrentSession();
      if (!session) { router.push('/auth/login'); return; }

      const result = await projectService.getUserProjects();
      if (result.error) {
        console.error('Erreur chargement projets:', result.error);
        setProjects([]);
      } else {
        setProjects(result.data || []);
      }
    } catch (error) {
      console.error('Erreur chargement projets:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      published:   { label: "Publié",                    variant: "default" },
      pending:     { label: "En attente de validation",  variant: "secondary" },
      rejected:    { label: "Refusé",                    variant: "destructive" },
      in_progress: { label: "En cours",                  variant: "outline" },
      completed:   { label: "Terminé",                   variant: "outline" },
    };
    const cfg = map[status] || { label: "Brouillon", variant: "outline" as const };
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4" />
            <p className="text-gray-600">Chargement de vos projets...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <SEO title="Mes Projets - SwipeTonPro" />
      <div className="min-h-screen bg-gray-50">

        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Link href="/particulier/dashboard" className="mr-4">
                  <ArrowLeft className="h-5 w-5 text-gray-600 hover:text-gray-900" />
                </Link>
                <h1 className="text-xl font-semibold text-gray-900">Mes Projets</h1>
              </div>
              <Link href="/particulier/new-project">
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Projet
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <Plus className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun projet</h3>
              <p className="text-gray-600 mb-6">Commencez par créer votre premier projet</p>
              <Link href="/particulier/new-project">
                <Button className="bg-orange-500 hover:bg-orange-600">Créer un projet</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg leading-tight">{project.title}</CardTitle>
                      {getStatusBadge(project.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                        {project.city}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
                        {new Date(project.created_at).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="h-4 w-4 mr-1 flex-shrink-0" />
                        {(project.estimated_budget_min || project.budget_min || 0).toLocaleString('fr-FR')}€
                        {' – '}
                        {(project.estimated_budget_max || project.budget_max || 0).toLocaleString('fr-FR')}€
                      </div>

                      {/* Intérêts reçus */}
                      {project.bids_count > 0 && (
                        <div className="flex items-center text-sm text-orange-600 font-medium">
                          <Users className="h-4 w-4 mr-1 flex-shrink-0" />
                          {project.bids_count} professionnel{project.bids_count > 1 ? 's' : ''} intéressé{project.bids_count > 1 ? 's' : ''}
                        </div>
                      )}

                      {/* Estimation IA */}
                      {project.ai_estimation && (
                        <div className="flex items-center text-sm text-blue-600">
                          <div className="w-4 h-4 bg-blue-500 rounded-full mr-1 flex-shrink-0" />
                          Estimation IA disponible
                        </div>
                      )}

                      {/* Actions */}
                      <div className="pt-3 flex gap-2">
                        <Link href={`/particulier/projects/${project.id}`} className="flex-1">
                          <Button variant="outline" className="w-full">Détails</Button>
                        </Link>
                        {project.bids_count > 0 && (
                          <Link href={`/particulier/projects/${project.id}/interests`} className="flex-1">
                            <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                              {project.bids_count} intérêt{project.bids_count > 1 ? 's' : ''}
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
