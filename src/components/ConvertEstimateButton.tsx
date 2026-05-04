import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowRight, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  CreditCard,
  Shield,
  Clock
} from 'lucide-react';
import { estimateToProjectService, type EstimateData } from '@/services/estimateToProjectService';
import { useToast } from '@/hooks/use-toast';

interface ConvertEstimateButtonProps {
  estimateData: EstimateData;
  professionalId: string;
  professionalName?: string;
  professionalAvatar?: string;
  onConverted?: (projectId: string, matchId: string) => void;
  className?: string;
}

export function ConvertEstimateButton({
  estimateData,
  professionalId,
  professionalName,
  professionalAvatar,
  onConverted,
  className = ''
}: ConvertEstimateButtonProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleConvert = async () => {
    setLoading(true);
    
    try {
      // Vérifier si la conversion est possible
      const canConvert = await estimateToProjectService.canConvertEstimate(
        estimateData,
        professionalId
      );

      if (!canConvert.canConvert) {
        toast({
          title: 'Conversion impossible',
          description: canConvert.reason || 'Vérifiez les informations de votre estimation',
          variant: 'destructive'
        });
        return;
      }

      // Appeler l'API de conversion
      const response = await fetch('/api/convert-estimate-to-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estimateData,
          professionalId
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la conversion');
      }

      if (result.success) {
        toast({
          title: '🎉 Projet créé !',
          description: 'Votre estimation a été transformée en projet réel',
        });

        // Rediriger vers Stripe si URL fournie
        if (result.stripeCheckoutUrl) {
          window.location.href = result.stripeCheckoutUrl;
        } else {
          // Notifier le composant parent
          onConverted?.(result.projectId!, result.matchId!);
        }
      }

    } catch (error) {
      console.error('❌ Erreur conversion:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de convertir l\'estimation',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const estimatedBudget = estimateData.aiEstimation 
    ? (estimateData.aiEstimation.estimation_min + estimateData.aiEstimation.estimation_max) / 2
    : (estimateData.budgetMin + estimateData.budgetMax) / 2;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Carte de résumé */}
      <Card className="border-2 border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Transformer en projet réel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Info professionnel */}
          {professionalName && (
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                {professionalAvatar ? (
                  <img src={professionalAvatar} alt={professionalName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm font-semibold">
                    {professionalName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium">{professionalName}</p>
                <p className="text-sm text-gray-500">Professionnel sélectionné</p>
              </div>
            </div>
          )}

          {/* Résumé du projet */}
          <div className="space-y-2">
            <h4 className="font-medium">Résumé du projet :</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Type :</span>
                <p className="font-medium">{estimateData.workType}</p>
              </div>
              <div>
                <span className="text-gray-500">Budget :</span>
                <p className="font-medium">
                  {Math.round(estimateData.budgetMin).toLocaleString()}€ - {Math.round(estimateData.budgetMax).toLocaleString()}€
                </p>
              </div>
              <div>
                <span className="text-gray-500">Lieu :</span>
                <p className="font-medium">{estimateData.city}</p>
              </div>
              <div>
                <span className="text-gray-500">Surface :</span>
                <p className="font-medium">{estimateData.surface || 'Non spécifié'} m²</p>
              </div>
            </div>
          </div>

          {/* Estimation IA */}
          {estimateData.aiEstimation && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-800">Estimation IA</span>
              </div>
              <p className="text-sm text-blue-700">
                {Math.round(estimateData.aiEstimation.estimation_min).toLocaleString()}€ - {' '}
                {Math.round(estimateData.aiEstimation.estimation_max).toLocaleString()}€
              </p>
            </div>
          )}

          {/* Alertes */}
          <Alert className="border-green-200 bg-green-50">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="space-y-2">
                <p className="font-medium">Ce qui va se passer :</p>
                <ul className="text-sm space-y-1">
                  <li>• Création automatique de votre projet</li>
                  <li>• Mise en relation immédiate avec le professionnel</li>
                  <li>• Paiement sécurisé pour débloquer la communication</li>
                  <li>• Accès aux coordonnées du professionnel</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {/* Bouton principal */}
          <Button 
            onClick={handleConvert}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4 mr-2" />
                Créer le projet - {Math.round(estimatedBudget).toLocaleString()}€
              </>
            )}
          </Button>

          {/* Badge de sécurité */}
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>Paiement sécurisé</span>
            </div>
            <div className="flex items-center gap-1">
              <CreditCard className="w-3 h-3" />
              <span>Stripe</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Activation immédiate</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
