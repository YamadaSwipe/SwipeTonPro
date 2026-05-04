import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Coins,
  CreditCard,
  Plus,
  Sparkles,
  ArrowLeft,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { loadStripe } from '@stripe/stripe-js';
import type { CreditPackage } from '@/services/creditPackageService';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

export default function BuyCredits() {
  const router = useRouter();
  const { toast } = useToast();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [currentCredits, setCurrentCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processingPackageId, setProcessingPackageId] = useState<string | null>(
    null
  );
  const [professionalId, setProfessionalId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Get professional ID
      const { data: pro } = await supabase
        .from('professionals')
        .select('id, credits_balance')
        .eq('user_id', user.id)
        .single();

      if (pro) {
        setProfessionalId(pro.id);
        setCurrentCredits(pro.credits_balance || 0);
      }

      // Load credit packages from API
      const response = await fetch('/api/credits/packages');
      if (response.ok) {
        const data = await response.json();
        setPackages(data.packages || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les forfaits de crédits',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg: CreditPackage) => {
    if (!professionalId) return;

    setProcessingPackageId(pkg.id);

    try {
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: pkg.id,
          professionalId,
          successUrl: `${window.location.origin}/professionnel/credits/success`,
          cancelUrl: `${window.location.origin}/professionnel/buy-credits`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Erreur lors de la création de la session'
        );
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        // Fallback: load Stripe.js and redirect
        const stripe = await stripePromise;
        if (stripe && data.sessionId) {
          await stripe.redirectToCheckout({ sessionId: data.sessionId });
        }
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de procéder au paiement',
        variant: 'destructive',
      });
    } finally {
      setProcessingPackageId(null);
    }
  };

  const getPopularBadge = (pkg: CreditPackage) => {
    if (pkg.is_promotional && pkg.promotion_label) {
      return (
        <Badge className="bg-orange-500 hover:bg-orange-600">
          <Sparkles className="w-3 h-3 mr-1" />
          {pkg.promotion_label}
        </Badge>
      );
    }
    if (pkg.name.includes('10') || pkg.name.includes('Populaire')) {
      return (
        <Badge className="bg-blue-500 hover:bg-blue-600">Plus populaire</Badge>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface via-surface-elevated to-surface py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-surface-elevated to-surface py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/professionnel/dashboard">
              <Button variant="ghost" className="mb-2 pl-0">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour au tableau de bord
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Acheter des crédits</h1>
            <p className="text-muted-foreground">
              Les crédits vous permettent de débloquer des contacts client
              rapidement
            </p>
          </div>

          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
            <CardContent className="py-4 px-6">
              <div className="flex items-center gap-3">
                <Coins className="h-8 w-8" />
                <div>
                  <p className="text-sm opacity-90">Solde actuel</p>
                  <p className="text-2xl font-bold">{currentCredits} crédits</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {packages.length === 0 ? (
            // Default packages if none in database
            <>
              <CreditPackageCard
                pkg={{
                  id: 'default-5',
                  name: 'Pack Découverte',
                  credits_amount: 5,
                  price_euros: 25,
                  bonus_credits: 0,
                  total_credits: 5,
                  is_promotional: false,
                  is_active: true,
                  sort_order: 1,
                }}
                onPurchase={handlePurchase}
                isProcessing={processingPackageId === 'default-5'}
              />
              <CreditPackageCard
                pkg={{
                  id: 'default-10',
                  name: 'Pack Populaire',
                  credits_amount: 10,
                  price_euros: 45,
                  bonus_credits: 1,
                  total_credits: 11,
                  is_promotional: true,
                  promotion_label: '+1 gratuit',
                  is_active: true,
                  sort_order: 2,
                }}
                onPurchase={handlePurchase}
                isProcessing={processingPackageId === 'default-10'}
                popular
              />
              <CreditPackageCard
                pkg={{
                  id: 'default-20',
                  name: 'Pack Avancé',
                  credits_amount: 20,
                  price_euros: 80,
                  bonus_credits: 3,
                  total_credits: 23,
                  is_promotional: true,
                  promotion_label: '+3 gratuits',
                  is_active: true,
                  sort_order: 3,
                }}
                onPurchase={handlePurchase}
                isProcessing={processingPackageId === 'default-20'}
              />
              <CreditPackageCard
                pkg={{
                  id: 'default-50',
                  name: 'Pack Pro',
                  credits_amount: 50,
                  price_euros: 180,
                  bonus_credits: 10,
                  total_credits: 60,
                  is_promotional: true,
                  promotion_label: '+10 gratuits',
                  is_active: true,
                  sort_order: 4,
                }}
                onPurchase={handlePurchase}
                isProcessing={processingPackageId === 'default-50'}
                bestValue
              />
            </>
          ) : (
            packages.map((pkg) => (
              <CreditPackageCard
                key={pkg.id}
                pkg={pkg}
                onPurchase={handlePurchase}
                isProcessing={processingPackageId === pkg.id}
              />
            ))
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">1 crédit = 1 contact</h3>
                  <p className="text-sm text-muted-foreground">
                    Chaque crédit vous permet de débloquer les coordonnées d'un
                    client
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Sparkles className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Bonus inclus</h3>
                  <p className="text-sm text-muted-foreground">
                    Plus vous achetez, plus vous obtenez de crédits bonus
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Paiement sécurisé</h3>
                  <p className="text-sm text-muted-foreground">
                    Paiement via Stripe, sans engagement
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface CreditPackageCardProps {
  pkg: Partial<CreditPackage> & {
    id: string;
    name: string;
    credits_amount: number;
    price_euros: number;
    total_credits: number;
  };
  onPurchase: (pkg: any) => void;
  isProcessing: boolean;
  popular?: boolean;
  bestValue?: boolean;
}

function CreditPackageCard({
  pkg,
  onPurchase,
  isProcessing,
  popular,
  bestValue,
}: CreditPackageCardProps) {
  const bonusCredits = pkg.bonus_credits || 0;
  const pricePerCredit = pkg.price_euros / pkg.total_credits;
  const hasBonus = bonusCredits > 0;

  return (
    <Card
      className={`relative overflow-hidden ${popular ? 'ring-2 ring-blue-500' : ''} ${bestValue ? 'ring-2 ring-purple-500' : ''}`}
    >
      {(popular || bestValue) && (
        <div
          className={`absolute top-0 right-0 px-3 py-1 text-xs font-semibold text-white ${popular ? 'bg-blue-500' : 'bg-purple-500'}`}
        >
          {popular ? 'Populaire' : 'Meilleur rapport'}
        </div>
      )}

      <CardHeader>
        <CardTitle className="text-lg">{pkg.name}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-primary">
            {pkg.total_credits}
          </div>
          <div className="text-sm text-muted-foreground">crédits</div>
        </div>

        {hasBonus && (
          <Badge variant="secondary" className="w-full justify-center">
            +{bonusCredits} crédits gratuits
          </Badge>
        )}

        <div className="text-center">
          <div className="text-2xl font-bold">{pkg.price_euros}€</div>
          <div className="text-xs text-muted-foreground">
            ~{pricePerCredit.toFixed(2)}€/crédit
          </div>
        </div>

        <Button
          onClick={() => onPurchase(pkg)}
          disabled={isProcessing}
          className="w-full"
          variant={popular ? 'default' : 'outline'}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Traitement...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Acheter
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
