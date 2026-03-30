import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, TrendingUp, Eye, CheckCircle } from "lucide-react";
import Link from "next/link";
import Image from 'next/image';
import type { Database } from "@/integrations/supabase/types";
import { bidService } from "@/services/bidService";
import { useState } from "react";
import { matchingService } from "@/services/matchingService-v2";
import { useToast } from "@/hooks/use-toast";

type Project = Database["public"]["Tables"]["projects"]["Row"] & {
  has_bid?: boolean;
  ai_analysis?: any; // Add AI analysis field
};

interface ProjectCardProps {
  project: Project;
  onBidSubmitted?: () => void;
  onApply?: (projectId: string) => Promise<void>;
}

export function ProjectCard({ project, onBidSubmitted, onApply }: ProjectCardProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSignalInterest = async () => {
    setLoading(true);
    try {
      const { error } = await matchingService.signalInterest(project.id);
      
      if (error) throw error;

      toast({
        title: "Intérêt signalé !",
        description: "Le client a été notifié de votre intérêt.",
      });

      if (onBidSubmitted) onBidSubmitted();
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de signaler votre intérêt. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatBudget = (min?: number | null, max?: number | null) => {
    if (!min && !max) return "Budget à définir";
    if (min && max) return `${min}€ - ${max}€`;
    if (min) return `À partir de ${min}€`;
    return `Jusqu'à ${max}€`;
  };

  const getUrgencyBadge = (urgency: string | null) => {
    const u = urgency || "low";
    const colors = {
      low: "bg-success/10 text-success border-success/20",
      medium: "bg-warning/10 text-warning border-warning/20",
      high: "bg-error/10 text-error border-error/20"
    };
    return colors[u as keyof typeof colors] || colors.low;
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-2 line-clamp-2">{project.title}</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={getUrgencyBadge(project.urgency)}>
                {project.urgency === "high" ? "Urgent" : project.urgency === "medium" ? "Sous 1 mois" : "Flexible"}
              </Badge>
              {project.category && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  {project.category}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-text-secondary line-clamp-3">{project.description}</p>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-accent flex-shrink-0" />
            <span className="text-text-secondary truncate">{project.city}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-text-secondary">
              {new Date(project.created_at).toLocaleDateString("fr-FR")}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-success flex-shrink-0" />
            <span className="font-semibold text-success">
              {formatBudget(project.estimated_budget_min, project.estimated_budget_max)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Eye className="w-4 h-4 text-text-muted flex-shrink-0" />
            <span className="text-text-secondary">{project.bids_count || 0} candidature(s)</span>
          </div>
        </div>

        {/* AI Analysis Section */}
        {project.ai_analysis && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-text-secondary font-medium mb-1">🤖 Estimation IA</p>
            <div className="text-xs text-text-secondary space-y-1">
              {typeof project.ai_analysis === 'object' ? (
                <>
                  {(project.ai_analysis as any)?.estimated_cost && (
                    <p>Coût estimé: {(project.ai_analysis as any).estimated_cost}€</p>
                  )}
                  {(project.ai_analysis as any)?.duration_days && (
                    <p>Durée: {(project.ai_analysis as any).duration_days} jours</p>
                  )}
                  {(project.ai_analysis as any)?.complexity && (
                    <p>Complexité: {(project.ai_analysis as any).complexity}</p>
                  )}
                  {(project.ai_analysis as any)?.recommended_professions && (
                    <p>Professions: {Array.isArray((project.ai_analysis as any).recommended_professions) ? (project.ai_analysis as any).recommended_professions.join(', ') : (project.ai_analysis as any).recommended_professions}</p>
                  )}
                  {(project.ai_analysis as any)?.materials_needed && (
                    <p>Matériaux: {Array.isArray((project.ai_analysis as any).materials_needed) ? (project.ai_analysis as any).materials_needed.join(', ') : (project.ai_analysis as any).materials_needed}</p>
                  )}
                </>
              ) : (
                <p className="whitespace-pre-wrap">{project.ai_analysis}</p>
              )}
            </div>
            <p className="text-xs text-text-muted italic mt-1">
              * À titre indicatif, ne peut être prise pour valeur contractuelle
            </p>
          </div>
        )}

        {project.photos && Array.isArray(project.photos) && project.photos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {project.photos.slice(0, 3).map((img, idx) => (
              <Image
                key={idx}
                src={img as string}
                alt={`Image ${idx + 1}`}
                className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
              />
            ))}
            {project.photos.length > 3 && (
              <div className="w-20 h-20 bg-surface-elevated rounded-lg flex items-center justify-center text-sm text-text-muted flex-shrink-0">
                +{project.photos.length - 3}
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-2">
        <div className="flex gap-2 w-full">
          <Button variant="outline" className="flex-1">
            Détails
          </Button>
          {!project.has_bid && (
            <Button 
              className="flex-1 gradient-primary text-white"
              onClick={handleSignalInterest}
              disabled={loading}
            >
              {loading ? "Envoi..." : "Ça m'intéresse"}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}