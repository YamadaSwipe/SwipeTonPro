import { NextRequest, NextResponse } from 'next/server';
import { rateLimitingService } from '@/services/rateLimitingService';
import { fluxModerationService } from '@/services/fluxModerationService';

interface QuotaCheck {
  type: 'professional_daily' | 'client_weekly' | 'project_responses';
  userId?: string;
  projectId?: string;
  professionalId?: string;
}

export async function quotaMiddleware(request: NextRequest, quotaCheck: QuotaCheck): Promise<{
  canProceed: boolean;
  response?: NextResponse;
  moderationMessage?: any;
}> {
  try {
    let result;

    switch (quotaCheck.type) {
      case 'professional_daily':
        if (!quotaCheck.professionalId) {
          return {
            canProceed: false,
            response: NextResponse.json(
              { error: 'professionalId requis pour vérifier le quota professionnel' },
              { status: 400 }
            )
          };
        }

        result = await rateLimitingService.checkProfessionalDailyLimit(
          quotaCheck.professionalId
        );

        if (!result.canSendEstimate) {
          const moderationMessage = await fluxModerationService.checkProfessionalFlux(
            quotaCheck.professionalId
          );

          return {
            canProceed: false,
            moderationMessage: moderationMessage.message,
            response: NextResponse.json(
              {
                success: false,
                error: result.errorMessage,
                quotaInfo: {
                  currentCount: result.currentCount,
                  remainingCount: result.remainingCount,
                  resetTime: result.resetTime
                },
                moderationMessage: moderationMessage.message
              },
              { status: 429 } // Too Many Requests
            )
          };
        }
        break;

      case 'client_weekly':
        if (!quotaCheck.userId) {
          return {
            canProceed: false,
            response: NextResponse.json(
              { error: 'userId requis pour vérifier le quota client' },
              { status: 400 }
            )
          };
        }

        result = await rateLimitingService.checkClientWeeklyLimit(
          quotaCheck.userId
        );

        if (!result.canCreateEstimate) {
          const moderationMessage = await fluxModerationService.checkClientFlux(
            quotaCheck.userId
          );

          return {
            canProceed: false,
            moderationMessage: moderationMessage.message,
            response: NextResponse.json(
              {
                success: false,
                error: result.errorMessage,
                quotaInfo: {
                  currentCount: result.currentCount,
                  remainingCount: result.remainingCount,
                  resetTime: result.resetTime
                },
                moderationMessage: moderationMessage.message
              },
              { status: 429 }
            )
          };
        }
        break;

      case 'project_responses':
        if (!quotaCheck.projectId) {
          return {
            canProceed: false,
            response: NextResponse.json(
              { error: 'projectId requis pour vérifier le quota de projet' },
              { status: 400 }
            )
          };
        }

        result = await rateLimitingService.checkProjectEstimationLimit(
          quotaCheck.projectId
        );

        if (!result.canReceiveEstimate) {
          const moderationMessage = await fluxModerationService.checkProjectFlux(
            quotaCheck.projectId
          );

          return {
            canProceed: false,
            moderationMessage: moderationMessage.message,
            response: NextResponse.json(
              {
                success: false,
                error: result.errorMessage,
                quotaInfo: {
                  currentCount: result.currentCount,
                  remainingCount: result.remainingCount,
                  projectStatus: result.projectStatus
                },
                moderationMessage: moderationMessage.message
              },
              { status: 429 }
            )
          };
        }
        break;

      default:
        return {
          canProceed: false,
          response: NextResponse.json(
            { error: 'Type de quota non valide' },
            { status: 400 }
          )
        };
    }

    return { canProceed: true };

  } catch (error) {
    console.error('❌ Erreur quotaMiddleware:', error);
    return {
      canProceed: false,
      response: NextResponse.json(
        { error: 'Erreur serveur lors de la vérification des quotas' },
        { status: 500 }
      )
    };
  }
}

/**
 * Middleware wrapper pour les routes API
 */
export function withQuotaCheck(quotaCheck: QuotaCheck) {
  return async (request: NextRequest, context?: any) => {
    const quotaResult = await quotaMiddleware(request, quotaCheck);
    
    if (!quotaResult.canProceed) {
      return quotaResult.response;
    }

    // Continuer vers le handler normal
    return null;
  };
}

/**
 * Vérifie les quotas pour la création d'estimation
 */
export async function checkEstimationQuotas(
  clientId: string,
  professionalId: string,
  projectId?: string
): Promise<{
  canCreate: boolean;
  response?: NextResponse;
  moderationMessage?: any;
}> {
  const checks = [];

  // Vérifier quota client hebdomadaire
  const clientQuota = await quotaMiddleware(
    new Request('http://localhost:3000'),
    { type: 'client_weekly', userId: clientId }
  );

  if (!clientQuota.canProceed) {
    return clientQuota;
  }

  // Vérifier quota professionnel quotidien
  const proQuota = await quotaMiddleware(
    new Request('http://localhost:3000'),
    { type: 'professional_daily', professionalId }
  );

  if (!proQuota.canProceed) {
    return proQuota;
  }

  // Vérifier quota de projet si spécifié
  if (projectId) {
    const projectQuota = await quotaMiddleware(
      new Request('http://localhost:3000'),
      { type: 'project_responses', projectId }
    );

    if (!projectQuota.canProceed) {
      return projectQuota;
    }
  }

  return { canCreate: true };
}

/**
 * Formate les informations de quota pour l'affichage
 */
export function formatQuotaInfo(quotaInfo: any): string {
  if (!quotaInfo) return '';

  const { currentCount, remainingCount, resetTime, projectStatus } = quotaInfo;

  let message = `Quota: ${currentCount} utilisés, ${remainingCount} restants`;
  
  if (resetTime) {
    const resetDate = new Date(resetTime);
    message += ` • Reset: ${resetDate.toLocaleString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit',
      day: resetDate.toDateString() !== new Date().toDateString() ? 'numeric' : undefined,
      month: resetDate.toDateString() !== new Date().toDateString() ? 'numeric' : undefined
    })}`;
  }

  if (projectStatus) {
    message += ` • Statut: ${projectStatus}`;
  }

  return message;
}
