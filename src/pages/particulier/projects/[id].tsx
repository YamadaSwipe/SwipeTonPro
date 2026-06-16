/**
 * @fileoverview Page de détail d'un projet pour le client
 * @description Affiche les détails du projet avec le suivi des jalons
 * @author Senior Architect
 * @version 1.0.0
 */

import { SEO } from '@/components/SEO';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClientGuard } from '@/components/auth/RoleGuard';
import { useAuth } from '@/context/AuthContext';
import { ProjectMilestonesTimeline } from '@/components/milestones/ProjectMilestonesTimeline';
import { ArrowLeft, MapPin, Calendar, Euro, FileText, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string;
  city: string;
  postal_code: string;
  budget_min?: number;
  budget_max?: number;
  created_at: string;
  client_id: string;
  desired_start_date?: string;
  desired_deadline?: string;
}

interface MatchedProfessional {
  id: string;
  user_id: string;
  company_name: string;
  full_name?: string;
  email?: string;
  phone?: string;
}

export default function ProjectDetailPage() {
  return (
    <ClientGuard>
      <ProjectDetailContent />
    </ClientGuard>
  );
}

function ProjectDetailContent() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [professional, setProfessional] = useState<MatchedProfessional | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [escrowEnabled, setEscrowEnabled] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    loadProjectData();
  }, [id, user]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger le projet
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .eq('client_id', user!.id)
        .single();

      if (projectError) {
        console.error('Erreur chargement projet:', projectError);
        setError('Projet non trouvé');
        return;
      }

      setProject(projectData);
      
      // Vérifier si le séquestre est activé
      setEscrowEnabled(projectData.escrow_enabled || false);

      // Charger le professionnel matché (s'il existe)
      const { data: interestData } = await supabase
        .from('project_interests')
        .select(`
          professional_id,
          professionals (
            id,
            user_id,
            company_name,
            user:user_id (
              full_name,
              email,
              phone
            )
          )
        `)
        .eq('project_id', id)
        .eq('status', 'accepted')
        .single();

      if (interestData && interestData.professionals) {
        const prof = interestData.professionals as any;
        setProfessional({
          id: prof.id,
          user_id: prof.user_id,
          company_name: prof.company_name,
          full_name: prof.user?.full_name,
          email: prof.user?.email,
          phone: prof.user?.phone,
        });
      }
    } catch (err) {
      console.error('Erreur chargement données:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error || 'Projet non trouvé'}</p>
            <Button onClick={() => router.push('/particulier/dashboard-enhanced')}>
              Retour au dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`${project.title} - Détails du projet`}
        description={`Suivi de l'avancement de votre projet ${project.title}`}
      />

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* En-tête */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push('/particulier/dashboard-enhanced')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au dashboard
            </Button>

            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
                <p className="text-gray-600 mt-2">{project.description}</p>
              </div>
              <Badge variant="outline" className="text-lg px-4 py-2">
                {project.status}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Colonne principale */}
            <div className="lg:col-span-2 space-y-6">
              {/* Timeline des jalons */}
              <ProjectMilestonesTimeline
                projectId={project.id}
                projectClientId={project.client_id}
                professionalUserId={professional?.user_id}
                escrowEnabled={escrowEnabled}
                onMilestoneUpdate={loadProjectData}
              />
            </div>

            {/* Colonne latérale */}
            <div className="space-y-6">
              {/* Informations du projet */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations du projet</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Localisation</p>
                      <p className="text-sm text-gray-600">
                        {project.city}, {project.postal_code}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <FileText className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Catégorie</p>
                      <p className="text-sm text-gray-600">{project.category}</p>
                    </div>
                  </div>

                  {(project.budget_min || project.budget_max) && (
                    <div className="flex items-start">
                      <Euro className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Budget</p>
                        <p className="text-sm text-gray-600">
                          {project.budget_min && project.budget_max
                            ? `${project.budget_min}€ - ${project.budget_max}€`
                            : project.budget_min
                            ? `À partir de ${project.budget_min}€`
                            : `Jusqu'à ${project.budget_max}€`}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Créé le</p>
                      <p className="text-sm text-gray-600">
                        {new Date(project.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  {project.desired_start_date && (
                    <div className="flex items-start">
                      <Calendar className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Début souhaité</p>
                        <p className="text-sm text-gray-600">
                          {new Date(project.desired_start_date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Professionnel matché */}
              {professional && (
                <Card>
                  <CardHeader>
                    <CardTitle>Artisan assigné</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start">
                      <User className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {professional.company_name}
                        </p>
                        {professional.full_name && (
                          <p className="text-sm text-gray-600">{professional.full_name}</p>
                        )}
                      </div>
                    </div>

                    {professional.email && (
                      <div>
                        <p className="text-sm font-medium text-gray-900">Email</p>
                        <p className="text-sm text-gray-600">{professional.email}</p>
                      </div>
                    )}

                    {professional.phone && (
                      <div>
                        <p className="text-sm font-medium text-gray-900">Téléphone</p>
                        <p className="text-sm text-gray-600">{professional.phone}</p>
                      </div>
                    )}

                    <Button
                      className="w-full"
                      onClick={() => router.push(`/particulier/particulier-messages?project=${project.id}`)}
                    >
                      Envoyer un message
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Actions rapides */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push(`/particulier/projects/${project.id}/edit`)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Modifier le projet
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push('/particulier/particulier-messages')}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Voir les messages
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
