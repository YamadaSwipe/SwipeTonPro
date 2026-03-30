import { useEffect, useState } from "react";
import { matchingService } from "@/services/matchingService";
import { ProfessionalCard } from "./ProfessionalCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfessionalRecommendationsProps {
  projectId: string;
  onSelectProfessional: (proId: string) => void;
}

export function ProfessionalRecommendations({ projectId, onSelectProfessional }: ProfessionalRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRecommendations() {
      try {
        setLoading(true);
        const { data, error } = await matchingService.getMatchingProfessionals(projectId);
        
        if (error) throw error;
        setRecommendations(data || []);
      } catch (err) {
        console.error("Error loading recommendations:", err);
        setError("Impossible de charger les recommandations pour le moment.");
      } finally {
        setLoading(false);
      }
    }

    if (projectId) {
      loadRecommendations();
    }
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Recherche des meilleurs artisans pour votre projet...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Alert className="bg-muted border-dashed">
        <AlertTitle>Aucune recommandation directe</AlertTitle>
        <AlertDescription>
          Nous n'avons pas trouvé de professionnel correspondant exactement à 100% à vos critères pour l'instant. 
          Votre projet a tout de même été publié et visible par notre réseau.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-primary/10 rounded-full">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Artisans recommandés</h3>
          <p className="text-sm text-muted-foreground">Sélectionnés par notre IA selon vos critères</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((pro) => (
          <ProfessionalCard
            key={pro.id}
            professional={pro}
            matchScore={pro.match_score}
            onContact={() => onSelectProfessional(pro.id)}
            onViewProfile={() => console.log("View profile", pro.id)}
          />
        ))}
      </div>
      
      <div className="text-center mt-6">
        <Button variant="link" className="text-muted-foreground">
          Voir plus de professionnels
        </Button>
      </div>
    </div>
  );
}