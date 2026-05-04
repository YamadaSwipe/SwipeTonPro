import React from 'react';
import { AlertCircle, CheckCircle, Clock, MessageCircle } from 'lucide-react';

interface QuotaDisplayProps {
  type: 'professional' | 'client' | 'project';
  currentCount: number;
  remainingCount: number;
  limit: number;
  resetTime?: string;
  moderationMessage?: {
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'success';
    suggestions?: string[];
  } | null;
}

const QuotaDisplay: React.FC<QuotaDisplayProps> = ({
  type,
  currentCount,
  remainingCount,
  limit,
  resetTime,
  moderationMessage
}) => {
  const getTypeLabel = () => {
    switch (type) {
      case 'professional':
        return 'Quotidien Pro';
      case 'client':
        return 'Hebdomadaire Client';
      case 'project':
        return 'Réponses Projet';
      default:
        return '';
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'info':
      default:
        return <MessageCircle className="w-5 h-5 text-blue-600" />;
    }
  };

  const percentage = Math.min((currentCount / limit) * 100, 100);
  const isWarning = remainingCount <= 1;
  const isCritical = remainingCount === 0;

  return (
    <div className="space-y-4">
      {/* Quota Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            {getTypeLabel()}
          </span>
        </div>
        <span className={`text-sm font-bold ${isCritical ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-green-600'}`}>
          {remainingCount}/{limit} restants
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-green-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>0</span>
          <span>Utilisé: {currentCount}</span>
          <span>{limit}</span>
        </div>
      </div>

      {/* Reset Time */}
      {resetTime && (
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Réinitialisation: {resetTime}
        </p>
      )}

      {/* Moderation Message */}
      {moderationMessage && (
        <div className={`p-4 rounded-lg border ${getSeverityStyles(moderationMessage.severity)}`}>
          <div className="flex items-start gap-3">
            {getSeverityIcon(moderationMessage.severity)}
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">
                {moderationMessage.title}
              </h4>
              <p className="text-sm mb-2">
                {moderationMessage.message}
              </p>
              {moderationMessage.suggestions && moderationMessage.suggestions.length > 0 && (
                <ul className="text-sm space-y-1 mt-2">
                  {moderationMessage.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-xs mt-1">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Critical Warning */}
      {isCritical && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Limite atteinte - Action impossible
          </p>
        </div>
      )}
    </div>
  );
};

export default QuotaDisplay;
