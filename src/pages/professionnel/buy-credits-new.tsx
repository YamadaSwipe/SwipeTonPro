import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { 
  CreditCard, 
  Plus, 
  Shield,
  CheckCircle,
  AlertCircle,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";

const CREDIT_PACKS = [
  {
    id: 'pack-5',
    credits: 5,
    price: 25,
    description: 'Idéal pour tester'
  },
  {
    id: 'pack-10',
    credits: 10,
    price: 45,
    description: 'Le plus populaire',
    popular: true
  },
  {
    id: 'pack-20',
    credits: 20,
    price: 80,
    description: 'Très avantageux'
  },
  {
    id: 'pack-50',
    credits: 50,
    price: 180,
    description: 'Pour les professionnels actifs'
  }
];

export default function BuyCreditsPage() {
  const router = useRouter();
  const [selectedPack, setSelectedPack] = useState(CREDIT_PACKS[1]);
  const [loading, setLoading] = useState(false);
  const [currentCredits, setCurrentCredits] = useState<number>(0);
  const [processingPayment, setProcessingPayment] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCurrentCredits();
  }, []);

  const loadCurrentCredits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: professional } = await supabase
        .from("professionals")
        .select("credits_balance")
        .eq("user_id", user.id)
        .single();

      if (professional) {
        setCurrentCredits(professional.credits_balance || 0);
      }
    } catch (error) {
      console.error("Error loading credits:", error);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPack) return;

    setLoading(true);
    setProcessingPayment(true);

    try {
      // ÉTAPE 1: Récupérer la session Supabase avec le token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !session.access_token) {
        toast({
          title: "Erreur d'authentification",
          description: "Vous devez être connecté pour acheter des crédits",
          variant: "destructive"
        });
        router.push("/auth/login");
        return;
      }

      console.log('✅ User session found:', session.user.email);
      console.log('🔍 DEBUG: User ID from session:', session.user.id);
      console.log('🔍 DEBUG: Backend will derive professional from user.id');

      // ÉTAPE 2: Créer un PaymentIntent Stripe avec authentification
      const response = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}` // ENVOI DU TOKEN CRITIQUE
        },
        body: JSON.stringify({
          amount: selectedPack.price * 100, // en centimes
          currency: "eur",
          // professionalId supprimé - sera dérivé du token côté backend (PLUS SÉCURISÉ)
          description: `Achat de ${selectedPack.credits} crédits SwipeTonPro`,
          metadata: {
            packId: selectedPack.id,
            credits: selectedPack.credits,
            type: "credit_purchase"
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ PaymentIntent creation failed:', errorData);
        
        // Gérer les erreurs d'authentification spécifiquement
        if (response.status === 401) {
          toast({
            title: "Session expirée",
            description: "Veuillez vous reconnecter",
            variant: "destructive"
          });
          router.push("/auth/login");
          return;
        }
        
        throw new Error(errorData.message || "Erreur lors de la création du paiement");
      }

      const { clientSecret } = await response.json();
      console.log('✅ PaymentIntent created successfully');

      // Rediriger vers la page de paiement Stripe
      const stripe = await import("@stripe/stripe-js").then(module => 
        module.loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
      );

      const { error } = await stripe!.redirectToCheckout({
        sessionId: clientSecret,
        successUrl: `${window.location.origin}/professionnel/buy-credits?success=true`,
        cancelUrl: `${window.location.origin}/professionnel/buy-credits?canceled=true`
      });

      if (error) {
        throw error;
      }

    } catch (error: any) {
      console.error("Error purchasing credits:", error);
      toast({
        title: "Erreur d'achat",
        description: error.message || "Une erreur est survenue lors de l'achat de crédits",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setProcessingPayment(false);
    }
  };

  // Vérifier si le paiement a réussi
  useEffect(() => {
    if (router.query.success === "true") {
      toast({
        title: "Achat réussi!",
        description: "Vos crédits ont été ajoutés à votre compte.",
      });
      loadCurrentCredits(); // Recharger les crédits
    }
  }, [router.query.success]);

  return (
    <>
      <SEO 
        title="Acheter des Crédits - SwipeTonPro"
        description="Achetez des crédits pour débloquer les coordonnées des clients"
      />
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <Link href="/professionnel/dashboard">
                <Button variant="outline" className="mb-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour au tableau de bord
                </Button>
              </Link>
              
              <h1 className="text-3xl font-bold mb-2">Acheter des Crédits</h1>
              <p className="text-muted-foreground">
                Les crédits vous permettent de débloquer les coordonnées des clients après un match mutuel
              </p>
            </div>

            {/* Current Credits */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Solde actuel</p>
                  <div className="text-3xl font-bold text-primary">
                    {currentCredits} crédits
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    1 crédit = 1 déblocage de coordonnées
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Credit Packs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {CREDIT_PACKS.map((pack) => (
                <Card 
                  key={pack.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedPack.id === pack.id 
                      ? 'ring-2 ring-primary border-primary' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedPack(pack)}
                >
                  <CardContent className="p-4">
                    {pack.popular && (
                      <Badge className="mb-2" variant="default">
                        Populaire
                      </Badge>
                    )}
                    
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-bold text-primary">
                        {pack.credits}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        crédits
                      </p>
                      
                      <div className="text-lg font-semibold">
                        {pack.price}€
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        {pack.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Selected Pack Summary */}
            {selectedPack && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Résumé de l'achat</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pack sélectionné</p>
                      <p className="text-lg font-semibold">
                        {selectedPack.credits} crédits - {selectedPack.price}€
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold text-primary">
                        {selectedPack.price}€
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded-md">
                    <h4 className="font-medium text-blue-900 mb-2">Informations importantes:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Les crédits sont valables 12 mois</li>
                      <li>• 1 crédit = 1 déblocage de coordonnées</li>
                      <li>• Les crédits ne sont pas remboursables</li>
                      <li>• Paiement sécurisé via Stripe</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Purchase Button */}
            <div className="text-center">
              <Button 
                onClick={handlePurchase}
                disabled={!selectedPack || loading || processingPayment}
                size="lg"
                className="px-8"
              >
                {processingPayment ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent animate-spin" />
                    Traitement en cours...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Acheter {selectedPack?.credits} crédits - {selectedPack?.price}€
                  </>
                )}
              </Button>
            </div>

            {/* Security Info */}
            <Card className="mt-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-green-600" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium">Paiement sécurisé</p>
                    <p>Vos informations de paiement sont cryptées et sécurisées</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
