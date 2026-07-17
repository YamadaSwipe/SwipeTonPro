import { SEO } from '@/components/SEO';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ArrowLeft, Check, X, User, MapPin, Star, Award } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type ProjectInterest =
  Database['public']['Tables']['project_interests']['Row'] & {
    professionals: {
      company_name: string;
      description: string | null;
      specialties: string[] | null;
      experience_years: number | null;
      rating_average: number | null;
      rating_count: number | null;
      city: string | null;
      has_rge: boolean | null;
      has_qualibat: boolean | null;
      has_qualipac: boolean | null;
      status: string | null;
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
  const [selectedProfessional, setSelectedProfessional] =
    useState<ProjectInterest | null>(null);

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
            company_name,
            description,
            specialties,
            experience_years,
            rating_average,
            rating_count,
            city,
            has_rge,
            has_qualibat,
            has_qualipac,
            status
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
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const response = await fetch('/api/update-interest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ interest_id: interestId, action: 'accepted' }),
      });
      if (!response.ok) throw new Error('Erreur API');
      await loadProjectAndInterests();
    } catch (err: any) {
      console.error('Error accepting:', err);
      alert("Erreur lors de l'acceptation");
    } finally {
      setUpdating(null);
    }
  };

  const handleReject = async (interestId: string) => {
    console.log('handleReject called with interestId:', interestId);
    try {
      setUpdating(interestId);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const response = await fetch('/api/update-interest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ interest_id: interestId, action: 'rejected' }),
      });
      if (!response.ok) throw new Error('Erreur API');
      await loadProjectAndInterests();
    } catch (err: any) {
      console.error('Error rejecting:', err);
      alert('Erreur lors du refus');
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
            Accepté (legacy)
          </Badge>
        );
      case 'payment_pending':
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-500/15 text-yellow-300 border-yellow-500/30"
          >
            Paiement en attente
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

  const renderProfessionalModal = () => {
    if (!selectedProfessional) return null;

    const prof = selectedProfessional.professionals;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">
                Profil du professionnel
              </CardTitle>
              <Button
                variant="ghost"
                onClick={() => setSelectedProfessional(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {prof.company_name}
              </h3>
              {prof.description && (
                <p className="text-slate-400">{prof.description}</p>
              )}
            </div>

            {prof.city && (
              <div className="flex items-center gap-2 text-slate-400">
                <MapPin className="w-4 h-4" />
                <span>{prof.city}</span>
              </div>
            )}

            {prof.rating_average && (
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">
                  {prof.rating_average.toFixed(1)}
                </span>
                {prof.rating_count && (
                  <span className="text-slate-400">
                    ({prof.rating_count} avis)
                  </span>
                )}
              </div>
            )}

            {prof.experience_years && (
              <div className="flex items-center gap-2 text-slate-400">
                <Award className="w-4 h-4" />
                <span>{prof.experience_years} ans d'expérience</span>
              </div>
            )}

            {prof.specialties && prof.specialties.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Spécialités</h4>
                <div className="flex flex-wrap gap-2">
                  {prof.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="font-semibold mb-2">Certifications</h4>
              <div className="flex flex-wrap gap-2">
                {prof.has_rge && (
                  <Badge
                    variant="secondary"
                    className="bg-blue-500/15 text-blue-400 border-blue-500/30"
                  >
                    RGE
                  </Badge>
                )}
                {prof.has_qualibat && (
                  <Badge
                    variant="secondary"
                    className="bg-green-500/15 text-green-400 border-green-500/30"
                  >
                    Qualibat
                  </Badge>
                )}
                {prof.has_qualipac && (
                  <Badge
                    variant="secondary"
                    className="bg-purple-500/15 text-purple-400 border-purple-500/30"
                  >
                    Qualipac
                  </Badge>
                )}
                {!prof.has_rge && !prof.has_qualibat && !prof.has_qualipac && (
                  <span className="text-slate-400">Aucune certification</span>
                )}
              </div>
            </div>

            {prof.status && (
              <div>
                <h4 className="font-semibold mb-2">Statut</h4>
                <Badge variant="secondary">{prof.status}</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
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
      {renderProfessionalModal()}
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
                      <Button
                        onClick={() => setSelectedProfessional(interest)}
                        variant="outline"
                        className="border-slate-600 text-slate-300 hover:bg-slate-800"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Voir le profil
                      </Button>
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
