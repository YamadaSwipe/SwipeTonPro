export function getAdminProjectValidationNotificationHtml(projectTitle: string, projectId: string, projectDescription: string, adminDashboardUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Nouveau projet à valider</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
          .project-info { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
          .project-title { font-size: 20px; font-weight: bold; color: #333; margin-bottom: 10px; }
          .project-description { font-size: 14px; color: #666; margin-bottom: 15px; }
          .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; font-size: 12px; color: #999; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
          .alert { background: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; padding: 15px; margin: 20px 0; color: #856404; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 Nouveau Projet à Valider</h1>
          </div>
          
          <div class="content">
            <p>Bonjour,</p>
            
            <p>Un nouveau projet a été créé par un particulier et attend votre validation.</p>
            
            <div class="alert">
              <strong>⏰ Action requise :</strong> Veuillez consulter et valider ou rejeter ce projet dans votre tableau de bord.
            </div>
            
            <div class="project-info">
              <div class="project-title">📋 ${projectTitle}</div>
              <div class="project-description">${projectDescription}</div>
              <p><strong>ID Projet :</strong> ${projectId}</p>
            </div>
            
            <p>
              <a href="${adminDashboardUrl}" class="cta-button">Consulter le projet</a>
            </p>
            
            <p style="color: #666; font-size: 14px;">
              Ce projet est actuellement en attente de validation. Vous pouvez l'approuver pour qu'il soit publié sur la marketplace, ou le rejeter s'il ne respecte pas les critères de qualité.
            </p>
            
            <div class="footer">
              <p>SwipeTonPro - Plateforme de mise en relation BTP</p>
              <p>Cet email a été généré automatiquement. Veuillez ne pas répondre directement à cet email.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getProjectApprovedNotificationHtml(projectTitle: string, projectUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Projet approuvé</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
          .success-box { background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; }
          .cta-button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; font-size: 12px; color: #999; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Projet Approuvé!</h1>
          </div>
          
          <div class="content">
            <p>Félicitations!</p>
            
            <div class="success-box">
              <p>Votre projet <strong>"${projectTitle}"</strong> a été approuvé par nos modérateurs et est maintenant publié sur la plateforme.</p>
              <p>Les professionnels peuvent à présent consulter votre projet et proposer leurs services.</p>
            </div>
            
            <p>
              <a href="${projectUrl}" class="cta-button">Voir mon projet</a>
            </p>
            
            <p style="color: #666; font-size: 14px;">
              <strong>📋 Prochaines étapes :</strong> Vous recevrez des propositions de professionnels intéressés par votre projet. N'hésitez pas à les contacter pour discuter de vos besoins spécifiques.
            </p>
            
            <div class="footer">
              <p>SwipeTonPro - Plateforme de mise en relation BTP</p>
              <p>Cet email a été généré automatiquement. Veuillez ne pas répondre directement à cet email.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getProjectRejectedNotificationHtml(projectTitle: string, rejectionReason?: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Avis concernant votre projet</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; border-left: 4px solid #ef4444; margin: 20px 0; }
          .reason-box { background: #fef2f2; border: 1px solid #fee2e2; border-radius: 5px; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; font-size: 12px; color: #999; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Avis concernant votre projet</h1>
          </div>
          
          <div class="content">
            <p>Bonjour,</p>
            
            <div class="info-box">
              <p>Votre projet <strong>"${projectTitle}"</strong> n'a pas pu être approuvé à ce stade.</p>
              <p>Cela signifie que le projet ne respecte pas encore tous nos critères de qualité ou qu'il y a des informations manquantes.</p>
            </div>
            
            ${rejectionReason ? `
            <div class="reason-box">
              <p><strong>Motif :</strong></p>
              <p>${rejectionReason}</p>
            </div>
            ` : ''}
            
            <p style="color: #666; font-size: 14px;">
              <strong>💡 Prochaines étapes :</strong> Veuillez mettre à jour votre projet en tenant compte des remarques, puis réessayer de le publier. N'hésitez pas à nous contacter si vous avez des questions.
            </p>
            
            <div class="footer">
              <p>SwipeTonPro - Plateforme de mise en relation BTP</p>
              <p>Cet email a été généré automatiquement. Veuillez ne pas répondre directement à cet email.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getWelcomeEmailHtml(firstName: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Bienvenue chez SwipeTonPro</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FF8C42 0%, #FF6B35 100%); color: white; padding: 40px 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
          .welcome-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF8C42; }
          .feature-list { list-style: none; padding: 0; margin: 20px 0; }
          .feature-list li { padding: 12px 0; border-bottom: 1px solid #eee; }
          .feature-list li:last-child { border-bottom: none; }
          .feature-list li:before { content: "✓ "; color: #FF8C42; font-weight: bold; margin-right: 10px; }
          .cta-button { display: inline-block; background: #FF8C42; color: white; padding: 14px 30px; border-radius: 5px; text-decoration: none; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; font-size: 12px; color: #999; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Bienvenue ${firstName}!</h1>
            <p style="margin: 0; font-size: 18px;">Vous êtes maintenant membre de SwipeTonPro</p>
          </div>
          
          <div class="content">
            <p>Bonjour ${firstName},</p>
            
            <div class="welcome-box">
              <h2 style="color: #FF8C42; margin-top: 0;">Explorez la plateforme</h2>
              <p>Vous pouvez maintenant profiter de tous les avantages de SwipeTonPro :</p>
              
              <ul class="feature-list">
                <li><strong>Estimations personnalisées</strong> - Obtenez des estimations spécialisées pour vos projets</li>
                <li><strong>Matching intelligent</strong> - Trouvez les professionnels les plus adaptés</li>
                <li><strong>Paiement sécurisé</strong> - Vos moyens de paiement sont bien protégés</li>
                <li><strong>Support 24/7</strong> - Notre équipe est toujours là pour vous aider</li>
              </ul>
            </div>
            
            <h3 style="color: #333;">📋 Commencez maintenant</h3>
            <p>Retournez à votre estimation personnalisée pour continuer et publier votre projet. Les professionnels pourront ensuite proposer leurs services.</p>
            
            <div style="text-align: center;">
              <a href="https://swipetonpro.fr/particulier/diagnostic" class="cta-button">Continuer mon estimation</a>
            </div>
            
            <h3 style="color: #333;">❓ Besoin d'aide ?</h3>
            <p>Si vous avez des questions ou besoin d'assistance, n'hésitez pas à nous contacter à <strong>support@swipetonpro.fr</strong></p>
            
            <div class="footer">
              <p>SwipeTonPro - Plateforme de mise en relation BTP</p>
              <p>Cet email a été généré automatiquement. Veuillez ne pas répondre directement à cet email.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getAccountConfirmationEmailHtml(firstName: string, email: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Confirmation de votre compte</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
          .confirmation-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border: 2px solid #10b981; }
          .confirmation-box h2 { color: #10b981; margin-top: 0; }
          .info-row { padding: 12px 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; }
          .info-row:last-child { border-bottom: none; }
          .info-label { font-weight: bold; }
          .info-value { color: #666; }
          .next-steps { background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; font-size: 12px; color: #999; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📧 Confirmation de compte</h1>
          </div>
          
          <div class="content">
            <p>Bonjour ${firstName},</p>
            
            <p>Nous vous remercions de vous être inscrit sur SwipeTonPro. Votre compte a été créé avec succès et est maintenant actif.</p>
            
            <div class="confirmation-box">
              <h2 style="margin-top: 0;">✅ Compte confirmé</h2>
              <div class="info-row">
                <span class="info-label">Email :</span>
                <span class="info-value">${email}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Statut :</span>
                <span class="info-value" style="color: #10b981; font-weight: bold;">Actif</span>
              </div>
            </div>
            
            <div class="next-steps">
              <h3 style="margin-top: 0; color: #3b82f6;">📝 Prochaines étapes</h3>
              <ol style="margin: 0; padding-left: 20px;">
                <li>Connectez-vous à votre compte</li>
                <li>Complétez votre première estimation</li>
                <li>Publiez votre projet</li>
                <li>Recevez des propositions de professionnels</li>
              </ol>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              <strong>💡 Conseil :</strong> Gardez vos identifiants en lieu sûr pour accéder à votre compte à tout moment.
            </p>
            
            <div class="footer">
              <p>SwipeTonPro - Plateforme de mise en relation BTP</p>
              <p>Si vous n'êtes pas à l'origine de cette inscription, veuillez ignorer cet email.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}
