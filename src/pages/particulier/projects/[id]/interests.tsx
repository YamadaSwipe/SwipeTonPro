import { SEO } from '@/components/SEO';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ArrowLeft, Check, X } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type ProjectInterest =
  Database['public']['Tables']['project_interests']['Row'] & {
    professionals: {
      company_name: string;
    };
  };

export default function ProjectInterestsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [interests, setInterests] = useState<ProjectInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadProjectAndInterests();
    }
  }, [id]);

  const loadProjectAndInterests = async () => {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Non authentifié');
        return;
      }

      // Fetch project to verify ownership
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('client_id')
        .eq('id', id)
        .single();

      if (projectError || !project) {
        setError('Projet non trouvé');
        return;
      }

      if (project.client_id !== user.id) {
        setError("Vous n'êtes pas le propriétaire de ce projet");
        return;
      }

      setIsOwner(true);

      // Fetch project_interests with professionals join
      const { data: interestsData, error: interestsError } = await supabase
        .from('project_interests')
        .select(
          `
          *,
          professionals (
            company_name
          )
        `
        )
        .eq('project_id', id);

      if (interestsError) {
        console.error('Error fetching interests:', interestsError);
        setError('Erreur lors du chargement des intérêts');
        return;
      }

      setInterests(interestsData || []);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (interestId: string) => {
    console.log('handleAccept called with interestId:', interestId);
    try {
      setUpdating(interestId);

      const { error } = await supabase
        .from('project_interests')
        .update({ status: 'accepted' })
        .eq('id', interestId);

      if (error) {
        console.error('Error updating status:', error);
        alert('Erreur lors de la mise à jour du statut');
        return;
      }

      // Refresh the list
      await loadProjectAndInterests();
    } catch (err: any) {
      console.error('Error updating status:', err);
      alert('Erreur lors de la mise à jour du statut');
    } finally {
      setUpdating(null);
    }
  };

  const handleReject = async (interestId: string) => {
    console.log('handleReject called with interestId:', interestId);
    try {
      setUpdating(interestId);

      const { error } = await supabase
        .from('project_interests')
        .update({ status: 'rejected' })
        .eq('id', interestId);

      if (error) {
        console.error('Error updating status:', error);
        alert('Erreur lors de la mise à jour du statut');
        return;
      }

      // Refresh the list
      await loadProjectAndInterests();
    } catch (err: any) {
      console.error('Error updating status:', err);
      alert('Erreur lors de la mise à jour du statut');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pre_matched':
        return (
          <Badge
            variant="secondary"
            className="bg-amber-500/15 text-amber-400 border-amber-500/30"
          >
            En attente
          </Badge>
        );
      case 'accepted':
        return (
          <Badge
            variant="secondary"
            className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
          >
            Accepté
          </Badge>
        );
      case 'rejected':
        return (
          <Badge
            variant="secondary"
            className="bg-red-500/15 text-red-400 border-red-500/30"
          >
            Refusé
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => router.back()}>Retour</Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <SEO title="Intérêts du projet" />
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="text-slate-400 hover:text-white mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <h1 className="text-3xl font-bold text-white">
              Professionnels intéressés
            </h1>
            <p className="text-slate-400 mt-2">
              {interests.length} professionnel(s) intéressé(s) par ce projet
            </p>
          </div>

          {interests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-slate-400">
                  Aucun professionnel n'a encore manifesté d'intérêt.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {interests.map((interest) => (
                <Card key={interest.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">
                        {interest.professionals?.company_name ||
                          'Professionnel inconnu'}
                      </CardTitle>
                      {getStatusBadge(interest.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-3">
                      {interest.status === 'pre_matched' && (
                        <>
                          <Button
                            onClick={() => handleAccept(interest.id)}
                            disabled={updating === interest.id}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Accepter
                          </Button>
                          <Button
                            onClick={() => handleReject(interest.id)}
                            disabled={updating === interest.id}
                            variant="destructive"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Refuser
                          </Button>
                        </>
                      )}
                      {updating === interest.id && (
                        <span className="text-slate-400 text-sm">
                          Mise à jour...
                        </span>
                      )}
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
