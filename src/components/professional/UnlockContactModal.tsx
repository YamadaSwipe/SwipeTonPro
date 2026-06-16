import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Coins, Lock, Unlock, AlertCircle, CheckCircle } from 'lucide-react';
import { calculateUnlockPrice, formatEuros } from '@/config/matchPricingTiers';

interface UnlockContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  professionalId: string;
  projectTitle: string;
  estimatedBudgetMin: number;
  estimatedBudgetMax: number;
  creditsBalance: number;
  onSuccess?: () => void;
}

export const UnlockContactModal: React.FC<UnlockContactModalProps> = ({
  isOpen,
  onClose,
  projectId,
  professionalId,
  projectTitle,
  estimatedBudgetMin,
  estimatedBudgetMax,
  creditsBalance,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Calculer le prix de déblocage
  const pricing = calculateUnlockPrice(estimatedBudgetMin, estimatedBudgetMax);
  const hasEnoughCredits = creditsBalance >= pricing.creditsCost;

  const handleUnlockWithCredits = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/unlock-contact-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          professionalId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du déblocage');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockWithCard = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/unlock-contact-stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          professionalId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création du lien de paiement');
      }

      // Rediriger vers Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 rounded-full bg-green-100 p-3">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900">
              Contact débloqué !
            </h3>
            <p className="text-gray-600">
              Vous pouvez maintenant accéder aux coordonnées du client et échanger directement.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-orange-600" />
            Débloquer le contact
          </DialogTitle>
          <DialogDescription>
            Projet : <span className="font-medium">{projectTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informations sur le prix */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-gray-600">Catégorie du projet</span>
              <span className="font-medium text-gray-900">{pricing.tier?.label}</span>
            </div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-gray-600">Budget estimé</span>
              <span className="font-medium text-gray-900">
                {formatEuros(pricing.budgetUsed)}
              </span>
            </div>
            <div className="border-t border-gray-300 pt-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">Prix du déblocage</span>
                <span className="text-lg font-bold text-orange-600">
                  {formatEuros(pricing.priceEuros)}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                ou {pricing.creditsCost} crédit{pricing.creditsCost > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Message d'erreur */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Options de paiement */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">
              Choisissez votre mode de paiement
            </h4>

            {/* Paiement par crédits */}
            <Button
              onClick={handleUnlockWithCredits}
              disabled={!hasEnoughCredits || loading}
              className="w-full justify-start"
              variant={hasEnoughCredits ? 'default' : 'outline'}
            >
              <Coins className="mr-2 h-5 w-5" />
              <div className="flex-1 text-left">
                <div className="font-medium">
                  Utiliser mes crédits ({pricing.creditsCost} crédit{pricing.creditsCost > 1 ? 's' : ''})
                </div>
                <div className="text-xs opacity-80">
                  Solde actuel : {creditsBalance} crédit{creditsBalance > 1 ? 's' : ''}
                  {!hasEnoughCredits && (
                    <span className="ml-2 text-red-400">
                      (Insuffisant - manque {pricing.creditsCost - creditsBalance})
                    </span>
                  )}
                </div>
              </div>
            </Button>

            {/* Paiement par carte */}
            <Button
              onClick={handleUnlockWithCard}
              disabled={loading}
              className="w-full justify-start"
              variant="outline"
            >
              <CreditCard className="mr-2 h-5 w-5" />
              <div className="flex-1 text-left">
                <div className="font-medium">
                  Payer par carte ({formatEuros(pricing.priceEuros)})
                </div>
                <div className="text-xs opacity-80">
                  Paiement sécurisé via Stripe
                </div>
              </div>
            </Button>
          </div>

          {/* Informations complémentaires */}
          <div className="rounded-lg bg-blue-50 p-3">
            <div className="flex gap-2">
              <Unlock className="h-5 w-5 flex-shrink-0 text-blue-600" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Que se passe-t-il après le déblocage ?</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Accès aux coordonnées complètes du client</li>
                  <li>Possibilité d'échanger par message</li>
                  <li>Contact direct par téléphone ou email</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bouton annuler */}
          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full"
            disabled={loading}
          >
            Annuler
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
