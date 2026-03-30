import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star, X, MessageSquare, CheckCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Project = Database["public"]["Tables"]["projects"]["Row"];
type Professional = Database["public"]["Tables"]["professionals"]["Row"];

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  professional: Professional;
  onSuccess: () => void;
}

export function RatingModal({ isOpen, onClose, project, professional, onSuccess }: RatingModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { toast } = useToast();

  // Empêcher la fermeture si non noté
  const handleAttemptClose = () => {
    if (rating === 0 || comment.trim().length < 10) {
      toast({
        title: "Obligatoire",
        description: "Veuillez noter le professionnel et laisser un commentaire avant de continuer.",
        variant: "destructive",
      });
      return;
    }
    onClose();
  };

  const handleSubmit = async () => {
    if (rating === 0 || comment.trim().length < 10) {
      toast({
        title: "Champs requis",
        description: "Veuillez noter le professionnel (1-5 étoiles) et laisser un commentaire d'au moins 10 caractères.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Créer l'avis
      const { error: reviewError } = await supabase
        .from("reviews")
        .insert({
          project_id: project.id,
          professional_id: professional.id,
          client_id: project.client_id,
          rating: rating,
          comment: comment.trim(),
          is_verified: true, // Lié à un projet réel
        });

      if (reviewError) throw reviewError;

      // Envoyer une notification au support pour validation
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          title: "Nouvel avis à valider",
          message: `Avis pour ${professional.company_name} - Projet: ${project.title}`,
          type: "review_pending",
          data: {
            review: {
              project_id: project.id,
              professional_id: professional.id,
              rating: rating,
              comment: comment.trim(),
            }
          }
        });

      if (notificationError) throw notificationError;

      // Notifier le professionnel
      await supabase
        .from("notifications")
        .insert({
          user_id: professional.user_id,
          title: "Nouvel avis reçu",
          message: `Vous avez reçu un avis de ${rating}/5 étoiles pour le projet ${project.title}`,
          type: "new_review",
          data: {
            project_id: project.id,
            rating: rating,
          }
        });

      toast({
        title: "Avis envoyé !",
        description: "Votre avis a été soumis au support pour validation.",
      });

      onSuccess();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer votre avis. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Empêcher la fermeture avec ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        handleAttemptClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      // Empêcher le scroll du body
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, rating, comment]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleAttemptClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Évaluer votre expérience</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAttemptClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Infos projet et pro */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900">{project.title}</h4>
            <p className="text-sm text-gray-600 mt-1">
              Professionnel : {professional.company_name}
            </p>
          </div>

          {/* Message obligatoire */}
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Évaluation obligatoire
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Ce projet est marqué comme terminé. Votre évaluation est requise avant de continuer.
                </p>
              </div>
            </div>
          </div>

          {/* Notation par étoiles */}
          <div>
            <label className="block text-sm font-medium mb-3">
              Note globale <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="focus:outline-none transition-all transform hover:scale-110"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`h-8 w-8 ${
                      (hoverRating || rating) >= star
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center mt-2 text-sm text-gray-600">
                Note : {rating}/5 étoiles
              </p>
            )}
          </div>

          {/* Commentaire */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Votre commentaire <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Décrivez votre expérience avec ce professionnel..."
              className="min-h-[120px]"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/500 caractères (minimum 10 caractères)
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleAttemptClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Plus tard
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0 || comment.trim().length < 10}
              className="flex-1"
            >
              {isSubmitting ? "Envoi..." : "Envoyer l'avis"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
