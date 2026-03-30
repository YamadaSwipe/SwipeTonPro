/**
 * @fileoverview Geolocation Matching Hook
 * @author Senior Architect
 * @version 1.0.0
 * 
 * React hook for geolocation-based project matching
 */

import { useState, useEffect, useCallback } from 'react';
import { geoMatchingService } from '@/services/geoMatchingService';
import { matchingService } from '@/services/matchingService-v2';
import { getSupabaseClient } from '@/lib/database/core';

interface UseGeoMatchingOptions {
  maxDistance?: number;
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface GeoMatchingResult {
  nearbyProfessionals: any[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  notifyNearby: () => Promise<{ notified: number; error: Error | null }>;
}

export function useGeoMatching(
  projectId: string,
  options: UseGeoMatchingOptions = {}
): GeoMatchingResult {
  const {
    maxDistance = 50,
    limit = 20,
    autoRefresh = false,
    refreshInterval = 30000 // 30 seconds
  } = options;

  const [nearbyProfessionals, setNearbyProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNearbyProfessionals = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);

      const { professionals, error: serviceError } = await geoMatchingService.findNearbyProfessionals(
        projectId,
        maxDistance,
        limit
      );

      if (serviceError) {
        throw serviceError;
      }

      setNearbyProfessionals(professionals || []);
    } catch (err) {
      console.error('Error loading nearby professionals:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setNearbyProfessionals([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, maxDistance, limit]);

  const refresh = useCallback(async () => {
    await loadNearbyProfessionals();
  }, [loadNearbyProfessionals]);

  const notifyNearby = useCallback(async () => {
    if (!projectId) return { notified: 0, error: new Error('Project ID required') };

    try {
      const result = await geoMatchingService.notifyNearbyProfessionals(projectId, maxDistance);
      return result;
    } catch (err) {
      console.error('Error notifying nearby professionals:', err);
      return { 
        notified: 0, 
        error: err instanceof Error ? err : new Error('Erreur inconnue')
      };
    }
  }, [projectId, maxDistance]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !projectId) return;

    const interval = setInterval(refresh, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refresh, projectId]);

  // Initial load
  useEffect(() => {
    loadNearbyProfessionals();
  }, [loadNearbyProfessionals]);

  return {
    nearbyProfessionals,
    loading,
    error,
    refresh,
    notifyNearby
  };
}

/**
 * Hook for professional's service area statistics
 */
export function useServiceAreaStats(professionalId: string) {
  const [stats, setStats] = useState<{
    totalProjects: number;
    nearbyProjects: number;
    averageDistance: number;
    coverageRate: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!professionalId) return;

    try {
      setLoading(true);
      setError(null);

      const serviceStats = await geoMatchingService.getServiceAreaStats(professionalId);
      setStats(serviceStats);
    } catch (err) {
      console.error('Error loading service area stats:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [professionalId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    refresh: loadStats
  };
}

/**
 * Hook for project matching workflow
 */
export function useProjectMatching(projectId: string) {
  const [workflow, setWorkflow] = useState<{
    status: 'idle' | 'accepting' | 'scheduling' | 'completing';
    error: string | null;
  }>({ status: 'idle', error: null });

  const acceptProfessional = useCallback(async (professionalId: string) => {
    try {
      setWorkflow({ status: 'accepting', error: null });

      const { data, error } = await matchingService.acceptProfessional(projectId, professionalId);

      if (error) {
        throw error;
      }

      setWorkflow({ status: 'idle', error: null });
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'acceptation';
      setWorkflow({ status: 'idle', error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [projectId]);

  const schedulePlanning = useCallback(async (
    professionalId: string,
    date: string,
    time: string
  ) => {
    try {
      setWorkflow({ status: 'scheduling', error: null });

      const { data, error } = await matchingService.schedulePlanning(
        projectId,
        professionalId,
        date,
        time
      );

      if (error) {
        throw error;
      }

      setWorkflow({ status: 'idle', error: null });
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la planification';
      setWorkflow({ status: 'idle', error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [projectId]);

  const completeProject = useCallback(async (professionalId: string) => {
    try {
      setWorkflow({ status: 'completing', error: null });

      const { data, error } = await matchingService.completeProject(projectId, professionalId);

      if (error) {
        throw error;
      }

      setWorkflow({ status: 'idle', error: null });
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la finalisation';
      setWorkflow({ status: 'idle', error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [projectId]);

  return {
    workflow,
    acceptProfessional,
    schedulePlanning,
    completeProject,
    reset: () => setWorkflow({ status: 'idle', error: null })
  };
}

/**
 * Hook for real-time project notifications
 */
export function useProjectNotifications(projectId: string) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!projectId) return;

    // Subscribe to real-time notifications for this project
    const client = getSupabaseClient();
    const subscription = client
      .channel(`project-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `data->>project_id=eq.${projectId}`
        },
        (payload) => {
          const newNotification = payload.new;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [projectId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      // Mark notification as read in database
      const client = getSupabaseClient();
      await client
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read_at: new Date().toISOString() }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead
  };
}
