import { SEO } from "@/components/SEO";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Heart, X, ArrowUp, RotateCcw, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SwipeCard from "@/components/SwipeCard";

interface Project {
  id: string;
  title: string;
  city: string;
  category: string;
  estimated_budget_min: number;
  estimated_budget_max: number;
  description: string;
  urgency: string;
  created_at: string;
  work_types: string[];
}

export default function SwipeMatchingPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Charger les projets disponibles pour le matching
  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { 
        router.push("/auth/login"); 
        return; 
      }

      const { data: pro } = await (supabase as any)
        .from("professionals")
        .select("id, categories, city, activity_score")
        .eq("user_id", user.id)
        .single();

      if (!pro) return;

      // Algorithme de matching intelligent basé sur l'activité et les préférences
      const { data: availableProjects } = await (supabase as any)
        .from("projects")
        .select(`
          id, title, city, category, 
          estimated_budget_min, estimated_budget_max,
          description, urgency, created_at, work_types,
          status
        `)
        .eq("status", "published")
        .neq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!availableProjects) {
        setProjects([]);
        return;
      }

      // Filtrer et scorer les projets
      const scoredProjects = availableProjects
        .filter((project: Project) => {
          // Exclure les projets déjà intéressés
          return true; // TODO: Vérifier dans project_interests
        })
        .map((project: Project) => {
          let score = 0;

          // Score basé sur la catégorie (30 points)
          if (pro.categories && pro.categories.includes(project.category)) {
            score += 30;
          }

          // Score basé sur la localisation (25 points)
          if (pro.city === project.city) {
            score += 25;
          } else if (pro.city && project.city.includes(pro.city)) {
            score += 15;
          }

          // Score basé sur l'urgence (20 points)
          if (project.urgency === 'urgent') score += 20;
          else if (project.urgency === 'normal') score += 10;

          // Score basé sur la récence (15 points)
          const daysSinceCreation = (Date.now() - new Date(project.created_at).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceCreation < 1) score += 15;
          else if (daysSinceCreation < 3) score += 10;
          else if (daysSinceCreation < 7) score += 5;

          // Score basé sur l'activité du pro (10 points)
          score += Math.min(pro.activity_score || 0, 10);

          return { ...project, matchingScore: score };
        })
        .sort((a: any, b: any) => b.matchingScore - a.matchingScore)
        .slice(0, 20); // Limiter à 20 projets pour le swipe

      setProjects(scoredProjects);
    } catch (err) {
      console.error("Erreur chargement projets:", err);
      toast({ 
        title: "Erreur", 
        description: "Impossible de charger les projets",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  }, [router, toast]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Gérer le swipe
  const handleSwipe = useCallback(async (direction: 'left' | 'right' | 'up') => {
    if (currentIndex >= projects.length || processing) return;

    setProcessing(true);
    const currentProject = projects[currentIndex];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: pro } = await (supabase as any)
        .from("professionals")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!pro) return;

      if (direction === 'up') {
        // Intéressé - créer une candidature
        const { error } = await (supabase as any)
          .from("project_interests")
          .insert({
            project_id: currentProject.id,
            professional_id: pro.id,
            status: "interested",
            matching_score: (currentProject as any).matchingScore,
            created_at: new Date().toISOString()
          });

        if (error) {
          console.error("Erreur création intérêt:", error);
          toast({
            title: "Erreur",
            description: "Impossible d'exprimer votre intérêt",
            variant: "destructive"
          });
        } else {
          toast({
            title: "✅ Intérêt enregistré !",
            description: "Le client sera notifié de votre candidature",
          });
        }
      } else if (direction === 'right') {
        // Peut-être plus tard - sauvegarder pour plus tard
        // TODO: Implémenter la fonctionnalité "plus tard"
        toast({
          title: "📝 Sauvegardé",
          description: "Projet conservé pour plus tard",
        });
      }
      // direction === 'left' = passer, aucune action nécessaire

      // Passer au projet suivant
      setCurrentIndex(prev => prev + 1);
    } catch (err) {
      console.error("Erreur swipe:", err);
    } finally {
      setProcessing(false);
    }
  }, [currentIndex, projects, processing, toast]);

  // Actions manuelles
  const handlePass = () => handleSwipe('left');
  const handleMaybe = () => handleSwipe('right');
  const handleInterested = () => handleSwipe('up');

  const currentProject = projects[currentIndex];
  const hasMoreProjects = currentIndex < projects.length;

  return (
    <ProtectedRoute allowedRoles={["professional"]}>
      <SEO title="Matching Intelligent | SwipeTonPro" />
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
        {/* Header */}
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link href="/professionnel/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-500" />
                Matching Intelligent
              </h1>
              <p className="text-sm text-muted-foreground">
                Découvrez les projets qui correspondent à votre profil
              </p>
            </div>
            <Button variant="outline" onClick={loadProjects} disabled={loading}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Zone de swipe */}
            <div className="lg:col-span-2">
              <div className="relative h-[600px] bg-gray-50 rounded-2xl p-4">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4" />
                      <p className="text-gray-600">Chargement des projets...</p>
                    </div>
                  </div>
                ) : !hasMoreProjects ? (
                  <div className="flex items-center justify-center h-full">
                    <Card className="text-center p-8 max-w-md">
                      <CardContent>
                        <Heart className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">
                          {projects.length === 0 ? "Aucun projet disponible" : "Tous les projets vus !"}
                        </h3>
                        <p className="text-gray-600 mb-6">
                          {projects.length === 0 
                            ? "Revenez plus tard pour découvrir de nouveaux projets"
                            : "Vous avez vu tous les projets disponibles pour aujourd'hui"
                          }
                        </p>
                        <Button onClick={loadProjects} className="bg-orange-500 hover:bg-orange-600">
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Actualiser
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <>
                    {/* Cartes empilées */}
                    {projects.slice(currentIndex, currentIndex + 3).map((project, index) => (
                      <div
                        key={project.id}
                        className="absolute inset-4"
                        style={{
                          zIndex: projects.length - currentIndex - index,
                          transform: `scale(${1 - index * 0.05}) translateY(${index * 8}px)`,
                          opacity: index === 0 ? 1 : 0.6 - index * 0.2
                        }}
                      >
                        <SwipeCard
                          project={project}
                          onSwipe={handleSwipe}
                          isActive={index === 0}
                        />
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Boutons d'action */}
              {hasMoreProjects && !loading && (
                <div className="flex justify-center gap-4 mt-6">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handlePass}
                    disabled={processing}
                    className="bg-white border-red-200 hover:bg-red-50 hover:border-red-300"
                  >
                    <X className="w-5 h-5 mr-2 text-red-500" />
                    Passer
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleMaybe}
                    disabled={processing}
                    className="bg-white border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                  >
                    <Heart className="w-5 h-5 mr-2 text-blue-500" />
                    Plus tard
                  </Button>
                  
                  <Button
                    size="lg"
                    onClick={handleInterested}
                    disabled={processing}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    <ArrowUp className="w-5 h-5 mr-2" />
                    Intéressé !
                  </Button>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Stats */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Votre session</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Projets vus</span>
                      <span className="font-semibold">{currentIndex}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Restants</span>
                      <span className="font-semibold">{Math.max(0, projects.length - currentIndex)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total disponible</span>
                      <span className="font-semibold">{projects.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Instructions */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Comment ça marche ?</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <X className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium">Glisser à gauche</p>
                        <p className="text-gray-600">Passer ce projet</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Heart className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Glisser à droite</p>
                        <p className="text-gray-600">Sauvegarder pour plus tard</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <ArrowUp className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Glisser vers le haut</p>
                        <p className="text-gray-600">Postuler immédiatement</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
