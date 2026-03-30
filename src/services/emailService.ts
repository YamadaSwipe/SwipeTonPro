// Types pour les emails
export interface EmailData {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    path: string;
  }>;
}

export interface EmailTemplate {
  projectName: string;
  clientName: string;
  professionalName: string;
  clientEmail: string;
  professionalEmail: string;
  projectDescription: string;
  budget: string;
  location: string;
  planningDate?: string;
  planningTime?: string;
  bidAmount?: string;
  message?: string;
}

export interface PlanningData {
  projectId: string;
  professionalId: string;
  clientId: string;
  date: string;
  time: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Service d'envoi d'emails
class EmailService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  // Templates d'emails
  private templates = {
    // Email au client quand un professionnel postule
    bidReceived: (data: EmailTemplate): EmailData => ({
      to: data.clientEmail,
      subject: `Nouveau devis pour votre projet : ${data.projectName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ea580c, #f97316); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">SwipeTonPro</h1>
            <p style="color: white; margin: 5px 0 0;">Nouveau devis reçu</p>
          </div>
          
          <div style="padding: 30px; background: white;">
            <h2 style="color: #333; margin-bottom: 20px;">Bonjour ${data.clientName},</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Nous avons le plaisir de vous informer que <strong>${data.professionalName}</strong> 
              a postulé à votre projet "${data.projectName}".
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Détails du projet</h3>
              <p><strong>Description:</strong> ${data.projectDescription}</p>
              <p><strong>Lieu:</strong> ${data.location}</p>
              <p><strong>Budget:</strong> ${data.budget}</p>
              ${data.bidAmount ? `<p><strong>Devis proposé:</strong> ${data.bidAmount}</p>` : ''}
            </div>
            
            ${data.message ? `
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #856404; margin-top: 0;">Message du professionnel:</h4>
              <p style="color: #856404; font-style: italic;">${data.message}</p>
            </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.baseUrl}/particulier/projects" 
                 style="background: #ea580c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Voir les détails
              </a>
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>Cet email a été envoyé via SwipeTonPro</p>
            <p>Si vous ne souhaitez plus recevoir ces emails, vous pouvez vous désinscrire depuis votre dashboard.</p>
          </div>
        </div>
      `
    }),

    // Email au professionnel quand sa candidature est acceptée
    bidAccepted: (data: EmailTemplate): EmailData => ({
      to: data.professionalEmail,
      subject: `Votre devis a été accepté ! - ${data.projectName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #28a745, #20c997); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">SwipeTonPro</h1>
            <p style="color: white; margin: 5px 0 0;">🎉 Félicitations !</p>
          </div>
          
          <div style="padding: 30px; background: white;">
            <h2 style="color: #333; margin-bottom: 20px;">Bonjour ${data.professionalName},</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Nous avons le plaisir de vous informer que <strong>${data.clientName}</strong> 
              a accepté votre devis pour le projet "${data.projectName}".
            </p>
            
            <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #155724; margin-top: 0;">🎯 Projet attribué</h3>
              <p><strong>Client:</strong> ${data.clientName}</p>
              <p><strong>Lieu:</strong> ${data.location}</p>
              <p><strong>Devis accepté:</strong> ${data.bidAmount}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.baseUrl}/professionnel/projects" 
                 style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Contacter le client
              </a>
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>Cet email a été envoyé via SwipeTonPro</p>
          </div>
        </div>
      `
    }),

    // Email de planning/rendez-vous
    planningScheduled: (data: EmailTemplate): EmailData => ({
      to: [data.clientEmail, data.professionalEmail],
      subject: `Rendez-vous planifié pour : ${data.projectName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #007bff, #0056b3); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">SwipeTonPro</h1>
            <p style="color: white; margin: 5px 0 0;">📅 Rendez-vous confirmé</p>
          </div>
          
          <div style="padding: 30px; background: white;">
            <h2 style="color: #333; margin-bottom: 20px;">Rendez-vous planifié</h2>
            
            <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #0c5460; margin-top: 0;">📋 Détails du rendez-vous</h3>
              <p><strong>Projet:</strong> ${data.projectName}</p>
              <p><strong>Date:</strong> ${data.planningDate}</p>
              <p><strong>Heure:</strong> ${data.planningTime}</p>
              <p><strong>Lieu:</strong> ${data.location}</p>
              <p><strong>Client:</strong> ${data.clientName}</p>
              <p><strong>Professionnel:</strong> ${data.professionalName}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.baseUrl}/dashboard" 
                 style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Voir dans mon dashboard
              </a>
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>Cet email a été envoyé via SwipeTonPro</p>
          </div>
        </div>
      `
    }),

    // Email de rappel de rendez-vous
    planningReminder: (data: EmailTemplate): EmailData => ({
      to: [data.clientEmail, data.professionalEmail],
      subject: `Rappel : Rendez-vous demain pour ${data.projectName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ffc107, #ff9800); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">SwipeTonPro</h1>
            <p style="color: white; margin: 5px 0 0;">⏰ Rappel</p>
          </div>
          
          <div style="padding: 30px; background: white;">
            <h2 style="color: #333; margin-bottom: 20px;">N'oubliez pas votre rendez-vous !</h2>
            
            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #856404; margin-top: 0;">📅 Rendez-vous prévu demain</h3>
              <p><strong>Projet:</strong> ${data.projectName}</p>
              <p><strong>Date:</strong> ${data.planningDate}</p>
              <p><strong>Heure:</strong> ${data.planningTime}</p>
              <p><strong>Lieu:</strong> ${data.location}</p>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              Pensez à préparer les documents nécessaires et à être disponible à l'heure convenue.
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>Cet email a été envoyé via SwipeTonPro</p>
          </div>
        </div>
      `
    }),

    // Email de notification générale
    generalNotification: (data: { to: string; subject: string; message: string; actionUrl?: string }): EmailData => ({
      to: data.to,
      subject: data.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #6c757d, #495057); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">SwipeTonPro</h1>
            <p style="color: white; margin: 5px 0 0;">📢 Notification</p>
          </div>
          
          <div style="padding: 30px; background: white;">
            <p style="color: #666; line-height: 1.6;">${data.message}</p>
            
            ${data.actionUrl ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.actionUrl}" 
                 style="background: #6c757d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Voir les détails
              </a>
            </div>
            ` : ''}
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>Cet email a été envoyé via SwipeTonPro</p>
          </div>
        </div>
      `
    })
  };

  // Envoyer un email
  async sendEmail(emailData: EmailData): Promise<{ success: boolean; error?: string }> {
    try {
      // En développement, simuler l'envoi
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email envoyé (développement):', {
          to: emailData.to,
          subject: emailData.subject,
          preview: emailData.html.substring(0, 100) + '...'
        });
        return { success: true };
      }

      // En production, utiliser un vrai service d'email
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi de l\'email');
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur envoi email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      };
    }
  }

  // Envoyer un email de notification de devis reçu
  async notifyBidReceived(templateData: EmailTemplate): Promise<void> {
    const emailData = this.templates.bidReceived(templateData);
    await this.sendEmail(emailData);
  }

  // Envoyer un email de devis accepté
  async notifyBidAccepted(templateData: EmailTemplate): Promise<void> {
    const emailData = this.templates.bidAccepted(templateData);
    await this.sendEmail(emailData);
  }

  // Envoyer un email de planning
  async notifyPlanningScheduled(templateData: EmailTemplate): Promise<void> {
    const emailData = this.templates.planningScheduled(templateData);
    await this.sendEmail(emailData);
  }

  // Envoyer un email de rappel
  async sendPlanningReminder(templateData: EmailTemplate): Promise<void> {
    const emailData = this.templates.planningReminder(templateData);
    await this.sendEmail(emailData);
  }

  // Envoyer une notification générale
  async sendGeneralNotification(data: { 
    to: string; 
    subject: string; 
    message: string; 
    actionUrl?: string 
  }): Promise<void> {
    const emailData = this.templates.generalNotification(data);
    await this.sendEmail(emailData);
  }

  // Envoyer un email de bienvenue
  async sendWelcomeEmail(email: string, name: string, userType: 'client' | 'professional'): Promise<void> {
    const emailData: EmailData = {
      to: email,
      subject: `Bienvenue sur SwipeTonPro !`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ea580c, #f97316); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">SwipeTonPro</h1>
            <p style="color: white; margin: 5px 0 0;">🎉 Bienvenue !</p>
          </div>
          
          <div style="padding: 30px; background: white;">
            <h2 style="color: #333; margin-bottom: 20px;">Bonjour ${name},</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Bienvenue sur SwipeTonPro ! Votre compte ${userType === 'professional' ? 'professionnel' : 'client'} 
              a été créé avec succès.
            </p>
            
            ${userType === 'professional' ? `
            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #856404; margin-top: 0;">📋 Prochaines étapes</h3>
              <p>1. Complétez votre profil professionnel</p>
              <p>2. Ajoutez vos réalisations</p>
              <p>3. Attendez la validation de votre compte</p>
              <p>4. Consultez les projets disponibles</p>
            </div>
            ` : `
            <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #0c5460; margin-top: 0;">🚀 Commencez maintenant</h3>
              <p>1. Créez votre premier projet</p>
              <p>2. Recevez des devis de professionnels qualifiés</p>
              <p>3. Choisissez le meilleur artisan pour vos travaux</p>
            </div>
            `}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.baseUrl}/${userType === 'professional' ? 'professionnel' : 'particulier'}/dashboard" 
                 style="background: #ea580c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Accéder à mon dashboard
              </a>
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>Cet email a été envoyé via SwipeTonPro</p>
          </div>
        </div>
      `
    };
    
    await this.sendEmail(emailData);
  }

  // Envoyer un email de paiement refusé au professionnel
  async envoyerEmailPaiementRefuse(professionalEmail: string, projetInfo: any): Promise<void> {
    const emailData: EmailData = {
      to: professionalEmail,
      subject: 'Échec de paiement - Action requise',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #dc3545, #c82333); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">SwipeTonPro</h1>
            <p style="color: white; margin: 5px 0 0;">⚠️ Paiement échoué</p>
          </div>
          
          <div style="padding: 30px; background: white;">
            <h2 style="color: #333; margin-bottom: 20px;">Bonjour ${projetInfo.professionalName},</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Le paiement pour la mise en relation avec un projet a échoué.
            </p>
            
            <div style="background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #721c24; margin-top: 0;">📋 Détails du projet</h3>
              <p><strong>Titre:</strong> ${projetInfo.titre}</p>
              <p><strong>Montant requis:</strong> ${projetInfo.frais} €</p>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              Le client a choisi d'attendre une nouvelle tentative de paiement.
            </p>
            
            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #856404; margin-top: 0;">💡 Conseils</h3>
              <p>• Vérifiez que vos moyens de paiement sont valides</p>
              <p>• Assurez-vous d'avoir des fonds suffisants</p>
              <p>• Contactez votre banque si nécessaire</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.baseUrl}/professionnel/dashboard" 
                 style="background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Voir dans mon dashboard
              </a>
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>Pour toute question : 📧 contact@swipetonpro.fr</p>
          </div>
        </div>
      `
    };
    
    await this.sendEmail(emailData);
  }

  // Envoyer un email de candidature refusée
  async envoyerEmailCandidatureRefusee(professionalEmail: string, projetInfo: any): Promise<void> {
    const emailData: EmailData = {
      to: professionalEmail,
      subject: 'Candidature refusée',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ffc107, #e0a800); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">SwipeTonPro</h1>
            <p style="color: white; margin: 5px 0 0;">📋 Candidature refusée</p>
          </div>
          
          <div style="padding: 30px; background: white;">
            <h2 style="color: #333; margin-bottom: 20px;">Bonjour ${projetInfo.professionalName},</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Suite à l'échec du paiement, votre candidature pour un projet a été refusée.
            </p>
            
            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #856404; margin-top: 0;">⚠️ Conseils pour vos futures candidatures</h3>
              <p>• Vérifiez votre capacité de paiement avant de postuler</p>
              <p>• Assurez-vous d'avoir des fonds disponibles</p>
              <p>• Évitez de perdre des chantiers par des problèmes de paiement</p>
            </div>
            
            <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #0c5460; margin-top: 0;">💡 Autres options disponibles</h3>
              <p>• Achetez des crédits d'avance pour accélérer vos mises en relation</p>
              <p>• Contactez notre équipe pour configurer un prépaiement</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.baseUrl}/professionnel/dashboard" 
                 style="background: #ffc107; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Voir les projets disponibles
              </a>
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>📞 Pour plus d'informations : 📧 contact@swipetonpro.fr</p>
          </div>
        </div>
      `
    };
    
    await this.sendEmail(emailData);
  }

  // Envoyer un email de paiement accepté
  async envoyerEmailPaiementAccepte(professionalEmail: string, clientEmail: string, projetInfo: any): Promise<void> {
    // Email pour le professionnel
    const emailPro: EmailData = {
      to: professionalEmail,
      subject: '🎉 Félicitations ! Mise en relation acceptée',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #28a745, #20c997); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">SwipeTonPro</h1>
            <p style="color: white; margin: 5px 0 0;">🎉 Félicitations !</p>
          </div>
          
          <div style="padding: 30px; background: white;">
            <h2 style="color: #333; margin-bottom: 20px;">Bonjour ${projetInfo.professionalName},</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Votre paiement a été accepté et vous êtes maintenant mis en relation !
            </p>
            
            <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #155724; margin-top: 0;">💰 Pour rassurer votre client et sécuriser votre collaboration</h3>
              <p>🔒 Proposez de sécuriser l'acompte et/ou les fonds par STRIPE</p>
              <ul style="color: #155724; margin: 10px 0; padding-left: 20px;">
                <li>Le client peut sécuriser l'acompte et le montant ou une partie sur Stripe</li>
                <li>Les fonds sont sécurisés jusqu'à la fin des travaux ou verser par paliers franchis</li>
                <li>Paiement sécurisé via la plateforme</li>
                <li>Protection mutuelle des deux parties</li>
                <li>Garantie de paiement pour vous et sécurité pour le client</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.baseUrl}/professionnel/dashboard" 
                 style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Contacter le client
              </a>
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>Cet email a été envoyé via SwipeTonPro</p>
          </div>
        </div>
      `
    };

    // Email pour le client
    const emailClient: EmailData = {
      to: clientEmail,
      subject: '🎉 Mise en relation réussie !',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #007bff, #0056b3); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">SwipeTonPro</h1>
            <p style="color: white; margin: 5px 0 0;">🎉 Mise en relation réussie</p>
          </div>
          
          <div style="padding: 30px; background: white;">
            <h2 style="color: #333; margin-bottom: 20px;">Bonjour,</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Le professionnel ${projetInfo.professionalName} a confirmé son paiement et vous êtes maintenant mis en relation !
            </p>
            
            <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #0c5460; margin-top: 0;">💬 Chat complet activé</h3>
              <p>Communiquez librement avec votre professionnel</p>
              <p>Accédez à toutes ses informations</p>
              <p>Échangez sur les détails de votre projet</p>
            </div>
            
            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #856404; margin-top: 0;">💰 Options de paiement sécurisé</h3>
              <p>🔒 Sécurisation des fonds par STRIPE</p>
              <ul style="color: #856404; margin: 10px 0; padding-left: 20px;">
                <li>Vous pouvez sécuriser l'acompte et/ou le montant total sur Stripe</li>
                <li>Les fonds sont bloqués jusqu'à la fin des travaux ou versement par paliers</li>
                <li>Protection mutuelle et garantie pour les deux parties</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.baseUrl}/particulier/dashboard" 
                 style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Accéder au chat
              </a>
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>Cet email a été envoyé via SwipeTonPro</p>
          </div>
        </div>
      `
    };

    // Envoyer les deux emails
    await Promise.all([
      this.sendEmail(emailPro),
      this.sendEmail(emailClient)
    ]);
  }
}

export const emailService = new EmailService();

// Exporter une instance par défaut pour compatibilité
export default emailService;

// Exporter la classe pour les imports nommés
export { EmailService };
