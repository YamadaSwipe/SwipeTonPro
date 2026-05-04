/**
 * @fileoverview Optimized Matching Service - Stable Architecture
 * @author Senior Architect
 * @version 2.0.0
 *
 * Replaces problematic matchingService with a stable, optimized version
 */

import { databaseService } from './databaseService-v2';
import { getSupabaseClient } from '@/lib/database/core';
import { geoMatchingService } from './geoMatchingService';
import { emailNotificationService } from './emailNotificationService';
import CentralAuthService from './centralAuthService';

/**
 * Optimized Matching Service with proper error handling
 */
export class MatchingServiceV2 {
  private static instance: MatchingServiceV2;
  private client = getSupabaseClient();

  static getInstance(): MatchingServiceV2 {
    if (!MatchingServiceV2.instance) {
      MatchingServiceV2.instance = new MatchingServiceV2();
    }
    return MatchingServiceV2.instance;
  }

  /**
   * Professional signals interest in a project
   * Fixed version that handles all database schema issues
   */
  async signalInterest(
    projectId: string
  ): Promise<{ data: any; error: Error | null }> {
    try {
      console.log('🚀 Starting signalInterest for project:', projectId);

      // Get current user from CentralAuthService (SOURCE UNIQUE DE VÉRITÉ)
      const authService = CentralAuthService.getInstance();
      const {
        user,
        professional,
        role,
        error: authError,
      } = await authService.getAuthData();

      if (authError) {
        console.error('❌ Auth service error:', authError);
        return { data: null, error: new Error("Erreur d'authentification") };
      }

      if (!user) {
        console.error('❌ User not authenticated');
        return { data: null, error: new Error('Utilisateur non connecté') };
      }

      if (role !== 'professional') {
        console.error('❌ User is not a professional:', role);
        return {
          data: null,
          error: new Error('Accès non autorisé - rôle invalide'),
        };
      }

      if (!professional) {
        console.error('❌ Professional profile not found');
        return {
          data: null,
          error: new Error('Profil professionnel non trouvé'),
        };
      }

      console.log('✅ User authenticated:', user.id);
      console.log('✅ Professional validated:', professional.company_name);

      console.log('✅ Professional found:', professional.id);

      // Check if already interested
      const { data: existingInterest, error: checkError } = await this.client
        .from('project_interests')
        .select('*')
        .eq('project_id', projectId)
        .eq('professional_id', professional.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Error checking existing interest:', checkError);
        return { data: null, error: checkError };
      }

      if (existingInterest) {
        console.log('⚠️ Interest already exists');
        return {
          data: null,
          error: new Error(
            'Vous avez déjà signalé votre intérêt pour ce projet'
          ),
        };
      }

      console.log('✅ No existing interest, creating new one...');

      // Insert the interest
      const { data, error } = await this.client
        .from('project_interests')
        .insert({
          project_id: projectId,
          professional_id: professional.id,
          status: 'interested',
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error inserting interest:', error);
        throw error;
      }

      console.log('✅ Interest created successfully:', data);

      // Get project details for notification
      const { data: project } = await this.client
        .from('projects')
        .select('title, client_id')
        .eq('id', projectId)
        .single();

      // Send notification to client using our optimized service
      if (project?.client_id) {
        console.log('📧 Sending interest notification...');
        await this._sendInterestNotification({
          userId: project.client_id,
          projectId: projectId,
          projectName: project.title,
          professionalId: professional.id,
        });
      }

      // APPEL API POUR NOTIFICATIONS EMAIL (Client + Admin)
      console.log('📧 Sending email notifications via new API...');
      try {
        // Récupérer le token d'authentification
        const {
          data: { session },
        } = await this.client.auth.getSession();

        if (!session || !session.access_token) {
          console.warn('⚠️ No session found, skipping email notifications');
        } else {
          const response = await fetch(
            '/api/notifications/send-interest-email',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                projectId: projectId,
                professionalId: professional.id,
              }),
            }
          );

          if (response.ok) {
            const result = await response.json();
            console.log('✅ Email notifications sent successfully:', result);
          } else {
            console.error(
              '❌ Failed to send email notifications:',
              await response.text()
            );
          }
        }
      } catch (emailError) {
        console.error('❌ Error sending email notifications:', emailError);
        // Continuer même si les emails échouent
      }

      // Notify nearby professionals about this project (non-blocking)
      console.log('📍 Notifying nearby professionals...');
      try {
        await geoMatchingService.notifyNearbyProfessionals(projectId, 30);
      } catch (geoError) {
        console.warn('⚠️ Could not notify nearby professionals:', geoError);
        // Continue even if geo notification fails
      }

      return { data, error: null };
    } catch (err) {
      console.error('Error in signalInterest:', err);
      return { data: null, error: err as Error };
    }
  }

  /**
   * Send notification for project interest
   * Private method to handle notification logic
   */
  private async _sendInterestNotification(data: {
    userId: string;
    projectId: string;
    projectName: string;
    professionalId: string;
  }): Promise<void> {
    try {
      console.log('🔔 Creating in-app notification:', data);

      const notificationData = {
        user_id: data.userId,
        title: 'Nouveau professionnel intéressé',
        message: `Un professionnel a montré de l'intérêt pour votre projet "${data.projectName}"`,
        type: 'new_interest',
        data: {
          project_id: data.projectId,
          professional_id: data.professionalId,
        },
      };

      console.log('📧 Notification data:', notificationData);

      const { error } =
        await databaseService.createNotification(notificationData);

      if (error) {
        console.error('❌ Notification error:', error);
        // Don't throw - notification failure shouldn't break the interest signal
      } else {
        console.log('✅ Notification sent successfully');
      }
    } catch (notifError) {
      console.warn('⚠️ Erreur notification (non critique):', notifError);
      // Never throw here - notification is secondary to the main action
    }
  }

  /**
   * Get all interests for a project
   */
  async getProjectInterests(projectId: string) {
    try {
      const { data, error } = await this.client
        .from('project_interests')
        .select(
          `
          *,
          professional:professionals!project_interests_professional_id_fkey(
            id,
            company_name,
            user_id,
            profiles!professionals_user_id_fkey(full_name, avatar_url)
          )
        `
        )
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Get all interests for a professional
   */
  async getProfessionalInterests(professionalId: string) {
    try {
      const { data, error } = await this.client
        .from('project_interests')
        .select(
          `
          *,
          project:projects!project_interests_project_id_fkey(
            id,
            title,
            category,
            city,
            estimated_budget_min,
            estimated_budget_max,
            status,
            created_at
          )
        `
        )
        .eq('professional_id', professionalId)
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Update interest status
   */
  async updateInterestStatus(
    interestId: string,
    status: 'interested' | 'not_interested' | 'maybe'
  ) {
    try {
      const { data, error } = await this.client
        .from('project_interests')
        .update({ status })
        .eq('id', interestId)
        .select()
        .single();

      return { data, error };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Delete interest
   */
  async deleteInterest(interestId: string) {
    try {
      const { data, error } = await this.client
        .from('project_interests')
        .delete()
        .eq('id', interestId);

      return { data, error };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Get nearby professionals for a project (geolocation-based matching)
   */
  async getNearbyProfessionals(projectId: string, maxDistanceKm: number = 50) {
    try {
      const { professionals, error } =
        await geoMatchingService.findNearbyProfessionals(
          projectId,
          maxDistanceKm,
          20
        );

      return { data: professionals, error };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  /**
   * Accept a professional for a project
   */
  async acceptProfessional(
    projectId: string,
    professionalId: string
  ): Promise<{ data: any; error: Error | null }> {
    try {
      // Update project status
      const { data: project, error: updateError } = await this.client
        .from('projects')
        .update({
          status: 'in_progress',
          assigned_professional_id: professionalId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update professional interest status
      await this.client
        .from('project_interests')
        .update({ status: 'accepted' })
        .eq('project_id', projectId)
        .eq('professional_id', professionalId);

      // Send acceptance notifications
      await emailNotificationService.sendAcceptanceNotification(
        projectId,
        professionalId
      );

      return { data: project, error: null };
    } catch (err) {
      console.error('Error accepting professional:', err);
      return { data: null, error: err as Error };
    }
  }

  /**
   * Schedule planning for a project
   */
  async schedulePlanning(
    projectId: string,
    professionalId: string,
    planningDate: string,
    planningTime: string
  ): Promise<{ data: any; error: Error | null }> {
    try {
      // Create planning entry
      const { data: planning, error: planningError } = await this.client
        .from('project_planning' as any)
        .insert({
          project_id: projectId,
          professional_id: professionalId,
          date: planningDate,
          time: planningTime,
          status: 'scheduled',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (planningError) throw planningError;

      // Send planning notifications
      await emailNotificationService.sendPlanningNotification(
        projectId,
        professionalId,
        planningDate,
        planningTime
      );

      return { data: planning, error: null };
    } catch (err) {
      console.error('Error scheduling planning:', err);
      return { data: null, error: err as Error };
    }
  }

  /**
   * Complete a project
   */
  async completeProject(
    projectId: string,
    professionalId: string
  ): Promise<{ data: any; error: Error | null }> {
    try {
      // Update project status
      const { data: project, error: updateError } = await this.client
        .from('projects')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', projectId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Send completion notifications
      await emailNotificationService.sendCompletionNotification(
        projectId,
        professionalId
      );

      return { data: project, error: null };
    } catch (err) {
      console.error('Error completing project:', err);
      return { data: null, error: err as Error };
    }
  }
  /**
   * Get matching statistics for a professional
   */
  async getProfessionalStats(professionalId: string) {
    try {
      const { data: interests, error: interestsError } = await this.client
        .from('project_interests')
        .select('status, created_at')
        .eq('professional_id', professionalId);

      if (interestsError) throw interestsError;

      const stats = {
        total: interests?.length || 0,
        interested:
          interests?.filter((i) => i.status === 'interested').length || 0,
        maybe: interests?.filter((i) => i.status === 'maybe').length || 0,
        not_interested:
          interests?.filter((i) => i.status === 'not_interested').length || 0,
        thisMonth:
          interests?.filter((i) => {
            const createdAt = new Date(i.created_at);
            const now = new Date();
            return (
              createdAt.getMonth() === now.getMonth() &&
              createdAt.getFullYear() === now.getFullYear()
            );
          }).length || 0,
      };

      return { data: stats, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }
}

// Export singleton instance
export const matchingService = MatchingServiceV2.getInstance();

// Export default for easier imports
export default matchingService;
