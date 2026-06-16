/**
 * @fileoverview Page de détail d'un projet pour le professionnel
 * @description Affiche les détails du projet avec le suivi des jalons
 * @author Senior Architect
 * @version 1.0.0
 */

import { SEO } from '@/components/SEO';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProfessionalGuard } from '@/components/auth/RoleGuard';
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

interface Client {
  id: string;
  full_name?: string;
  email?: string;
  phone?: string;
}

export default function ProfessionalProjectDetailPage() {
  return (
    <ProfessionalGuard>
      <ProfessionalProjectDetailContent />
    </ProfessionalGuard>
  );
}

function ProfessionalProjectDetailContent() {
  const router = useRouter();
  const { id } = router.query;
  const { user, professional } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !user || !professional) return;
    loadProjectData();
  }, [id, user, professional]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Vérifier que le professionnel a accès à ce projet
      const { data: interestData, error: interestError } = await supabase
        .from('project_interests')
        .select('*')
        .eq('project_id', id)
        .eq('professional_id', professional!.id)
        .eq('status', 'accepted')
        .single();

      if (interestError || !interestData) {
        console.error('Erreur accès projet:', interestError);
        setError('Vous n\'avez pas accès à ce projet');
        return;
      }

      // Charger le projet
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (projectError) {
        console.error('Erreur chargement projet:', projectError);
        setError('Projet non trouvé');
        return;
      }

      setProject(projectData);

      // Charger les informations du client
      const { data: clientData } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone')
        .eq('id', projectData.client_id)
        .single();

      if (clientData) {
        setClient(clientData);
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
            <Button onClick={() => router.push('/professionnel/dashboard')}>
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
        description={`Suivi de l'avancement du projet ${project.title}`}
      />

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* En-tête */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push('/professionnel/dashboard')}
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
                professionalUserId={user!.id}
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

              {/* Informations du client */}
              {client && (
                <Card>
                  <CardHeader>
                    <CardTitle>Client</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start">
                      <User className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {client.full_name || 'Client'}
                        </p>
                      </div>
                    </div>

                    {client.email && (
                      <div>
                        <p className="text-sm font-medium text-gray-900">Email</p>
                        <p className="text-sm text-gray-600">{client.email}</p>
                      </div>
                    )}

                    {client.phone && (
                      <div>
                        <p className="text-sm font-medium text-gray-900">Téléphone</p>
                        <p className="text-sm text-gray-600">{client.phone}</p>
                      </div>
                    )}

                    <Button
                      className="w-full"
                      onClick={() => router.push(`/professionnel/messages?project=${project.id}`)}
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
                    onClick={() => router.push('/professionnel/messages')}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Voir les messages
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push('/professionnel/dashboard')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Mes projets
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
