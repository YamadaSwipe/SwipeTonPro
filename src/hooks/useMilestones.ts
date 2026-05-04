import { useState, useCallback, useEffect } from 'react';
import { milestoneService } from '@/services/milestoneService';

interface Milestone {
  id: string;
  project_id: string;
  milestone_name: string;
  milestone_order: number;
  percentage: number;
  amount: number;
  status: 'pending' | 'in_progress' | 'completed' | 'disputed';
  pro_validation_photos?: string[];
  client_validation_status?: 'approved' | 'rejected' | 'disputed';
  stripe_transfer_id?: string;
  created_at: string;
  updated_at: string;
}

interface UseMilestonesReturn {
  milestones: Milestone[];
  isLoading: boolean;
  error: string | null;
  loadMilestones: () => Promise<void>;
  validateByProfessional: (
    milestoneId: string,
    photos: string[],
    notes?: string
  ) => Promise<boolean>;
  validateByClient: (
    milestoneId: string,
    status: 'approved' | 'rejected' | 'disputed',
    notes?: string
  ) => Promise<boolean>;
  getProgress: () => {
    completed: number;
    total: number;
    percentage: number;
    totalReleased: number;
  };
}

/**
 * Hook pour gérer les milestones d'un projet
 */
export function useMilestones(projectId: string | null): UseMilestonesReturn {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMilestones = useCallback(async () => {
    if (!projectId) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await milestoneService.getProjectMilestones(projectId);

      if (result.success && result.milestones) {
        setMilestones(result.milestones as Milestone[]);
      } else {
        setError(result.error || 'Erreur lors du chargement des milestones');
      }
    } catch (err) {
      setError('Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const validateByProfessional = useCallback(async (
    milestoneId: string,
    photos: string[],
    notes?: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await milestoneService.validateByProfessional(
        milestoneId,
        photos,
        notes
      );

      if (result.success) {
        await loadMilestones();
        return true;
      } else {
        setError(result.error || 'Erreur lors de la validation');
        return false;
      }
    } catch (err) {
      setError('Erreur lors de la validation');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [loadMilestones]);

  const validateByClient = useCallback(async (
    milestoneId: string,
    status: 'approved' | 'rejected' | 'disputed',
    notes?: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await milestoneService.validateByClient(milestoneId, {
        milestoneId,
        proValidationPhotos: [],
        clientValidationStatus: status,
        clientValidationNotes: notes
      });

      if (result.success) {
        await loadMilestones();
        return true;
      } else {
        setError(result.error || 'Erreur lors de la validation');
        return false;
      }
    } catch (err) {
      setError('Erreur lors de la validation');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [loadMilestones]);

  const getProgress = useCallback(() => {
    const completed = milestones.filter(m => m.status === 'completed').length;
    const total = milestones.length;
    const totalReleased = milestones
      .filter(m => m.status === 'completed')
      .reduce((sum, m) => sum + m.amount, 0);

    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      totalReleased
    };
  }, [milestones]);

  useEffect(() => {
    loadMilestones();
  }, [loadMilestones]);

  return {
    milestones,
    isLoading,
    error,
    loadMilestones,
    validateByProfessional,
    validateByClient,
    getProgress
  };
}

export type { Milestone, UseMilestonesReturn };
