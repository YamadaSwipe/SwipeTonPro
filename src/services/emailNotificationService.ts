/**
 * @fileoverview Email Notification Service - Workflow Steps
 * @author Senior Architect
 * @version 1.0.0
 *
 * Complete email notification system for all project workflow steps
 */

import { getSupabaseClient } from '@/lib/database/core';
import { databaseService } from './databaseService-v2';
import { emailService } from './emailService';

/**
 * Email notification service for workflow steps
 */
export class EmailNotificationService {
  private static instance: EmailNotificationService;
  private client = getSupabaseClient();

  static getInstance(): EmailNotificationService {
    if (!EmailNotificationService.instance) {
      EmailNotificationService.instance = new EmailNotificationService();
    }
    return EmailNotificationService.instance;
  }

  /**
   * Send notification when professional signals interest
   */
  async sendInterestNotification(
    projectId: string,
    professionalId: string
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      // Get project details
      const { data: project, error: projectError } = await this.client
        .from('projects')
        .select(
          `
          id,
          title,
          description,
          category,
          city,
          postal_code,
          estimated_budget_min,
          estimated_budget_max,
          client_id,
          client:profiles!projects_client_id_fkey(
            full_name,
            email,
            phone
          )
        `
        )
        .eq('id', projectId)
        .single();

      if (projectError || !project) {
        return {
          success: false,
          error: projectError || new Error('Projet non trouvé'),
        };
      }

      // Get professional details
      const { data: professional, error: proError } = await this.client
        .from('professionals')
        .select(
          `
          id,
          company_name,
          experience_years,
          rating_average,
          profiles!professionals_user_id_fkey(
            full_name,
            email,
            phone,
            avatar_url
          )
        `
        )
        .eq('id', professionalId)
        .single();

      if (proError || !professional) {
        return {
          success: false,
          error: proError || new Error('Professionnel non trouvé'),
        };
      }

      // Send email to client
      await this._sendEmail({
        to: project.client.email,
        template: 'professional_interested',
        data: {
          projectName: project.title,
          clientName: project.client.full_name,
          professionalName: professional.profiles[0].full_name,
          professionalCompany: professional.company_name,
          professionalEmail: professional.profiles[0].email,
          professionalPhone: professional.profiles[0].phone,
          professionalRating: professional.rating_average,
          professionalExperience: professional.experience_years,
          projectDescription: project.description,
          projectCategory: project.category,
          projectLocation: `${project.city} ${project.postal_code}`,
          projectBudget: this._formatBudget(
            project.estimated_budget_min,
            project.estimated_budget_max
          ),
          projectId: project.id,
        },
      });

      // Create in-app notification
      await databaseService.createNotification({
        user_id: project.client_id,
        title: 'Nouveau professionnel intéressé',
        message: `${professional.profiles[0].full_name} (${professional.company_name}) a montré de l'intérêt pour votre projet "${project.title}"`,
        type: 'new_interest',
        data: {
          project_id: projectId,
          professional_id: professionalId,
          professional_name: professional.profiles[0].full_name,
          professional_company: professional.company_name,
        },
      });

      return { success: true, error: null };
    } catch (err) {
      console.error('Error sending interest notification:', err);
      return { success: false, error: err as Error };
    }
  }

  /**
   * Send notification when client accepts professional
   */
  async sendAcceptanceNotification(
    projectId: string,
    professionalId: string
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      // Get project details
      const { data: project, error: projectError } = await this.client
        .from('projects')
        .select(
          `
          id,
          title,
          description,
          category,
          city,
          postal_code,
          estimated_budget_min,
          estimated_budget_max,
          client_id,
          client:profiles!projects_client_id_fkey(
            full_name,
            email,
            phone
          )
        `
        )
        .eq('id', projectId)
        .single();

      if (projectError || !project) {
        return {
          success: false,
          error: projectError || new Error('Projet non trouvé'),
        };
      }

      // Get professional details
      const { data: professional, error: proError } = await this.client
        .from('professionals')
        .select(
          `
          id,
          company_name,
          profiles!professionals_user_id_fkey(
            full_name,
            email,
            phone
          )
        `
        )
        .eq('id', professionalId)
        .single();

      if (proError || !professional) {
        return {
          success: false,
          error: proError || new Error('Professionnel non trouvé'),
        };
      }

      // Send email to professional
      await this._sendEmail({
        to: professional.profiles[0].email,
        template: 'project_accepted',
        data: {
          projectName: project.title,
          clientName: project.client.full_name,
          clientEmail: project.client.email,
          clientPhone: project.client.phone,
          professionalName: professional.profiles[0].full_name,
          projectDescription: project.description,
          projectCategory: project.category,
          projectLocation: `${project.city} ${project.postal_code}`,
          projectBudget: this._formatBudget(
            project.estimated_budget_min,
            project.estimated_budget_max
          ),
          projectId: project.id,
        },
      });

      // Create in-app notification
      await databaseService.createNotification({
        user_id: professionalId,
        title: 'Projet accepté !',
        message: `Félicitations ! ${project.client.full_name} vous a choisi pour le projet "${project.title}"`,
        type: 'project_accepted',
        data: {
          project_id: projectId,
          client_id: project.client_id,
          client_name: project.client.full_name,
        },
      });

      return { success: true, error: null };
    } catch (err) {
      console.error('Error sending acceptance notification:', err);
      return { success: false, error: err as Error };
    }
  }

  /**
   * Send notification for planning scheduled
   */
  async sendPlanningNotification(
    projectId: string,
    professionalId: string,
    planningDate: string,
    planningTime: string
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      // Get project and participant details
      const { data: project, error: projectError } = await this.client
        .from('projects')
        .select(
          `
          id,
          title,
          category,
          city,
          postal_code,
          client_id,
          client:profiles!projects_client_id_fkey(
            full_name,
            email,
            phone
          )
        `
        )
        .eq('id', projectId)
        .single();

      if (projectError || !project) {
        return {
          success: false,
          error: projectError || new Error('Projet non trouvé'),
        };
      }

      const { data: professional, error: proError } = await this.client
        .from('professionals')
        .select(
          `
          profiles!professionals_user_id_fkey(
            full_name,
            email,
            phone
          )
        `
        )
        .eq('id', professionalId)
        .single();

      if (proError || !professional) {
        return {
          success: false,
          error: proError || new Error('Professionnel non trouvé'),
        };
      }

      // Send emails to both parties
      await Promise.all([
        // Email to client
        this._sendEmail({
          to: project.client.email,
          template: 'planning_scheduled_client',
          data: {
            projectName: project.title,
            clientName: project.client.full_name,
            professionalName: professional.profiles[0].full_name,
            planningDate,
            planningTime,
            projectLocation: `${project.city} ${project.postal_code}`,
            projectId: project.id,
          },
        }),
        // Email to professional
        this._sendEmail({
          to: professional.profiles[0].email,
          template: 'planning_scheduled_professional',
          data: {
            projectName: project.title,
            clientName: project.client.full_name,
            clientPhone: project.client.phone,
            professionalName: professional.profiles[0].full_name,
            planningDate,
            planningTime,
            projectLocation: `${project.city} ${project.postal_code}`,
            projectId: project.id,
          },
        }),
      ]);

      // Create in-app notifications
      await Promise.all([
        databaseService.createNotification({
          user_id: project.client_id,
          title: 'Rendez-vous planifié',
          message: `Un rendez-vous est prévu avec ${professional.profiles[0].full_name} le ${planningDate} à ${planningTime}`,
          type: 'planning_scheduled',
          data: {
            project_id: projectId,
            professional_id: professionalId,
            planning_date: planningDate,
            planning_time: planningTime,
          },
        }),
        databaseService.createNotification({
          user_id: professionalId,
          title: 'Rendez-vous planifié',
          message: `Rendez-vous planifié avec ${project.client.full_name} le ${planningDate} à ${planningTime}`,
          type: 'planning_scheduled',
          data: {
            project_id: projectId,
            client_id: project.client_id,
            planning_date: planningDate,
            planning_time: planningTime,
          },
        }),
      ]);

      return { success: true, error: null };
    } catch (err) {
      console.error('Error sending planning notification:', err);
      return { success: false, error: err as Error };
    }
  }

  /**
   * Send notification for project completion
   */
  async sendCompletionNotification(
    projectId: string,
    professionalId: string
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      // Get project details
      const { data: project, error: projectError } = await this.client
        .from('projects')
        .select(
          `
          id,
          title,
          category,
          client_id,
          client:profiles!projects_client_id_fkey(
            full_name,
            email
          )
        `
        )
        .eq('id', projectId)
        .single();

      if (projectError || !project) {
        return {
          success: false,
          error: projectError || new Error('Projet non trouvé'),
        };
      }

      const { data: professional, error: proError } = await this.client
        .from('professionals')
        .select(
          `
          profiles!professionals_user_id_fkey(
            full_name,
            email
          )
        `
        )
        .eq('id', professionalId)
        .single();

      if (proError || !professional) {
        return {
          success: false,
          error: proError || new Error('Professionnel non trouvé'),
        };
      }

      // Send completion emails
      await Promise.all([
        // Email to client - requesting review
        this._sendEmail({
          to: project.client.email,
          template: 'project_completed_client',
          data: {
            projectName: project.title,
            clientName: project.client.full_name,
            professionalName: professional.profiles[0].full_name,
            projectId: project.id,
          },
        }),
        // Email to professional - requesting review
        this._sendEmail({
          to: professional.profiles[0].email,
          template: 'project_completed_professional',
          data: {
            projectName: project.title,
            clientName: project.client.full_name,
            professionalName: professional.profiles[0].full_name,
            projectId: project.id,
          },
        }),
      ]);

      // Create in-app notifications
      await Promise.all([
        databaseService.createNotification({
          user_id: project.client_id,
          title: 'Projet terminé',
          message: `Le projet "${project.title}" est terminé. Veuillez laisser un avis pour ${professional.profiles[0].full_name}`,
          type: 'project_completed',
          data: {
            project_id: projectId,
            professional_id: professionalId,
            professional_name: professional.profiles[0].full_name,
          },
        }),
        databaseService.createNotification({
          user_id: professionalId,
          title: 'Projet terminé',
          message: `Le projet "${project.title}" est terminé. Veuillez laisser un avis pour ${project.client.full_name}`,
          type: 'project_completed',
          data: {
            project_id: projectId,
            client_id: project.client_id,
            client_name: project.client.full_name,
          },
        }),
      ]);

      return { success: true, error: null };
    } catch (err) {
      console.error('Error sending completion notification:', err);
      return { success: false, error: err as Error };
    }
  }

  /**
   * Send reminder for upcoming planning
   */
  async sendPlanningReminder(
    projectId: string,
    professionalId: string,
    planningDate: string,
    planningTime: string
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      // Get project details
      const { data: project, error: projectError } = await this.client
        .from('projects')
        .select(
          `
          id,
          title,
          city,
          postal_code,
          client_id,
          client:profiles!projects_client_id_fkey(
            full_name,
            email,
            phone
          )
        `
        )
        .eq('id', projectId)
        .single();

      if (projectError || !project) {
        return {
          success: false,
          error: projectError || new Error('Projet non trouvé'),
        };
      }

      const { data: professional, error: proError } = await this.client
        .from('professionals')
        .select(
          `
          profiles!professionals_user_id_fkey(
            full_name,
            email,
            phone
          )
        `
        )
        .eq('id', professionalId)
        .single();

      if (proError || !professional) {
        return {
          success: false,
          error: proError || new Error('Professionnel non trouvé'),
        };
      }

      // Send reminder emails
      await Promise.all([
        this._sendEmail({
          to: project.client.email,
          template: 'planning_reminder_client',
          data: {
            projectName: project.title,
            clientName: project.client.full_name,
            professionalName: professional.profiles[0].full_name,
            professionalPhone: professional.profiles[0].phone,
            planningDate,
            planningTime,
            projectLocation: `${project.city} ${project.postal_code}`,
            projectId: project.id,
          },
        }),
        this._sendEmail({
          to: professional.profiles[0].email,
          template: 'planning_reminder_professional',
          data: {
            projectName: project.title,
            clientName: project.client.full_name,
            clientPhone: project.client.phone,
            professionalName: professional.profiles[0].full_name,
            planningDate,
            planningTime,
            projectLocation: `${project.city} ${project.postal_code}`,
            projectId: project.id,
          },
        }),
      ]);

      return { success: true, error: null };
    } catch (err) {
      console.error('Error sending planning reminder:', err);
      return { success: false, error: err as Error };
    }
  }

  /**
   * Send email using the email service
   */
  async _sendEmail(params: {
    to: string;
    template: string;
    data: any;
  }): Promise<void> {
    try {
      const rendered = this._renderEmailTemplate(params.template, params.data);
      const result = await emailService.sendEmail({
        to: params.to,
        subject: rendered.subject,
        html: rendered.html,
      });

      if (!result.success) {
        throw new Error(result.error || 'Email delivery failed');
      }
    } catch (err) {
      console.error('Error sending email:', err);
      throw err;
    }
  }

  private _renderEmailTemplate(
    template: string,
    data: Record<string, any>
  ): { subject: string; html: string } {
    const ctaUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.swipetonpro.fr'}/particulier/projects/${data.projectId || ''}`;

    const wrap = (title: string, intro: string, details: string[], ctaLabel: string) => ({
      subject: title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #1f2937;">
          <div style="background: linear-gradient(135deg, #ea580c, #f97316); padding: 24px; color: white; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 26px;">SwipeTonPro</h1>
            <p style="margin: 8px 0 0; opacity: 0.92;">${title}</p>
          </div>
          <div style="border: 1px solid #e5e7eb; border-top: 0; padding: 24px; border-radius: 0 0 12px 12px; background: white;">
            <p style="line-height: 1.7; margin-top: 0;">${intro}</p>
            <div style="background: #f9fafb; border-radius: 10px; padding: 16px; margin: 20px 0;">
              ${details.map((detail) => `<p style="margin: 6px 0;">${detail}</p>`).join('')}
            </div>
            <p style="margin: 24px 0 0;">
              <a href="${ctaUrl}" style="display: inline-block; background: #ea580c; color: white; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600;">${ctaLabel}</a>
            </p>
          </div>
        </div>
      `,
    });

    switch (template) {
      case 'professional_interested':
        return wrap(
          `Nouveau professionnel intéressé pour ${data.projectName}`,
          `Bonjour ${data.clientName || ''}, un professionnel a manifesté son intérêt pour votre projet.`,
          [
            `<strong>Professionnel :</strong> ${data.professionalName || ''}`,
            `<strong>Société :</strong> ${data.professionalCompany || ''}`,
            `<strong>Projet :</strong> ${data.projectName || ''}`,
            `<strong>Budget :</strong> ${data.projectBudget || 'Non spécifié'}`,
            `<strong>Localisation :</strong> ${data.projectLocation || 'Non spécifiée'}`,
          ],
          'Voir le projet'
        );
      case 'project_accepted':
        return wrap(
          `Votre devis a été accepté pour ${data.projectName}`,
          `Bonjour ${data.professionalName || ''}, ${data.clientName || 'un client'} vous a sélectionné pour son projet.`,
          [
            `<strong>Projet :</strong> ${data.projectName || ''}`,
            `<strong>Client :</strong> ${data.clientName || ''}`,
            `<strong>Email client :</strong> ${data.clientEmail || ''}`,
            `<strong>Téléphone client :</strong> ${data.clientPhone || 'Non renseigné'}`,
          ],
          'Accéder au projet'
        );
      case 'planning_scheduled_client':
      case 'planning_scheduled_professional':
        return wrap(
          `Rendez-vous planifié pour ${data.projectName}`,
          `Le rendez-vous a été programmé pour votre projet ${data.projectName || ''}.`,
          [
            `<strong>Date :</strong> ${data.planningDate || ''}`,
            `<strong>Heure :</strong> ${data.planningTime || ''}`,
            `<strong>Interlocuteur :</strong> ${data.professionalName || data.clientName || ''}`,
            `<strong>Lieu :</strong> ${data.projectLocation || 'Non précisé'}`,
          ],
          'Voir le rendez-vous'
        );
      case 'project_completed_client':
      case 'project_completed_professional':
        return wrap(
          `Projet terminé: ${data.projectName}`,
          `Le projet ${data.projectName || ''} est marqué comme terminé.`,
          [
            `<strong>Projet :</strong> ${data.projectName || ''}`,
            `<strong>Client :</strong> ${data.clientName || ''}`,
            `<strong>Professionnel :</strong> ${data.professionalName || ''}`,
            `Vous pouvez maintenant laisser un avis sur cette collaboration.`,
          ],
          'Laisser un avis'
        );
      case 'planning_reminder_client':
      case 'planning_reminder_professional':
        return wrap(
          `Rappel de rendez-vous pour ${data.projectName}`,
          `Rappel: votre rendez-vous approche pour le projet ${data.projectName || ''}.`,
          [
            `<strong>Date :</strong> ${data.planningDate || ''}`,
            `<strong>Heure :</strong> ${data.planningTime || ''}`,
            `<strong>Lieu :</strong> ${data.projectLocation || 'Non précisé'}`,
            `<strong>Contact :</strong> ${data.professionalPhone || data.clientPhone || 'Voir le dashboard'}`,
          ],
          'Ouvrir le dashboard'
        );
      default:
        return wrap(
          'Notification SwipeTonPro',
          'Une mise à jour importante est disponible sur votre projet.',
          [
            `<strong>Projet :</strong> ${data.projectName || 'Projet en cours'}`,
          ],
          'Voir le projet'
        );
    }
  }

  /**
   * Format budget range
   */
  private _formatBudget(min?: number, max?: number): string {
    if (min && max) {
      return `${this._formatCurrency(min)} - ${this._formatCurrency(max)}`;
    }
    if (min) return `à partir de ${this._formatCurrency(min)}`;
    if (max) return `jusqu'à ${this._formatCurrency(max)}`;
    return 'Budget non spécifié';
  }

  /**
   * Format currency
   */
  private _formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }
}

// Export singleton instance
export const emailNotificationService = EmailNotificationService.getInstance();

// Export default for easier imports
export default emailNotificationService;
