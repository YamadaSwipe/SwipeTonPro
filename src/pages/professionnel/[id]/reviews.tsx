import { SEO } from "@/components/SEO";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare, Calendar, User, Filter, ArrowLeft } from "lucide-react";
import Link from "next/link";
import StarRating from "@/components/StarRating";
import { ProtectedRoute } from "@/components/ProtectedRoute";

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  client: {
    full_name: string;
    avatar_url?: string;
  };
  project: {
    title: string;
    category: string;
  };
}

interface Professional {
  id: string;
  company_name: string;
  average_rating: number;
  total_reviews: number;
}

export default function ProfessionalReviewsPage() {
  const router = useRouter();
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1'>('all');

  const { id } = router.query;

  useEffect(() => {
    if (!id) return;
    loadProfessionalAndReviews();
  }, [id, filter]);

  const loadProfessionalAndReviews = async () => {
    setLoading(true);
    try {
      // Charger les infos du professionnel
      const { data: pro } = await (supabase as any)
        .from('professionals')
        .select('id, company_name, average_rating, total_reviews')
        .eq('id', id)
        .single();

      if (!pro) {
        router.push('/professionnel');
        return;
      }

      setProfessional(pro);

      // Charger les reviews
      let query = (supabase as any)
        .from('reviews')
        .select(`
          id, rating, comment, created_at,
          client:profiles!reviews_client_id_fkey(full_name, avatar_url),
          project:projects!reviews_project_id_fkey(title, category)
        `)
        .eq('professional_id', id)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      // Appliquer le filtre de note
      if (filter !== 'all') {
        query = query.eq('rating', parseInt(filter));
      }

      const { data: reviewsData } = await query;

      setReviews(reviewsData || []);
    } catch (error) {
      console.error('Erreur chargement reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      distribution[review.rating as keyof typeof distribution]++;
    });
    return distribution;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
        </div>
      </ProtectedRoute>
    );
  }

  if (!professional) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="text-center p-8">
            <CardContent>
              <p className="text-lg font-medium mb-4">Professionnel non trouvé</p>
              <Link href="/professionnel">
                <Button>Retour</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  const distribution = getRatingDistribution();
  const totalReviews = reviews.length;

  return (
    <ProtectedRoute>
      <SEO title={`Avis clients - ${professional.company_name} | SwipeTonPro`} />
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link href={`/professionnel/profile/${id}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Avis clients</h1>
              <p className="text-sm text-muted-foreground">
                {professional.company_name} • {totalReviews} avis
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar - Stats */}
            <div className="lg:col-span-1 space-y-6">
              {/* Note globale */}
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="mb-4">
                    <div className="text-4xl font-bold text-gray-900">
                      {professional.average_rating?.toFixed(1) || '0.0'}
                    </div>
                    <StarRating rating={professional.average_rating || 0} size="md" readonly />
                    <p className="text-sm text-gray-600 mt-2">
                      Basé sur {professional.total_reviews || 0} avis
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Distribution des notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Répartition des notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = distribution[rating as keyof typeof distribution];
                    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                    
                    return (
                      <div key={rating} className="flex items-center gap-3">
                        <span className="text-sm font-medium w-8">{rating}</span>
                        <StarRating rating={rating} size="sm" readonly />
                        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-yellow-400 h-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-8 text-right">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Filtres */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Filtrer par note
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                    className="w-full justify-start"
                  >
                    Tous les avis ({totalReviews})
                  </Button>
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = distribution[rating as keyof typeof distribution];
                    return (
                      <Button
                        key={rating}
                        variant={filter === rating.toString() ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter(rating.toString() as any)}
                        className="w-full justify-start"
                      >
                        <StarRating rating={rating} size="sm" readonly />
                        <span className="ml-2">({count})</span>
                      </Button>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Reviews */}
            <div className="lg:col-span-2">
              {reviews.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      {filter === 'all' ? 'Aucun avis pour le moment' : 'Aucun avis avec cette note'}
                    </h3>
                    <p className="text-gray-600">
                      {filter === 'all' 
                        ? 'Soyez le premier à donner votre avis !'
                        : 'Essayez de modifier le filtre pour voir d\'autres avis'
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id} className="transition-shadow hover:shadow-md">
                      <CardContent className="p-6">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {review.client.avatar_url ? (
                              <img
                                src={review.client.avatar_url}
                                alt={review.client.full_name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-gray-500" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{review.client.full_name}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <StarRating rating={review.rating} size="sm" readonly />
                                <span>•</span>
                                <span>{formatDate(review.created_at)}</span>
                              </div>
                            </div>
                          </div>
                          <Badge variant="secondary">
                            {review.project.category}
                          </Badge>
                        </div>

                        {/* Projet */}
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700">
                            Projet : {review.project.title}
                          </p>
                        </div>

                        {/* Commentaire */}
                        <p className="text-gray-700 leading-relaxed">
                          {review.comment}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
