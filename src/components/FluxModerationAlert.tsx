import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Lightbulb,
  ArrowRight,
  Calendar,
  Timer
} from 'lucide-react';
import { fluxModerationService, type ModerationMessage } from '@/services/fluxModerationService';
import { useToast } from '@/hooks/use-toast';

interface FluxModerationAlertProps {
  message: ModerationMessage;
  onAction?: () => void;
  className?: string;
  showAlternatives?: boolean;
}

export function FluxModerationAlert({ 
  message, 
  onAction, 
  className = '',
  showAlternatives = true 
}: FluxModerationAlertProps) {
  const { toast } = useToast();
  const [showAlternativesList, setShowAlternativesList] = useState(false);

  const getIcon = () => {
    switch (message.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getAlertClass = () => {
    switch (message.type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-orange-200 bg-orange-50';
      case 'info':
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getTextClass = () => {
    switch (message.type) {
      case 'success':
        return 'text-green-800';
      case 'warning':
        return 'text-orange-800';
      case 'info':
      default:
        return 'text-blue-800';
    }
  };

  const formatResetTime = () => {
    if (!message.reset_time) return '';
    
    const now = new Date();
    const reset = new Date(message.reset_time);
    const diffMs = reset.getTime() - now.getTime();
    
    if (diffMs < 0) return 'Bientôt disponible';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours < 1) {
      return `dans ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `dans ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    }
  };

  const handleAlternativeClick = (alternative: string) => {
    toast({
      title: '💡 Bonne idée !',
      description: alternative,
      duration: 3000
    });
  };

  return (
    <Card className={`${getAlertClass()} ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getIcon()}
            <CardTitle className="text-lg">{message.title}</CardTitle>
          </div>
          {message.action_suggestion && (
            <Badge variant="secondary" className={getTextClass()}>
              {message.action_suggestion}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Message principal */}
        <Alert className={`border-current ${getAlertClass()}`}>
          <AlertDescription className={`text-sm ${getTextClass()}`}>
            {message.message}
          </AlertDescription>
        </Alert>

        {/* Temps de reset */}
        {message.reset_time && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Timer className="w-4 h-4" />
            <span>Disponibilité: {formatResetTime()}</span>
            {new Date(message.reset_time).toLocaleDateString('fr-FR') !== new Date().toLocaleDateString('fr-FR') && (
              <span className="text-xs">
                ({new Date(message.reset_time).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'numeric' })})
              </span>
            )}
          </div>
        )}

        {/* Bouton d'action */}
        {onAction && message.type === 'success' && (
          <Button 
            onClick={onAction}
            className="w-full"
            variant="default"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Continuer
          </Button>
        )}

        {/* Alternatives */}
        {showAlternatives && message.alternative_solutions && message.alternative_solutions.length > 0 && (
          <div className="space-y-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAlternativesList(!showAlternativesList)}
              className="flex items-center gap-2"
            >
              <Lightbulb className="w-4 h-4" />
              {showAlternativesList ? 'Masquer' : 'Voir'} les alternatives
            </Button>

            {showAlternativesList && (
              <div className="space-y-2 p-3 bg-white/50 rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Pendant ce temps, vous pouvez :
                </p>
                <div className="space-y-1">
                  {message.alternative_solutions.map((alternative, index) => (
                    <button
                      key={index}
                      onClick={() => handleAlternativeClick(alternative)}
                      className="w-full text-left text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 p-2 rounded transition-colors flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0"></span>
                      {alternative}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Encouragement */}
        <div className="text-center pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 italic">
            {fluxModerationService.generateEncouragement(
              message.type === 'success' ? 'professional' : 'client',
              message.type === 'success' ? 'success' : 'limit'
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface FluxModerationCompactProps {
  message: ModerationMessage;
  className?: string;
}

export function FluxModerationCompact({ message, className = '' }: FluxModerationCompactProps) {
  const getIcon = () => {
    switch (message.type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getBadgeClass = () => {
    switch (message.type) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'info':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg border ${getBadgeClass()} ${className}`}>
      {getIcon()}
      <span className="text-sm font-medium">{message.title}</span>
      {message.action_suggestion && (
        <Badge variant="secondary" className="ml-auto text-xs">
          {message.action_suggestion}
        </Badge>
      )}
    </div>
  );
}
