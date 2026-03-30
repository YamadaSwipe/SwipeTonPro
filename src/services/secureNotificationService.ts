/**
 * @fileoverview SÉCURISÉ - Service de Notifications Email
 * @author Senior Security Architect
 * @version 2.0.0
 * 
 * Service complet et sécurisé pour toutes les notifications email
 * avec validation, traçabilité et protection anti-abus
 */

import { supabase } from '@/integrations/supabase/client';
import { sendEmailServerSide } from '@/lib/email';

// Types sécurisés pour les notifications
interface SecureNotificationData {
  type: 'professional_interested' | 'project_accepted' | 'new_project_admin' | 'new_professional_admin' | 'match_completed' | 'project_validated' | 'project_rejected';
  recipients: string[];
  data: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  userId?: string; // Pour traçabilité
}

interface NotificationLog {
  id: string;
  type: string;
  recipients: string[];
  status: 'pending' | 'sent' | 'failed';
  error_message?: string;
  created_at: string;
  user_id?: string;
  priority: string;
}

/**
 * Service de notifications sécurisées avec validation et traçabilité
 */
export class SecureNotificationService {
  private static instance: SecureNotificationService;
  private rateLimitMap = new Map<string, { count: number; lastSent: number }>();
  private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute en ms
  private readonly RATE_LIMIT_MAX = 10; // Max 10 emails/minute

  static getInstance(): SecureNotificationService {
    if (!SecureNotificationService.instance) {
      SecureNotificationService.instance = new SecureNotificationService();
    }
    return SecureNotificationService.instance;
  }

  /**
   * Vérifier le rate limiting pour prévenir les abus
   */
  private checkRateLimit(userId: string, type: string): boolean {
    const key = `${userId}_${type}`;
    const now = Date.now();
    const userLimit = this.rateLimitMap.get(key);

    if (!userLimit) {
      this.rateLimitMap.set(key, { count: 1, lastSent: now });
      return true;
    }

    // Reset si la fenêtre est expirée
    if (now - userLimit.lastSent > this.RATE_LIMIT_WINDOW) {
      this.rateLimitMap.set(key, { count: 1, lastSent: now });
      return true;
    }

    // Vérifier le nombre maximum
    if (userLimit.count >= this.RATE_LIMIT_MAX) {
      console.warn(`🚨 Rate limit exceeded for user ${userId}, type ${type}`);
      return false;
    }

    userLimit.count++;
    userLimit.lastSent = now;
    return true;
  }

  /**
   * Valider les données de notification
   */
  private validateNotificationData(data: SecureNotificationData): { valid: boolean; error?: string } {
    if (!data.type || !data.recipients || data.recipients.length === 0) {
      return { valid: false, error: 'Type et recipients requis' };
    }

    if (!Array.isArray(data.recipients)) {
      return { valid: false, error: 'Recipients doit être un tableau' };
    }

    // Valider les emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of data.recipients) {
      if (!emailRegex.test(email)) {
        return { valid: false, error: `Email invalide: ${email}` };
      }
    }

    // Types de notifications valides
    const validTypes = [
      'professional_interested', 'project_accepted', 'new_project_admin', 
      'new_professional_admin', 'match_completed', 'project_validated', 'project_rejected'
    ];
    if (!validTypes.includes(data.type)) {
      return { valid: false, error: `Type de notification invalide: ${data.type}` };
    }

    return { valid: true };
  }

  /**
   * Logger les notifications pour audit
   */
  private async logNotification(data: SecureNotificationData, status: 'pending' | 'sent' | 'failed', errorMessage?: string): Promise<void> {
    try {
      const logEntry: Omit<NotificationLog, 'id' | 'created_at'> = {
        type: data.type,
        recipients: data.recipients,
        status,
        error_message: errorMessage,
        user_id: data.userId,
        priority: data.priority
      };

      await supabase
        .from('notification_logs')
        .insert(logEntry);
    } catch (error) {
      console.error('❌ Erreur logging notification:', error);
    }
  }

  /**
   * 🎯 NOTIFICATION 1: Pro intéresse un projet -> Particulier
   */
  async notifyProfessionalInterest(projectId: string, professionalId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔔 Notification: Pro intéresse un projet');

      // Récupérer les données nécessaires
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select(`
          id, title, description, category, city, postal_code,
          estimated_budget_min, estimated_budget_max, client_id,
          client:profiles!projects_client_id_fkey(full_name, email, phone)
        `)
        .eq('id', projectId)
        .single();

      if (projectError || !project) {
        return { success: false, error: 'Projet non trouvé' };
      }

      const { data: professional, error: proError } = await supabase
        .from('professionals')
        .select(`
          id, company_name, experience_years, rating_average,
          profiles!professionals_user_id_fkey(full_name, email, phone, avatar_url)
        `)
        .eq('id', professionalId)
        .single();

      if (proError) {
        console.error('❌ Supabase error fetching professional:', proError);
        return { success: false, error: `Erreur base de données: ${proError.message}` };
      }

      if (!professional) {
        console.error('❌ Professional not found with ID:', professionalId);
        return { success: false, error: 'Professionnel non trouvé' };
      }

      console.log('✅ Professional found:', professional.company_name);

      // Rate limiting
      if (!this.checkRateLimit(project.client_id, 'professional_interested')) {
        return { success: false, error: 'Trop de notifications envoyées' };
      }

      const notificationData: SecureNotificationData = {
        type: 'professional_interested',
        recipients: [project.client.email],
        data: {
          projectName: project.title,
          clientName: project.client.full_name,
          professionalName: professional.profiles.full_name,
          professionalCompany: professional.company_name,
          professionalRating: professional.rating_average,
          professionalExperience: professional.experience_years,
          projectDescription: project.description,
          projectCategory: project.category,
          projectLocation: `${project.city} ${project.postal_code}`,
          projectBudget: this.formatBudget(project.estimated_budget_min, project.estimated_budget_max),
          projectId: project.id
        },
        priority: 'medium',
        userId: project.client_id
      };

      const validation = this.validateNotificationData(notificationData);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Logger la notification
      await this.logNotification(notificationData, 'pending');

      // Envoyer l'email
      const emailHtml = this.generateProfessionalInterestEmail(notificationData.data);
      const result = await sendEmailServerSide({
        to: project.client.email,
        subject: `🔔 Nouveau professionnel intéressé : ${professional.profiles.full_name}`,
        html: emailHtml,
        fromType: 'noreply'
      });

      if (result.success) {
        await this.logNotification(notificationData, 'sent');
        console.log('✅ Email notification pro intérêt envoyé au particulier');
      } else {
        await this.logNotification(notificationData, 'failed', result.error);
        return { success: false, error: 'Erreur envoi email' };
      }

      // Créer notification in-app
      await supabase
        .from('notifications')
        .insert({
          user_id: project.client_id,
          title: 'Nouveau professionnel intéressé',
          message: `${professional.profiles.full_name} (${professional.company_name}) a montré de l'intérêt pour votre projet "${project.title}"`,
          type: 'new_interest',
          data: {
            project_id: projectId,
            professional_id: professionalId,
            professional_name: professional.profiles.full_name,
            professional_company: professional.company_name
          }
        });

      return { success: true };
    } catch (error) {
      console.error('❌ Erreur notification pro intérêt:', error);
      return { success: false, error: 'Erreur système' };
    }
  }

  /**
   * 🎯 NOTIFICATION 2: Nouveau projet -> Admins
   */
  async notifyNewProject(projectId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔔 Notification: Nouveau projet à valider');

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, title, description, category, budget_min, budget_max, client_email, status')
        .eq('id', projectId)
        .single();

      if (projectError || !project) {
        return { success: false, error: 'Projet non trouvé' };
      }

      // Récupérer les admins
      const { data: admins, error: adminError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('email', ['admin@swipetonpro.com', 'support@swipetonpro.com']);

      if (adminError) {
        return { success: false, error: 'Erreur récupération admins' };
      }

      const adminEmails = admins?.map(admin => admin.email) || [];

      const notificationData: SecureNotificationData = {
        type: 'new_project_admin',
        recipients: adminEmails,
        data: {
          projectName: project.title,
          projectDescription: project.description,
          projectCategory: project.category,
          budgetMin: project.budget_min,
          budgetMax: project.budget_max,
          clientEmail: project.client_email,
          projectId: project.id,
          projectStatus: project.status
        },
        priority: 'high',
        userId: 'system'
      };

      const validation = this.validateNotificationData(notificationData);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      await this.logNotification(notificationData, 'pending');

      // Envoyer aux admins
      const emailHtml = this.generateNewProjectAdminEmail(notificationData.data);
      const results = await Promise.allSettled(
        adminEmails.map(email => 
          sendEmailServerSide({
            to: email,
            subject: `🆕 Nouveau projet à valider : ${project.title}`,
            html: emailHtml,
            fromType: 'noreply'
          })
        )
      );

      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed === 0) {
        await this.logNotification(notificationData, 'sent');
        console.log('✅ Notifications nouveau projet envoyées aux admins');
      } else {
        await this.logNotification(notificationData, 'failed', `${failed} envois échoués`);
      }

      return { success: failed === 0 };
    } catch (error) {
      console.error('❌ Erreur notification nouveau projet:', error);
      return { success: false, error: 'Erreur système' };
    }
  }

  /**
   * 🎯 NOTIFICATION 3: Nouveau professionnel -> Admins
   */
  async notifyNewProfessional(professionalId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔔 Notification: Nouveau professionnel à valider');

      const { data: professional, error: proError } = await supabase
        .from('professionals')
        .select(`
          id, company_name, specialties, experience_years, siret,
          profiles!professionals_user_id_fkey(full_name, email, phone)
        `)
        .eq('id', professionalId)
        .single();

      if (proError || !professional) {
        return { success: false, error: 'Professionnel non trouvé' };
      }

      // Admins
      const { data: admins, error: adminError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('email', ['admin@swipetonpro.com', 'support@swipetonpro.com']);

      if (adminError) {
        return { success: false, error: 'Erreur récupération admins' };
      }

      const adminEmails = admins?.map(admin => admin.email) || [];

      const notificationData: SecureNotificationData = {
        type: 'new_professional_admin',
        recipients: adminEmails,
        data: {
          professionalName: professional.profiles.full_name,
          companyName: professional.company_name,
          professionalEmail: professional.profiles.email,
          professionalPhone: professional.profiles.phone,
          specialties: professional.specialties,
          experience: professional.experience_years,
          siret: professional.siret,
          professionalId: professional.id
        },
        priority: 'high',
        userId: 'system'
      };

      const validation = this.validateNotificationData(notificationData);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      await this.logNotification(notificationData, 'pending');

      const emailHtml = this.generateNewProfessionalAdminEmail(notificationData.data);
      const results = await Promise.allSettled(
        adminEmails.map(email => 
          sendEmailServerSide({
            to: email,
            subject: `🆕 Nouveau professionnel à valider : ${professional.company_name}`,
            html: emailHtml,
            fromType: 'noreply'
          })
        )
      );

      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed === 0) {
        await this.logNotification(notificationData, 'sent');
        console.log('✅ Notifications nouveau professionnel envoyées aux admins');
      } else {
        await this.logNotification(notificationData, 'failed', `${failed} envois échoués`);
      }

      return { success: failed === 0 };
    } catch (error) {
      console.error('❌ Erreur notification nouveau professionnel:', error);
      return { success: false, error: 'Erreur système' };
    }
  }

  /**
   * 🎯 NOTIFICATION 4: Match complété -> Pro + Particulier + Admins
   */
  async notifyMatchCompleted(projectId: string, professionalId: string, clientId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🎉 Notification: Match complété');

      // Récupérer les données
      const { data: project } = await supabase
        .from('projects')
        .select('id, title, description, category')
        .eq('id', projectId)
        .single();

      const { data: professional } = await supabase
        .from('professionals')
        .select('company_name, profiles!professionals_user_id_fkey(full_name, email)')
        .eq('id', professionalId)
        .single();

      const { data: client } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', clientId)
        .single();

      if (!project || !professional || !client) {
        return { success: false, error: 'Données incomplètes' };
      }

      const recipients = [
        client.email, // Particulier
        professional.profiles.email, // Professionnel
        'teamswipeTP@swipetonpro.com', // Admin
        'contact@swipetonpro.com' // Admin
      ];

      const notificationData: SecureNotificationData = {
        type: 'match_completed',
        recipients,
        data: {
          projectName: project.title,
          clientName: client.full_name,
          professionalName: professional.profiles.full_name,
          companyName: professional.company_name,
          projectDescription: project.description,
          projectCategory: project.category,
          projectId: project.id
        },
        priority: 'high',
        userId: clientId
      };

      const validation = this.validateNotificationData(notificationData);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      await this.logNotification(notificationData, 'pending');

      // Envoyer les emails
      const emailHtml = this.generateMatchCompletedEmail(notificationData.data);
      const results = await Promise.allSettled(
        recipients.map(email => 
          sendEmailServerSide({
            to: email,
            subject: `🎉 Match réalisé : ${project.title}`,
            html: emailHtml,
            fromType: 'noreply'
          })
        )
      );

      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed === 0) {
        await this.logNotification(notificationData, 'sent');
        console.log('✅ Notifications match complété envoyées à toutes les parties');
      } else {
        await this.logNotification(notificationData, 'failed', `${failed} envois échoués`);
      }

      // Créer notifications in-app
      await Promise.all([
        // Notification pour le client
        supabase.from('notifications').insert({
          user_id: clientId,
          title: '🎉 Match réalisé !',
          message: `${professional.profiles.full_name} (${professional.company_name}) a été choisi pour votre projet "${project.title}"`,
          type: 'match_completed',
          data: { project_id: projectId, professional_id: professionalId }
        }),
        // Notification pour le professionnel
        supabase.from('notifications').insert({
          user_id: professionalId,
          title: '🎉 Projet obtenu !',
          message: `Félicitations ! Vous avez été choisi pour le projet "${project.title}"`,
          type: 'match_completed',
          data: { project_id: projectId, client_id: clientId }
        })
      ]);

      return { success: failed === 0 };
    } catch (error) {
      console.error('❌ Erreur notification match complété:', error);
      return { success: false, error: 'Erreur système' };
    }
  }

  /**
   * Formater le budget pour l'affichage
   */
  private formatBudget(min: number, max: number): string {
    if (!min && !max) return 'Non spécifié';
    if (min === max) return `${min.toLocaleString('fr-FR')}€`;
    return `${min.toLocaleString('fr-FR')}€ - ${max.toLocaleString('fr-FR')}€`;
  }

  /**
   * Générer l'email pour notification d'intérêt de professionnel
   */
  private generateProfessionalInterestEmail(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Nouveau professionnel intéressé</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
            .pro-info { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
            .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; font-weight: bold; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 Nouveau Professionnel Intéressé</h1>
            </div>
            <div class="content">
              <p>Bonjour ${data.clientName},</p>
              <p>Un professionnel qualifié a montré de l'intérêt pour votre projet <strong>"${data.projectName}"</strong>.</p>
              
              <div class="pro-info">
                <h3>👨‍💼 ${data.professionalName}</h3>
                <p><strong>Entreprise:</strong> ${data.professionalCompany}</p>
                <p><strong>Expérience:</strong> ${data.professionalExperience} ans</p>
                <p><strong>Note:</strong> ⭐ ${data.professionalRating || 'Nouveau'}</p>
                <p><strong>Spécialité:</strong> ${data.projectCategory}</p>
              </div>
              
              <p><strong>📍 Localisation:</strong> ${data.projectLocation}</p>
              <p><strong>💰 Budget:</strong> ${data.projectBudget}</p>
              
              <p>Vous pouvez contacter ce professionnel directement pour discuter de votre projet.</p>
              
              <a href="${typeof window !== 'undefined' ? window.location.origin : ''}/projets/${data.projectId}" class="cta-button">
                Voir les détails
              </a>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Générer l'email pour notification nouveau projet aux admins
   */
  private generateNewProjectAdminEmail(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Nouveau projet à valider</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
            .project-info { background: white; padding: 20px; border-left: 4px solid #ef4444; margin: 20px 0; }
            .alert { background: #fef2f2; border: 1px solid #f59e0b; border-radius: 5px; padding: 15px; margin: 20px 0; }
            .cta-button { display: inline-block; background: #ef4444; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; font-weight: bold; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🆕 Nouveau Projet à Valider</h1>
            </div>
            <div class="content">
              <p>Bonjour,</p>
              <p>Un nouveau projet a été créé et nécessite votre validation.</p>
              
              <div class="alert">
                <strong>⚠️ Action requise :</strong> Veuillez valider ou rejeter ce projet dans l'admin.
              </div>
              
              <div class="project-info">
                <h3>📋 ${data.projectName}</h3>
                <p><strong>Catégorie:</strong> ${data.projectCategory}</p>
                <p><strong>Budget:</strong> ${this.formatBudget(data.budgetMin, data.budgetMax)}</p>
                <p><strong>Email client:</strong> ${data.clientEmail}</p>
                <p><strong>ID Projet:</strong> ${data.projectId}</p>
                <p><strong>Statut:</strong> ${data.projectStatus}</p>
              </div>
              
              <a href="${typeof window !== 'undefined' ? window.location.origin : ''}/admin/projects" class="cta-button">
                Valider le projet
              </a>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Générer l'email pour notification nouveau professionnel aux admins
   */
  private generateNewProfessionalAdminEmail(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Nouveau professionnel à valider</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
            .pro-info { background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; }
            .alert { background: #f0fdf4; border: 1px solid #10b981; border-radius: 5px; padding: 15px; margin: 20px 0; }
            .cta-button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; font-weight: bold; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🆕 Nouveau Professionnel à Valider</h1>
            </div>
            <div class="content">
              <p>Bonjour,</p>
              <p>Un nouveau professionnel s'est inscrit et nécessite votre validation.</p>
              
              <div class="alert">
                <strong>⚠️ Action requise :</strong> Veuillez valider ou rejeter ce professionnel dans l'admin.
              </div>
              
              <div class="pro-info">
                <h3>👨‍💼 ${data.professionalName}</h3>
                <p><strong>Entreprise:</strong> ${data.companyName}</p>
                <p><strong>Email:</strong> ${data.professionalEmail}</p>
                <p><strong>Téléphone:</strong> ${data.professionalPhone || 'Non renseigné'}</p>
                <p><strong>Expérience:</strong> ${data.experience} ans</p>
                <p><strong>Spécialités:</strong> ${data.specialties?.join(', ') || 'Non spécifiées'}</p>
                <p><strong>SIRET:</strong> ${data.siret}</p>
                <p><strong>ID Professionnel:</strong> ${data.professionalId}</p>
              </div>
              
              <a href="${typeof window !== 'undefined' ? window.location.origin : ''}/admin/professionals" class="cta-button">
                Valider le professionnel
              </a>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Générer l'email pour notification match complété
   */
  private generateMatchCompletedEmail(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Match réalisé</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
            .success-box { background: white; padding: 20px; border-left: 4px solid #8b5cf6; margin: 20px 0; }
            .cta-button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; font-weight: bold; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Match Réalisé !</h1>
            </div>
            <div class="content">
              <p>Félicitations !</p>
              <p>Un match a été réalisé avec succès sur la plateforme SwipeTonPro.</p>
              
              <div class="success-box">
                <h3>📋 ${data.projectName}</h3>
                <p><strong>Client:</strong> ${data.clientName}</p>
                <p><strong>Professionnel:</strong> ${data.professionalName} (${data.companyName})</p>
                <p><strong>Catégorie:</strong> ${data.projectCategory}</p>
              </div>
              
              <p>Les deux parties peuvent maintenant communiquer directement et finaliser les détails du projet.</p>
              
              <a href="${typeof window !== 'undefined' ? window.location.origin : ''}/projets/${data.projectId}" class="cta-button">
                Voir le projet
              </a>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

// Exporter l'instance singleton
export const secureNotificationService = SecureNotificationService.getInstance();
export default secureNotificationService;
