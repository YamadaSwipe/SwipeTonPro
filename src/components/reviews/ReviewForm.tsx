import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createReview } from "@/services/reviewService";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const reviewSchema = z.object({
  rating: z.number().min(1, "Une note est requise").max(5),
  comment: z.string().min(10, "Le commentaire doit faire au moins 10 caractères").max(500),
});

interface ReviewFormProps {
  projectId: string;
  professionalId: string;
  clientId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ReviewForm({ projectId, professionalId, clientId, onSuccess, onCancel }: ReviewFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof reviewSchema>) => {
    setIsSubmitting(true);
    try {
      await createReview({
        project_id: projectId,
        professional_id: professionalId,
        client_id: clientId,
        rating: values.rating,
        comment: values.comment,
        is_verified: true, // Verified because linked to a project
      });

      toast({
        title: "Avis publié !",
        description: "Merci pour votre retour.",
      });
      onSuccess();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Erreur",
        description: "Impossible de publier l'avis.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note globale</FormLabel>
              <FormControl>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="focus:outline-none transition-colors"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => field.onChange(star)}
                    >
                      <Star
                        className={cn(
                          "w-8 h-8",
                          (hoverRating || field.value) >= star
                            ? "fill-warning text-warning"
                            : "text-gray-300"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Votre avis</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Décrivez votre expérience avec ce professionnel..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting} className="gradient-primary text-white">
            {isSubmitting ? "Publication..." : "Publier mon avis"}
          </Button>
        </div>
      </form>
    </Form>
  );
}