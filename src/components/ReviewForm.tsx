'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Star, Send, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import StarRating from './StarRating';

interface ReviewFormProps {
  professionalId: string;
  projectId: string;
  professionalName: string;
  onReviewSubmitted?: () => void;
  onCancel?: () => void;
}

export default function ReviewForm({
  professionalId,
  projectId,
  professionalName,
  onReviewSubmitted,
  onCancel
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast({
        title: "Veuillez noter le professionnel",
        description: "La sélection d'une note est obligatoire",
        variant: "destructive"
      });
      return;
    }

    if (comment.trim().length < 10) {
      toast({
        title: "Commentaire trop court",
        description: "Veuillez laisser un commentaire d'au moins 10 caractères",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/reviews/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          professional_id: professionalId,
          project_id: projectId,
          rating,
          comment: comment.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la soumission');
      }

      toast({
        title: "✅ Avis publié !",
        description: "Merci d'avoir partagé votre expérience",
      });

      // Réinitialiser le formulaire
      setRating(0);
      setComment('');
      
      onReviewSubmitted?.();

    } catch (error: any) {
      console.error('Erreur soumission avis:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de publier votre avis",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 1: return "Très déçu";
      case 2: return "Déçu";
      case 3: return "Correct";
      case 4: return "Satisfait";
      case 5: return "Très satisfait";
      default: return "";
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          Noter le professionnel
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Partagez votre expérience avec <strong>{professionalName}</strong>
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Note */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Note globale</label>
            <div className="flex flex-col items-center space-y-2">
              <StarRating
                rating={rating}
                onChange={setRating}
                size="lg"
                showValue
              />
              {rating > 0 && (
                <p className="text-sm font-medium text-gray-600">
                  {getRatingLabel(rating)}
                </p>
              )}
            </div>
          </div>

          {/* Commentaire */}
          <div className="space-y-2">
            <label htmlFor="comment" className="text-sm font-medium">
              Votre avis détaillé
            </label>
            <Textarea
              id="comment"
              placeholder="Décrivez votre expérience avec ce professionnel... Qualité du travail, ponctualité, communication, etc."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={1000}
              className="resize-none"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Minimum 10 caractères</span>
              <span>{comment.length}/1000</span>
            </div>
          </div>

          {/* Alertes */}
          {rating <= 2 && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-700">
                Une note basse sera visible sur le profil du professionnel et affectera sa réputation.
              </AlertDescription>
            </Alert>
          )}

          {/* Boutons d'action */}
          <div className="flex gap-3 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={submitting}
                className="flex-1"
              >
                Annuler
              </Button>
            )}
            
            <Button
              type="submit"
              disabled={submitting || rating === 0 || comment.trim().length < 10}
              className="flex-1"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Publication...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Publier l'avis
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
