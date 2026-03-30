import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, ThumbsUp, MessageSquare } from "lucide-react";
import { addProfessionalResponse, markReviewHelpful, removeReviewHelpful } from "@/services/reviewService";

interface Review {
  id: string;
  rating: number;
  comment: string;
  professional_response: string | null;
  created_at: string;
  helpful_count: number;
  projects: {
    title: string;
    category: string;
  };
}

interface ReviewCardProps {
  review: Review;
  isProfessional?: boolean;
  professionalId?: string;
  userId?: string;
  hasMarkedHelpful?: boolean;
  onUpdate?: () => void;
}

export function ReviewCard({ 
  review, 
  isProfessional = false, 
  professionalId,
  userId,
  hasMarkedHelpful = false,
  onUpdate 
}: ReviewCardProps) {
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [response, setResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHelpful, setIsHelpful] = useState(hasMarkedHelpful);

  async function handleSubmitResponse() {
    if (!response.trim() || !professionalId) return;

    setIsSubmitting(true);
    try {
      await addProfessionalResponse(review.id, response);
      setShowResponseForm(false);
      setResponse("");
      onUpdate?.();
    } catch (error) {
      console.error("Error submitting response:", error);
      alert("Erreur lors de l'envoi de la réponse");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleHelpful() {
    if (!userId) return;

    try {
      if (isHelpful) {
        await removeReviewHelpful(review.id, userId);
        setIsHelpful(false);
      } else {
        await markReviewHelpful(review.id, userId);
        setIsHelpful(true);
      }
      onUpdate?.();
    } catch (error) {
      console.error("Error toggling helpful:", error);
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        {/* Rating & Date */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= review.rating
                      ? "fill-warning-yellow text-warning-yellow"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {new Date(review.created_at).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric"
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold">{review.projects.title}</p>
            <p className="text-sm text-muted-foreground">{review.projects.category}</p>
          </div>
        </div>

        {/* Comment */}
        <p className="text-sm leading-relaxed mb-4">{review.comment}</p>

        {/* Professional Response */}
        {review.professional_response && (
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-construction-orange" />
              <span className="text-sm font-semibold">Réponse du professionnel</span>
            </div>
            <p className="text-sm">{review.professional_response}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleHelpful}
            disabled={!userId}
            className={isHelpful ? "text-construction-orange" : ""}
          >
            <ThumbsUp className="mr-2 h-4 w-4" />
            Utile ({review.helpful_count || 0})
          </Button>

          {isProfessional && !review.professional_response && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResponseForm(!showResponseForm)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Répondre
            </Button>
          )}
        </div>

        {/* Response Form */}
        {showResponseForm && (
          <div className="mt-4 pt-4 border-t">
            <Textarea
              placeholder="Écrivez votre réponse..."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              className="mb-2"
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSubmitResponse}
                disabled={isSubmitting || !response.trim()}
                size="sm"
              >
                {isSubmitting ? "Envoi..." : "Publier"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowResponseForm(false);
                  setResponse("");
                }}
              >
                Annuler
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}