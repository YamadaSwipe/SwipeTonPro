import React from 'react';
import { Shield, Eye, EyeOff, MessageCircle, Lock } from 'lucide-react';

interface AnonymousMessageWarningProps {
  remainingMessages: number;
  totalMessages: number;
  isRevealed: boolean;
  showContactRevealed?: boolean;
}

const AnonymousMessageWarning: React.FC<AnonymousMessageWarningProps> = ({
  remainingMessages,
  totalMessages,
  isRevealed,
  showContactRevealed = true
}) => {
  const progress = ((totalMessages - remainingMessages) / totalMessages) * 100;

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-4">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="p-2 bg-indigo-100 rounded-lg shrink-0">
          <Shield className="w-5 h-5 text-indigo-600" />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-3">
          {/* Header */}
          <div>
            <h4 className="font-semibold text-gray-900">
              Mode Anonyme Actif
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              {isRevealed 
                ? "Les coordonnées ont été révélées. Vous pouvez échanger librement."
                : "Échangez jusqu'à 3 messages avant révélation des coordonnées."
              }
            </p>
          </div>

          {/* Progress */}
          {!isRevealed && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Messages échangés</span>
                <span className="font-medium text-indigo-700">
                  {totalMessages - remainingMessages} / {totalMessages}
                </span>
              </div>
              
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                {remainingMessages > 0 ? (
                  <>
                    <MessageCircle className="w-3 h-3" />
                    <span>{remainingMessages} message{remainingMessages > 1 ? 's' : ''} avant révélation</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3 text-green-600" />
                    <span className="text-green-600 font-medium">
                      Prêt pour la révélation !
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Status Badge */}
          {isRevealed && showContactRevealed && (
            <div className="flex items-center gap-2 p-2 bg-green-100 rounded-lg">
              <Eye className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                Coordonnées révélées
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnonymousMessageWarning;
