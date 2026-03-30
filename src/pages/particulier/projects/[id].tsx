import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { projectService } from "@/services/projectService";
import { authService } from "@/services/authService";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Clock, 
  Edit,
  Star,
  AlertTriangle,
  Eye,
  MessageSquare,
  Trash2
} from "lucide-react";

export default function ProjectDetailPage() {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      loadProject();
    }
  }, [id]);

  const loadProject = async () => {
    try {
      const session = await authService.getCurrentSession();
      if (!session?.user?.id) {
        router.push('/auth/login');
        return;
      }

      const result = await projectService.getProjectById(id as string);
      console.log('🔍 Projet détail brut:', result);
      
      if (result.error || !result.data) {
        console.error('Erreur:', result.error);
        setProject(null);
      } else {
        console.log('🔍 Projet chargé:', result.data);
        console.log('🔍 AI Estimation:', result.data.ai_estimation);
        setProject(result.data);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setProject(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.')) {
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id as string);

      if (error) throw error;

      // Rediriger vers la liste des projets
      router.push('/particulier/projects');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du projet');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Brouillon</Badge>;
      case 'published':
        return <Badge variant="default">Publié</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Annulé</Badge>;
      case 'featured':
        return <Badge className="bg-yellow-100 text-yellow-800"><Star className="w-3 h-3 mr-1" /> Vedette</Badge>;
      case 'urgent':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" /> Urgent</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getValidationStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> En attente</Badge>;
      case 'in_review':
        return <Badge variant="default"><Eye className="w-3 h-3 mr-1" /> En cours</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Approuvé</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeté</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement du projet...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!project) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Projet non trouvé</h3>
            <p className="text-gray-600 mb-6">Le projet que vous recherchez n'existe pas.</p>
            <Button onClick={() => router.push('/particulier/dashboard')}>
              Retour au dashboard
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <SEO 
        title={project.title}
        description={`Détails du projet ${project.title} - SwipeTonPro`}
      />
      
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/particulier/dashboard')}
                  className="flex items-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
                <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(project.status)}
                {getValidationStatusBadge(project.validation_status)}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="grid gap-6">
            {/* Main Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informations du projet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Description</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">{project.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Catégorie:</span>
                      <p className="text-gray-600">{project.category}</p>
                    </div>
                    <div>
                      <span className="font-medium">Ville:</span>
                      <p className="text-gray-600">{project.city}</p>
                    </div>
                    <div>
                      <span className="font-medium">Budget:</span>
                      <p className="text-gray-600">
                        {project.estimated_budget_min || project.budget_min}€ - {project.estimated_budget_max || project.budget_max}€
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Date de création:</span>
                      <p className="text-gray-600">
                        {new Date(project.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Estimation IA */}
                  {project.ai_analysis && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">🤖 Estimation IA</h4>
                      <div className="text-blue-800">
                        {typeof project.ai_analysis === 'string' ? (
                          <p className="whitespace-pre-wrap">{project.ai_analysis}</p>
                        ) : (
                          <div className="space-y-2">
                            {project.ai_analysis.estimated_cost && (
                              <p><strong>Coût estimé:</strong> {project.ai_analysis.estimated_cost}€</p>
                            )}
                            {project.ai_analysis.duration_days && (
                              <p><strong>Durée estimée:</strong> {project.ai_analysis.duration_days} jours</p>
                            )}
                            {project.ai_analysis.complexity && (
                              <p><strong>Complexité:</strong> {project.ai_analysis.complexity}</p>
                            )}
                            <pre className="whitespace-pre-wrap text-xs mt-2">
                              {JSON.stringify(project.ai_analysis, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {project.is_featured && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <Star className="h-5 w-5 text-yellow-500 mr-2" />
                        <span className="text-yellow-800 font-medium">Ce projet est en vedette</span>
                      </div>
                    </div>
                  )}

                  {project.is_urgent && (
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                        <span className="text-red-800 font-medium">Ce projet est marqué comme urgent</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4">
                  {project.status === 'draft' && (
                    <Button
                      onClick={() => router.push(`/particulier/new-project?edit=${project.id}`)}
                      className="flex items-center"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={() => window.print()}
                    className="flex items-center"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Imprimer
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={handleDeleteProject}
                    disabled={deleting}
                    className="flex items-center"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {deleting ? 'Suppression...' : 'Supprimer'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Status History */}
            {(project.validated_at || project.featured_at || project.urgent_at) && (
              <Card>
                <CardHeader>
                  <CardTitle>Historique du statut</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {project.validated_at && (
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-gray-600">
                          Validé le {new Date(project.validated_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {project.featured_at && (
                      <div className="flex items-center text-sm">
                        <Star className="h-4 w-4 mr-2 text-yellow-400" />
                        <span className="text-gray-600">
                          Mis en vedette le {new Date(project.featured_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {project.urgent_at && (
                      <div className="flex items-center text-sm">
                        <AlertTriangle className="h-4 w-4 mr-2 text-red-400" />
                        <span className="text-gray-600">
                          Marqué urgent le {new Date(project.urgent_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
