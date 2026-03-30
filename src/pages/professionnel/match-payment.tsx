import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { supabase } from "@/integrations/supabase/client";
import {
  createMatchPaymentIntent,
  confirmMatchPayment,
  checkPaymentStatus,
  getMatchPriceForBudget,
  MatchPricing,
} from "@/services/matchPaymentService";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Euro,
  MapPin,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

// ============================================
// FORMULAIRE DE PAIEMENT
// ============================================
function CheckoutForm({
  projectId,
  professionalId,
  pricing,
  onSuccess,
}: {
  projectId: string;
  professionalId: string;
  pricing: MatchPricing;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Confirmer le paiement Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/professionnel/dashboard?payment_success=true`,
        },
        redirect: "if_required",
      });

      if (stripeError) {
        setError(stripeError.message || "Erreur lors du paiement");
        return;
      }

      // 2. Confirmer le match + envoyer les notifications
      if (paymentIntent?.id) {
        const result = await confirmMatchPayment(
          professionalId,
          projectId,
          paymentIntent.id
        );

        if (result.success) {
          onSuccess();
        } else {
          setError(result.message);
        }
      } else {
        onSuccess();
      }
    } catch (err) {
      setError("Une erreur est survenue lors du paiement");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        disabled={!stripe || loading}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Traitement en cours...
          </>
        ) : (
          `Confirmer le paiement — ${pricing.price_euros.toFixed(2)}€`
        )}
      </Button>
    </form>
  );
}

// ============================================
// PAGE PRINCIPALE
// ============================================
export default function MatchPaymentPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [projectId, setProjectId] = useState<string | null>(null);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [project, setProject] = useState<any>(null);
  const [pricing, setPricing] = useState<MatchPricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [alreadyPaid, setAlreadyPaid] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;

    const { project_id, professional_id } = router.query;

    if (!project_id || !professional_id) {
      toast({
        title: "Erreur",
        description: "Paramètres manquants",
        variant: "destructive",
      });
      router.push("/professionnel/browse-projects");
      return;
    }

    const projId = Array.isArray(project_id) ? project_id[0] : project_id;
    const profId = Array.isArray(professional_id)
      ? professional_id[0]
      : professional_id;

    setProjectId(projId);
    setProfessionalId(profId);
    initializePage(projId, profId);
  }, [router.isReady]);

  async function initializePage(projId: string, profId: string) {
    try {
      // 1. Vérifier si déjà payé
      const { hasPaid } = await checkPaymentStatus(profId, projId);
      if (hasPaid) {
        setAlreadyPaid(true);
        setTimeout(() => router.push("/professionnel/dashboard"), 2000);
        return;
      }

      // 2. Récupérer les infos du projet
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("id, title, city, category, budget_max, budget_min")
        .eq("id", projId)
        .single();

      if (projectError || !projectData) {
        setError("Projet introuvable");
        setLoading(false);
        return;
      }
      setProject(projectData);

      // 3. Calculer le prix selon le budget du projet
      const budget = projectData.budget_max || projectData.budget_min || 0;
      const matchPricing = await getMatchPriceForBudget(budget);
      setPricing(matchPricing);

      // 4. Créer le Payment Intent avec le bon prix
      const { clientSecret: secret } = await createMatchPaymentIntent(
        profId,
        projId
      );
      setClientSecret(secret);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Impossible d'initialiser le paiement");
    } finally {
      setLoading(false);
    }
  }

  const handleSuccess = () => {
    setPaymentSuccess(true);
    setTimeout(() => {
      router.push("/professionnel/dashboard?payment_success=true");
    }, 2500);
  };

  // ---- États d'affichage ----

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Préparation du paiement...</p>
        </div>
      </div>
    );
  }

  if (alreadyPaid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <SEO title="Déjà payé" />
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-2" />
            <CardTitle>Accès déjà débloqué</CardTitle>
            <CardDescription>
              Vous avez déjà accès aux coordonnées de ce projet. Redirection...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/professionnel/dashboard">Mon tableau de bord</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <SEO title="Paiement réussi" />
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-2" />
            <CardTitle>Match confirmé !</CardTitle>
            <CardDescription>
              Les coordonnées du client sont maintenant disponibles dans votre
              dashboard. Vous allez recevoir un email de confirmation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
              ✅ Email envoyé au client, à vous et au support
            </div>
            <Button asChild className="w-full">
              <Link href="/professionnel/dashboard">
                Accéder au projet →
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !clientSecret || !pricing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <SEO title="Erreur de paiement" />
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertCircle className="h-14 w-14 text-destructive mx-auto mb-2" />
            <CardTitle>Erreur</CardTitle>
            <CardDescription>
              {error || "Impossible d'initialiser le paiement"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/professionnel/browse-projects">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux projets
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4">
      <SEO title="Confirmer la mise en relation" />

      <div className="max-w-2xl mx-auto">
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/professionnel/browse-projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux projets
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Confirmer la mise en relation</CardTitle>
            {project && (
              <CardDescription className="space-y-1 pt-1">
                <span className="block font-semibold text-foreground text-base">
                  {project.title}
                </span>
                <span className="flex items-center gap-1 text-sm">
                  <MapPin className="h-3.5 w-3.5" />
                  {project.city}
                  {project.category && (
                    <>
                      <span className="mx-1">·</span>
                      <Tag className="h-3.5 w-3.5" />
                      {project.category}
                    </>
                  )}
                </span>
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Récapitulatif prix */}
            <div className="bg-muted rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{pricing.label}</span>
                <span className="font-medium">{pricing.price_euros.toFixed(2)}€</span>
              </div>
              {project?.budget_max && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Budget client</span>
                  <span className="font-medium flex items-center gap-1">
                    <Euro className="h-3.5 w-3.5" />
                    {project.budget_max.toLocaleString("fr-FR")} €
                  </span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between items-center">
                <span className="font-semibold">Total à payer</span>
                <span className="text-2xl font-black text-primary">
                  {pricing.price_euros.toFixed(2)}€
                </span>
              </div>
            </div>

            {/* Ce que comprend le paiement */}
            <Alert>
              <AlertDescription>
                <strong className="block mb-2">Ce que vous débloquez :</strong>
                <ul className="space-y-1 text-sm">
                  <li>✅ Coordonnées complètes du client (téléphone, email)</li>
                  <li>✅ Messagerie illimitée avec le client</li>
                  <li>✅ Planification de RDV (téléphonique ou sur site)</li>
                  <li>✅ Paiement unique — aucun abonnement</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Formulaire Stripe */}
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: { theme: "stripe" },
              }}
            >
              <CheckoutForm
                projectId={projectId!}
                professionalId={professionalId!}
                pricing={pricing}
                onSuccess={handleSuccess}
              />
            </Elements>

            <p className="text-xs text-center text-muted-foreground">
              Paiement sécurisé par Stripe. Vos données bancaires ne sont
              jamais stockées sur nos serveurs.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
