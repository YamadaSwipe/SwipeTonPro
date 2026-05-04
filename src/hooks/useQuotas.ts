import { useState, useEffect, useCallback } from 'react';
import { rateLimitingService } from '@/services/rateLimitingService';
import { fluxModerationService } from '@/services/fluxModerationService';

interface QuotaState {
  canProceed: boolean;
  currentCount: number;
  remainingCount: number;
  resetTime: string;
  isLoading: boolean;
  error?: string;
  moderationMessage?: any;
}

interface UseProfessionalQuotaReturn extends QuotaState {
  refresh: () => Promise<void>;
  checkBeforeAction: () => Promise<boolean>;
}

interface UseClientQuotaReturn extends QuotaState {
  refresh: () => Promise<void>;
  checkBeforeAction: () => Promise<boolean>;
}

interface UseProjectQuotaReturn extends QuotaState {
  refresh: () => Promise<void>;
  checkBeforeAction: () => Promise<boolean>;
}

/**
 * Hook pour gérer les quotas professionnels (5 estimations/jour)
 */
export function useProfessionalQuota(professionalId: string | null): UseProfessionalQuotaReturn {
  const [state, setState] = useState<QuotaState>({
    canProceed: false,
    currentCount: 0,
    remainingCount: 0,
    resetTime: '',
    isLoading: true
  });

  const refresh = useCallback(async () => {
    if (!professionalId) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const result = await rateLimitingService.checkProfessionalDailyLimit(professionalId);
      const moderation = await fluxModerationService.checkProfessionalFlux(professionalId);

      setState({
        canProceed: result.canSendEstimate,
        currentCount: result.currentCount,
        remainingCount: result.remainingCount,
        resetTime: result.resetTime,
        isLoading: false,
        error: result.errorMessage,
        moderationMessage: moderation.message
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Erreur lors de la vérification des quotas'
      }));
    }
  }, [professionalId]);

  const checkBeforeAction = useCallback(async (): Promise<boolean> => {
    if (!professionalId) return false;
    
    await refresh();
    return state.canProceed;
  }, [professionalId, refresh, state.canProceed]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    ...state,
    refresh,
    checkBeforeAction
  };
}

/**
 * Hook pour gérer les quotas clients (2 estimations/semaine)
 */
export function useClientQuota(clientId: string | null): UseClientQuotaReturn {
  const [state, setState] = useState<QuotaState>({
    canProceed: false,
    currentCount: 0,
    remainingCount: 0,
    resetTime: '',
    isLoading: true
  });

  const refresh = useCallback(async () => {
    if (!clientId) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const result = await rateLimitingService.checkClientWeeklyLimit(clientId);
      const moderation = await fluxModerationService.checkClientFlux(clientId);

      setState({
        canProceed: result.canCreateEstimate,
        currentCount: result.currentCount,
        remainingCount: result.remainingCount,
        resetTime: result.resetTime,
        isLoading: false,
        error: result.errorMessage,
        moderationMessage: moderation.message
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Erreur lors de la vérification des quotas'
      }));
    }
  }, [clientId]);

  const checkBeforeAction = useCallback(async (): Promise<boolean> => {
    if (!clientId) return false;
    
    await refresh();
    return state.canProceed;
  }, [clientId, refresh, state.canProceed]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    ...state,
    refresh,
    checkBeforeAction
  };
}

/**
 * Hook pour gérer les quotas de projet (3 réponses max)
 */
export function useProjectQuota(projectId: string | null): UseProjectQuotaReturn {
  const [state, setState] = useState<QuotaState>({
    canProceed: false,
    currentCount: 0,
    remainingCount: 0,
    resetTime: '',
    isLoading: true
  });

  const refresh = useCallback(async () => {
    if (!projectId) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const result = await rateLimitingService.checkProjectEstimationLimit(projectId);
      const moderation = await fluxModerationService.checkProjectFlux(projectId);

      setState({
        canProceed: result.canReceiveEstimate,
        currentCount: result.currentCount,
        remainingCount: result.remainingCount,
        resetTime: '',
        isLoading: false,
        error: result.errorMessage,
        moderationMessage: moderation.message
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Erreur lors de la vérification des quotas'
      }));
    }
  }, [projectId]);

  const checkBeforeAction = useCallback(async (): Promise<boolean> => {
    if (!projectId) return false;
    
    await refresh();
    return state.canProceed;
  }, [projectId, refresh, state.canProceed]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    ...state,
    refresh,
    checkBeforeAction
  };
}

/**
 * Hook combiné pour vérifier tous les quotas avant une action
 */
export function useQuotaCheck(options: {
  professionalId?: string;
  clientId?: string;
  projectId?: string;
}) {
  const [isChecking, setIsChecking] = useState(false);
  const [canProceed, setCanProceed] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const checkAll = useCallback(async (): Promise<boolean> => {
    setIsChecking(true);
    setErrors([]);

    const checks = [];

    if (options.professionalId) {
      checks.push(
        rateLimitingService.checkProfessionalDailyLimit(options.professionalId)
          .then(r => r.canSendEstimate ? null : 'Quota professionnel atteint')
      );
    }

    if (options.clientId) {
      checks.push(
        rateLimitingService.checkClientWeeklyLimit(options.clientId)
          .then(r => r.canCreateEstimate ? null : 'Quota client atteint')
      );
    }

    if (options.projectId) {
      checks.push(
        rateLimitingService.checkProjectEstimationLimit(options.projectId)
          .then(r => r.canReceiveEstimate ? null : 'Quota projet atteint')
      );
    }

    const results = await Promise.all(checks);
    const errors = results.filter((r): r is string => r !== null);

    setErrors(errors);
    setCanProceed(errors.length === 0);
    setIsChecking(false);

    return errors.length === 0;
  }, [options]);

  return {
    checkAll,
    isChecking,
    canProceed,
    errors
  };
}

export type { QuotaState };
