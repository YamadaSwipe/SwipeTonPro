import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Lock, 
  CreditCard, 
  CheckCircle, 
  AlertCircle,
  Shield,
  Clock,
  Users,
  MessageSquare
} from 'lucide-react';
import { TarifService } from '@/services/tarifService';
import { chatService } from '@/services/chatService';

interface PaymentRequiredProps {
  clientId: string;
  professionalId: string;
  projectId: string;
  estimation: number;
  onPaymentSuccess?: () => void;
}

const PaymentRequired: React.FC<PaymentRequiredProps> = ({
  clientId,
  professionalId,
  projectId,
  estimation,
  onPaymentSuccess
}) => {
  const [frais, setFrais] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFrais();
  }, [estimation]);

  const loadFrais = async () => {
    try {
      const fraisCalcul = await TarifService.calculerFrais(estimation);
      setFrais(fraisCalcul);
    } catch (err) {
      console.error('Erreur calcul frais:', err);
      setError('Impossible de calculer les frais');
    }
  };

  const handlePayment = async () => {
    try {
      setPaymentProcessing(true);
      setError(null);

      // Créer l'intention de paiement Stripe
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: frais * 100, // Stripe en centimes
          currency: 'eur',
          metadata: {
            clientId,
            professionalId,
            projectId,
            type: 'mise_en_relation',
            estimation: estimation.toString()
          }
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création du paiement');
      }

      const { sessionId, clientSecret } = await response.json();

      if (sessionId) {
        // Rediriger vers Stripe Checkout
        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
        if (stripe) {
          const { error } = await stripe.redirectToCheckout({ sessionId });
          if (error) throw error;
        }
      } else if (clientSecret) {
        // Utiliser Payment Element
        // Implémenter ici le Payment Element si nécessaire
        throw new Error('Payment Element non implémenté');
      }

    } catch (err) {
      console.error('Erreur paiement:', err);
      setError('Une erreur est survenue lors du paiement. Veuillez réessayer.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const loadStripe = async (key: string) => {
    const { loadStripe } = await import('@stripe/stripe-js');
    return loadStripe(key);
  };

  return (
    <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <Lock className="w-5 h-5" />
          Chat complet débloqué
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Message principal */}
        <div className="text-center space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Accédez au chat complet et aux informations du professionnel
            </h3>
            <p className="text-gray-600 text-sm">
              Débloquez la communication illimitée avec le professionnel sélectionné 
              et accédez à toutes ses informations de contact.
            </p>
          </div>

          {/* Avantages */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <MessageSquare className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium text-sm">Chat illimité</h4>
              <p className="text-xs text-gray-600">Communiquez sans limite</p>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-medium text-sm">Informations complètes</h4>
              <p className="text-xs text-gray-600">Accédez aux coordonnées</p>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <Shield className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-medium text-sm">Paiement sécurisé</h4>
              <p className="text-xs text-gray-600">Protection Stripe</p>
            </div>
          </div>

          <Separator />

          {/* Tarification */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-orange-200">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                <CreditCard className="w-5 h-5 text-orange-600" />
                <h4 className="text-lg font-semibold text-gray-900">Frais de mise en relation</h4>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {TarifService.formatMontant(frais)}
                </div>
                <p className="text-sm text-gray-600">
                  Pour un projet estimé à {TarifService.formatMontant(estimation)}
                </p>
              </div>

              {/* Détails du tarif */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium text-sm mb-2">Ce tarif inclut :</h5>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Accès illimité au chat
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Informations complètes du professionnel
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Sécurisation du paiement
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Protection mutuelle
                  </li>
                </ul>
              </div>

              {/* Badge de sécurité */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <Shield className="w-4 h-4" />
                Paiement sécurisé via Stripe
              </div>
            </div>
          </div>

          {/* Bouton de paiement */}
          <div className="space-y-3">
            <Button 
              onClick={handlePayment}
              disabled={paymentProcessing || loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3"
              size="lg"
            >
              {paymentProcessing ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Traitement en cours...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Payer {TarifService.formatMontant(frais)} pour débloquer
                </>
              )}
            </Button>

            {error && (
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Informations complémentaires */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h5 className="font-medium text-blue-800 mb-2">Pourquoi ces frais ?</h5>
          <p className="text-sm text-blue-700">
            Les frais de mise en relation nous permettent de maintenir la plateforme, 
            de vérifier les professionnels et de vous offrir un service sécurisé. 
            Ils ne sont payés qu'une seule fois par projet et uniquement après 
            avoir trouvé le professionnel idéal.
          </p>
        </div>

        {/* Garantie */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Satisfaction garantie ou remboursement
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentRequired;
