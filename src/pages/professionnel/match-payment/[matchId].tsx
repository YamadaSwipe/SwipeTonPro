import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  CreditCard,
  Coins,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

interface MatchDetails {
  id: string;
  project: { title: string; description: string; location: string };
  client: { full_name: string };
  bid: { proposed_price: number };
  price_amount: number;
}

export default function MatchPaymentPage() {
  const router = useRouter();
  const { matchId } = router.query;
  const { toast } = useToast();
  const [match, setMatch] = useState<MatchDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'credits' | 'card'>(
    'credits'
  );
  const [creditBalance, setCreditBalance] = useState(0);
  const [hasEnoughCredits, setHasEnoughCredits] = useState(false);

  useEffect(() => {
    if (matchId) loadData();
  }, [matchId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: proData } = await supabase
        .from('professionals')
        .select('credits_balance')
        .eq('user_id', user.id)
        .single();
      setCreditBalance(proData?.credits_balance || 0);

      const response = await fetch(`/api/matches/${matchId}/details`);
      if (!response.ok) throw new Error('Failed to load match');
      const data = await response.json();
      setMatch(data.match);
      setHasEnoughCredits(
        (proData?.credits_balance || 0) >= data.match.price_amount
      );
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const response = await fetch('/api/match-payment-with-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ matchId, paymentMethod }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Payment failed');
      }

      const result = await response.json();

      if (paymentMethod === 'card' && result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        toast({
          title: 'Succès',
          description: 'Paiement effectué avec succès',
        });
        router.push('/professionnel/mes-matchs');
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  if (!match)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Match introuvable</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Link href="/professionnel/mes-matchs">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-6">Payer la mise en relation</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Résumé du projet</CardTitle>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold">{match.project.title}</h3>
            <p className="text-slate-600 text-sm mt-1">
              {match.project.description}
            </p>
            <p className="text-slate-500 text-sm mt-2">
              {match.project.location}
            </p>
            <p className="text-slate-500 text-sm">
              Client: {match.client.full_name}
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Montant à payer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">
              {match.price_amount} crédits
            </p>
            <p className="text-slate-500 mt-1">
              ~{(match.price_amount * 2.5).toFixed(0)}€ valeur estimée
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Mode de paiement</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as 'credits' | 'card')}
              className="space-y-4"
            >
              <div
                className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-colors ${paymentMethod === 'credits' ? 'border-primary bg-primary/5' : 'border-slate-200'}`}
                onClick={() => setPaymentMethod('credits')}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="credits" id="credits" />
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <Coins className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <Label
                      htmlFor="credits"
                      className="font-medium cursor-pointer"
                    >
                      Payer avec mes crédits
                    </Label>
                    <p className="text-sm text-slate-500">
                      Solde actuel: {creditBalance} crédits
                    </p>
                  </div>
                </div>
                {!hasEnoughCredits && (
                  <Badge variant="destructive">Solde insuffisant</Badge>
                )}
              </div>

              <div
                className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-colors ${paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-slate-200'}`}
                onClick={() => setPaymentMethod('card')}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="card" id="card" />
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <Label
                      htmlFor="card"
                      className="font-medium cursor-pointer"
                    >
                      Payer par carte bancaire
                    </Label>
                    <p className="text-sm text-slate-500">
                      Paiement sécurisé via Stripe
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>

            {paymentMethod === 'credits' && !hasEnoughCredits && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm text-red-800 font-medium">
                    Solde insuffisant
                  </p>
                  <p className="text-sm text-red-600">
                    Il vous manque {match.price_amount - creditBalance} crédits.
                  </p>
                  <Link href="/professionnel/buy-credits">
                    <Button variant="link" className="p-0 h-auto text-red-700">
                      Acheter des crédits
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          onClick={handlePayment}
          disabled={
            processing || (paymentMethod === 'credits' && !hasEnoughCredits)
          }
          className="w-full h-14 text-lg"
        >
          {processing ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : (
            <CheckCircle2 className="h-5 w-5 mr-2" />
          )}
          {paymentMethod === 'credits'
            ? `Payer ${match.price_amount} crédits`
            : `Payer par carte`}
        </Button>
      </div>
    </div>
  );
}
