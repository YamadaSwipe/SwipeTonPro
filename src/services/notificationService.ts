import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];
type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"];
type Project = Database["public"]["Tables"]["projects"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const notificationService = {
  /**
   * Get notifications for current user
   */
  async getUserNotifications(
    userId: string,
    limit = 50
  ): Promise<{ data: Notification[] | null; error: Error | null }> {
    try {
      if (!userId) {
        return { data: null, error: new Error("User ID requis") };
      }

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      return { data: data || [], error };
    } catch (err) {
      console.error("Error in getUserNotifications:", err);
      return { data: null, error: err as Error };
    }
  },

  /**
   * Envoyer une notification de nouveau projet aux admins/modérateurs
   */
  async notifyNewProject(project: Project) {
    try {
      // Notifications pour NOUVEAU PROJET : admin + support uniquement
      const { data: admins, error: adminsError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('email', ['admin@swipetonpro.com', 'support@swipetonpro.com']); // Admin pour validation, support pour aide

      if (adminsError) throw adminsError;

      // Créer les notifications pour chaque admin
      const notifications = admins?.map(admin => ({
        user_id: admin.id,
        title: '🆕 Nouveau projet à valider',
        message: `Un nouveau projet "${project.title}" a été déposé et nécessite votre validation.`,
        type: 'project_validation',
        data: {
          project_id: project.id,
          project_title: project.title,
          client_email: project.client_email,
          budget_min: project.budget_min,
          budget_max: project.budget_max
        },
        read: false,
        created_at: new Date().toISOString()
      })) || [];

      if (notifications.length > 0) {
        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (notifError) throw notifError;

        // Envoyer les emails aux admins concernés
        for (const admin of admins || []) {
          await this.sendEmailNotification(admin.email, 'new-project-admin', {
            adminName: admin.full_name,
            projectTitle: project.title,
            clientEmail: project.client_email,
            budgetMin: project.budget_min,
            budgetMax: project.budget_max,
            projectId: project.id,
            role: admin.email.includes('admin') ? 'validation' : 'support'
          });
        }
      }

      console.log(`✅ Notifications nouveau projet envoyées à ${notifications.length} admins (admin pour validation, support pour aide)`);
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur notification admins:', error);
      return { success: false, error };
    }
  },

  /**
   * Envoyer un email récapitulatif au particulier
   */
  async sendProjectRecap(project: Project, clientProfile: Profile) {
    try {
      await this.sendEmailNotification(clientProfile.email, 'project-recap-client', {
        clientName: clientProfile.full_name,
        projectTitle: project.title,
        projectDescription: project.description,
        budgetMin: project.budget_min,
        budgetMax: project.budget_max,
        aiEstimation: project.ai_analysis || null,
        nextSteps: [
          '1. Qualification humaine par notre équipe dans les 24-48h',
          '2. Validation et publication du projet',
          '3. Réception des demandes de professionnels (limitées à 3)',
          '4. Choix du professionnel et mise en relation',
          '5. Communication directe et planification des travaux'
        ]
      });

      console.log('✅ Email récapitulatif envoyé au client');
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur email récapitulatif:', error);
      return { success: false, error };
    }
  },

  /**
   * Notifier le particulier d'une nouvelle demande de professionnel
   */
  async notifyNewProfessionalRequest(projectId: string, professionalName: string, clientEmail: string) {
    try {
      // Compter le nombre de demandes existantes
      const { data: existingRequests, error: countError } = await supabase
        .from('bids')
        .select('id')
        .eq('project_id', projectId);

      if (countError) throw countError;

      const requestCount = existingRequests?.length || 0;

      await this.sendEmailNotification(clientEmail, 'new-professional-request', {
        professionalName: "Un professionnel qualifié",  // Anonyme
        professionalSkills: "Compétences vérifiées",  // Anonyme
        professionalExperience: "Expérience confirmée",  // Anonyme
        professionalLocation: "Votre région",  // Anonyme
        requestNumber: requestCount + 1,
        maxRequests: 3,
        canChooseNow: requestCount >= 2 // Permet le choix après 2-3 demandes
      });

      console.log(`✅ Notification demande professionnelle envoyée (${requestCount + 1}/3)`);
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur notification demande:', error);
      return { success: false, error };
    }
  },

  /**
   * Notifier quand un client met en pause un professionnel
   */
  async notifyProfessionalPaused(projectId: string, clientEmail: string, professionalEmail: string, professionalName: string, clientName: string) {
    try {
      // Notifier le professionnel
      await this.sendEmailNotification(professionalEmail, 'professional-paused-professional', {
        professionalName,
        clientName,
        message: '⏸️ Un client a mis votre candidature en pause.',
        nextSteps: [
          'Le client souhaite réfléchir davantage',
          'Vous serez notifié si le client change d\'avis',
          'Restez disponible pour d\'autres projets'
        ]
      });

      // Notifier le client
      await this.sendEmailNotification(clientEmail, 'professional-paused-client', {
        clientName,
        professionalName,
        message: '⏸️ Vous avez mis ce professionnel en pause.',
        nextSteps: [
          'Vous pouvez reprendre la discussion anytime',
          'Le professionnel sera notifié de votre décision',
          'Le professionnel reste disponible'
        ]
      });

      // Notifier les admins
      await this.notifyAdmins('professional-paused-admin', {
        clientName,
        professionalName,
        projectId,
        message: '⏸️ Un client a mis un professionnel en pause.'
      });

      console.log('✅ Notifications pause professionnel envoyées');
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur notification pause:', error);
      return { success: false, error };
    }
  },

  /**
   * Notifier quand un client refuse un professionnel
   */
  async notifyProfessionalRejected(projectId: string, clientEmail: string, professionalEmail: string, professionalName: string, clientName: string) {
    try {
      // Notifier le professionnel
      await this.sendEmailNotification(professionalEmail, 'professional-rejected-professional', {
        professionalName,
        clientName,
        message: '❌ Votre candidature n\'a pas été retenue pour ce projet.',
        nextSteps: [
          'Continuez de postuler à d\'autres projets',
          'Améliorez votre profil et vos photos',
          'Restez positif et persévérant'
        ]
      });

      // Notifier le client
      await this.sendEmailNotification(clientEmail, 'professional-rejected-client', {
        clientName,
        professionalName,
        message: '❌ Vous avez refusé ce professionnel.',
        nextSteps: [
          'Vous pouvez consulter d\'autres candidatures',
          'Nouveaux professionnels disponibles',
          'Contactez le support si besoin'
        ]
      });

      // Notifier les admins
      await this.notifyAdmins('professional-rejected-admin', {
        clientName,
        professionalName,
        projectId,
        message: '❌ Un client a refusé un professionnel.'
      });

      console.log('✅ Notifications rejet professionnel envoyées');
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur notification rejet:', error);
      return { success: false, error };
    }
  },

  /**
   * Notifier quand le délai de paiement expire (24h)
   */
  async notifyProfessionalExpired(projectId: string, clientEmail: string, professionalEmail: string, professionalName: string, clientName: string) {
    try {
      // Notifier le client
      await this.sendEmailNotification(clientEmail, 'professional-expired-client', {
        clientName,
        professionalName,
        message: '⏰ Le délai de paiement pour ce professionnel a expiré.',
        nextSteps: [
          'Le professionnel n\'a pas validé dans les 24h',
          'Vous pouvez choisir un autre professionnel',
          'Le professionnel peut postuler à nouveau'
        ]
      });

      // Notifier le professionnel
      await this.sendEmailNotification(professionalEmail, 'professional-expired-professional', {
        professionalName,
        clientName,
        message: '⏰ Le délai de paiement pour ce projet a expiré.',
        nextSteps: [
          'Vous n\'avez pas payé dans les 24h',
          'Le client peut choisir un autre professionnel',
          'Vous pouvez postuler à d\'autres projets'
        ]
      });

      // Notifier les admins
      await this.notifyAdmins('professional-expired-admin', {
        clientName,
        professionalName,
        projectId,
        message: '⏰ Le délai de paiement de 24h a expiré.'
      });

      console.log('✅ Notifications expiration professionnel envoyées');
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur notification expiration:', error);
      return { success: false, error };
    }
  },

  /**
   * Notifier que le matching est réalisé
   */
  async notifyMatchingCompleted(projectId: string, clientEmail: string, professionalEmail: string, professionalName: string, clientName: string, professionalData?: any, clientData?: any) {
    try {
      // Notifier le client
      await this.sendEmailNotification(clientEmail, 'matching-completed-client', {
        clientName,
        professionalName,  // Visible après paiement
        professionalCompany: professionalData?.company_name || "Entreprise du professionnel",  // Visible après paiement
        professionalEmail: professionalEmail,  // Visible après paiement
        professionalPhone: professionalData?.phone || "Coordonnées disponibles dans le dashboard",  // Visible après paiement
        message: '🎉 Super ! Nous avons trouvé le professionnel parfait pour votre projet !',
        nextSteps: [
          'Vous pouvez maintenant communiquer directement',
          'Planifiez un RDV téléphonique ou physique',
          'Échangez les coordonnées en toute sécurité',
          'Signez le devis et commencez les travaux'
        ],
        stripeInfo: {
          security: 'Paiement sécurisé via Stripe',
          guarantee: 'La caution a été sécurisée et sera débloquée directement à l\'artisan après votre accord final',
          protection: 'Aucun débit avant votre validation finale'
        }
      });

      // Notifier le professionnel
      await this.sendEmailNotification(professionalEmail, 'matching-completed-professional', {
        clientName,
        clientEmail,
        clientLocation: clientData?.city || "Localisation disponible dans le dashboard",  // Visible après paiement
        message: '🎉 Félicitations ! Un client vous a choisi pour son projet !',
        nextSteps: [
          'Contactez le client pour qualifier le projet',
          'Proposez un devis détaillé',
          'Planifiez une visite si nécessaire',
          'Commencez les travaux après accord'
        ],
        stripeInfo: {
          security: 'Paiement sécurisé via Stripe',
          guarantee: 'La caution client est sécurisée et sera débloquée directement sur votre compte après accord final',
          protection: 'Déblocage automatique après validation du client'
        }
      });

      // Notifier les comptes internes pour le matching : teamswipeTP + contact
      const { data: internalAccounts, error: internalError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('email', ['teamswipeTP@swipetonpro.com', 'contact@swipetonpro.com']);

      if (!internalError && internalAccounts) {
        for (const account of internalAccounts) {
          await this.sendEmailNotification(account.email, 'matching-internal-notification', {
            adminName: account.full_name,
            clientName,
            professionalName,
            projectId,
            message: '🎉 Nouveau matching réalisé sur la plateforme !',
            details: {
              client: clientName,
              professional: professionalName,
              projectId: projectId
            }
          });
        }
      }

      console.log('✅ Notifications matching complété envoyées (client + pro + interne)');
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur notification matching:', error);
      return { success: false, error };
    }
  },

  /**
   * Envoyer une notification de projet validé au particulier
   */
  async notifyProjectValidated(project: Project, clientProfile: { full_name: string; email: string }) {
    try {
      await this.sendEmailNotification(clientProfile.email, 'project-validated-client', {
        clientName: clientProfile.full_name,
        projectTitle: project.title,
        message: '🎉 Votre projet a été validé et publié !',
        nextSteps: [
          'Votre projet est maintenant visible par les professionnels',
          'Vous recevrez jusqu\'à 3 demandes de professionnels qualifiés',
          'Choisissez le professionnel qui vous convient le mieux',
          'Une fois le choix fait, vous pourrez communiquer directement'
        ],
        projectUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/projets/${project.id}`
      });

      console.log('✅ Email validation projet envoyé au client');
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur email validation projet:', error);
      return { success: false, error };
    }
  },

  /**
   * Fonction générique d'envoi d'email (à implémenter avec votre service email)
   */
  async sendEmailNotification(email: string, template: string, data: any) {
    try {
      // Implémenter avec votre service email (Resend, SendGrid, etc.)
      console.log(`📧 Email template "${template}" envoyé à ${email}:`, data);
      
      // Pour l'instant, juste un log
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur envoi email:', error);
      return { success: false, error };
    }
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<{ data: number; error: Error | null }> {
    try {
      if (!userId) {
        return { data: 0, error: new Error("User ID requis") };
      }

      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false);

      return { data: count || 0, error };
    } catch (err) {
      console.error("Error in getUnreadCount:", err);
      return { data: 0, error: err as Error };
    }
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ 
          is_read: true,  // Utiliser "is_read" (colonne existante)
          read_at: new Date().toISOString()  // Ajouter read_at pour le suivi
        })
        .eq("id", notificationId);

      return { error };
    } catch (err) {
      console.error("Error in markAsRead:", err);
      return { error: err as Error };
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<{ error: Error | null }> {
    try {
      if (!userId) {
        return { error: new Error("User ID requis") };
      }

      const { error } = await supabase
        .from("notifications")
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq("user_id", userId)
        .eq("is_read", false);

      return { error };
    } catch (err) {
      console.error("Error in markAllAsRead:", err);
      return { error: err as Error };
    }
  },

  /**
   * Create a notification (internal use / Edge Functions)
   */
  async createNotification(
    notification: Omit<NotificationInsert, "id" | "created_at">
  ): Promise<{ data: Notification | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .insert(notification)
        .select()
        .single();

      return { data, error };
    } catch (err) {
      console.error("Error in createNotification:", err);
      return { data: null, error: err as Error };
    }
  },

  /**
   * Subscribe to new notifications (Realtime)
   */
  subscribeToNotifications(callback: (notification: Notification) => void) {
    return supabase
      .channel("user-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications"
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      return { error };
    } catch (err) {
      console.error("Error in deleteNotification:", err);
      return { error: err as Error };
    }
  }
};