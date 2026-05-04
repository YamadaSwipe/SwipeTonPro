import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { rateLimitingService } from '@/services/rateLimitingService';

interface RateLimitingIndicatorProps {
  type: 'professional' | 'client' | 'project';
  id: string;
  className?: string;
}

export function RateLimitingIndicator({ type, id, className = '' }: RateLimitingIndicatorProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRateLimitingData();
  }, [type, id]);

  const loadRateLimitingData = async () => {
    setLoading(true);
    setError(null);

    try {
      let result;
      
      switch (type) {
        case 'professional':
          result = await rateLimitingService.checkProfessionalDailyLimit(id);
          break;
        case 'client':
          result = await rateLimitingService.checkClientWeeklyLimit(id);
          break;
        case 'project':
          result = await rateLimitingService.checkProjectEstimationLimit(id);
          break;
        default:
          throw new Error('Type de rate limiting non supporté');
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={`border-gray-200 ${className}`}>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-gray-500">
            <Clock className="w-4 h-4 animate-pulse" />
            <span className="text-sm">Vérification des limites...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className={`border-red-200 bg-red-50 ${className}`}>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="w-4 h-4" />
            <span className="text-sm">Erreur de vérification</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Pour les professionnels
  if (type === 'professional') {
    const { canSendEstimate, currentCount, remainingCount, resetTime, errorMessage } = data;

    if (!canSendEstimate) {
      return (
        <Card className={`border-red-200 bg-red-50 ${className}`}>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="w-5 h-5" />
                <span className="font-medium">Limite atteinte</span>
              </div>
              <Alert className="border-red-200 bg-red-100">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 text-sm">
                  {errorMessage}
                </AlertDescription>
              </Alert>
              <div className="flex items-center gap-2 text-xs text-red-600">
                <Clock className="w-3 h-3" />
                <span>Réinitialisation: {new Date(resetTime).toLocaleString('fr-FR')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className={`border-green-200 bg-green-50 ${className}`}>
        <CardContent className="pt-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Estimations disponibles</span>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {remainingCount}/5
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-green-700">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>Aujourd'hui: {currentCount}/5</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Reset: {new Date(resetTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Pour les clients
  if (type === 'client') {
    const { canCreateEstimate, currentCount, remainingCount, resetTime, errorMessage } = data;

    if (!canCreateEstimate) {
      return (
        <Card className={`border-orange-200 bg-orange-50 ${className}`}>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">Limite hebdomadaire</span>
              </div>
              <Alert className="border-orange-200 bg-orange-100">
                <AlertDescription className="text-orange-800 text-sm">
                  {errorMessage}
                </AlertDescription>
              </Alert>
              <div className="flex items-center gap-2 text-xs text-orange-600">
                <Calendar className="w-3 h-3" />
                <span>Réinitialisation: {new Date(resetTime).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className={`border-green-200 bg-green-50 ${className}`}>
        <CardContent className="pt-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Estimations disponibles</span>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {remainingCount}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-green-700">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>Cette semaine: {currentCount}/2</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Reset: {new Date(resetTime).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Pour les projets
  if (type === 'project') {
    const { canReceiveEstimate, currentCount, remainingCount, projectStatus, errorMessage } = data;

    if (!canReceiveEstimate) {
      return (
        <Card className={`border-gray-200 bg-gray-50 ${className}`}>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-600">
                <XCircle className="w-5 h-5" />
                <span className="font-medium">
                  {projectStatus === 'completed' ? 'Projet complet' : 'Non disponible'}
                </span>
              </div>
              <Alert className="border-gray-200 bg-gray-100">
                <AlertDescription className="text-gray-800 text-sm">
                  {errorMessage}
                </AlertDescription>
              </Alert>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span>Estimations reçues: {currentCount}/3</span>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className={`border-green-200 bg-green-50 ${className}`}>
        <CardContent className="pt-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Disponible</span>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {remainingCount}/3
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-green-700">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>Estimations: {currentCount}/3</span>
              </div>
              <span className="text-green-600">Ouvert aux propositions</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
