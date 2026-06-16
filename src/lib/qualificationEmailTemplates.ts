/**
 * Templates d'e-mails pour le système de qualification des projets
 * et les notifications de réassurance pour particuliers et professionnels
 */

/**
 * E-mail envoyé au PARTICULIER lors de la mise en ligne de son projet
 * Insiste LOURDEMENT sur l'importance de rester sur la plateforme
 */
export function getProjectPublishedClientEmail(data: {
  clientName: string;
  projectTitle: string;
  projectUrl: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Votre projet est en ligne</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
          .success-box { background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; }
          .warning-box { background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .critical-warning { background: #fee2e2; border: 3px solid #dc2626; border-radius: 8px; padding: 25px; margin: 20px 0; }
          .icon-warning { font-size: 32px; text-align: center; margin-bottom: 10px; }
          .cta-button { display: inline-block; background: #0284c7; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; font-size: 12px; color: #999; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
          .highlight { background: #fef3c7; padding: 2px 6px; border-radius: 3px; font-weight: bold; }
          ul.security-list { list-style: none; padding: 0; }
          ul.security-list li { padding: 8px 0; padding-left: 30px; position: relative; }
          ul.security-list li:before { content: "🔒"; position: absolute; left: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Votre projet est en ligne !</h1>
          </div>
          
          <div class="content">
            <p>Bonjour ${data.clientName},</p>
            
            <div class="success-box">
              <p><strong>Félicitations !</strong> Votre projet <strong>"${data.projectTitle}"</strong> est maintenant publié sur SwipeTonPro.</p>
              <p>Les professionnels qualifiés de votre région peuvent désormais le consulter et manifester leur intérêt.</p>
            </div>

            <div class="critical-warning">
              <div class="icon-warning">⚠️ IMPORTANT - SÉCURITÉ ⚠️</div>
              <h3 style="color: #dc2626; margin: 10px 0; text-align: center;">RESTEZ EXCLUSIVEMENT SUR LA PLATEFORME</h3>
              
              <p style="color: #991b1b; font-size: 15px; font-weight: bold; margin: 15px 0;">
                Pour votre protection et votre sécurité, il est <span class="highlight">IMPÉRATIF</span> de communiquer UNIQUEMENT via la messagerie SwipeTonPro.
              </p>

              <ul class="security-list" style="color: #991b1b; font-size: 14px;">
                <li><strong>NE JAMAIS</strong> partager votre numéro de téléphone personnel avant la signature du contrat</li>
                <li><strong>NE JAMAIS</strong> communiquer votre adresse e-mail personnelle aux professionnels</li>
                <li><strong>NE JAMAIS</strong> accepter de rendez-vous sans passer par notre système de planification</li>
                <li><strong>NE JAMAIS</strong> effectuer de paiement en dehors de la plateforme</li>
              </ul>
            </div>

            <div class="warning-box">
              <h3 style="color: #b45309; margin-top: 0;">🛡️ Pourquoi rester sur la plateforme ?</h3>
              
              <p style="margin: 10px 0;"><strong>1. Historique officiel en cas de litige</strong></p>
              <p style="color: #78350f; font-size: 14px; margin: 5px 0 15px 20px;">
                Tous vos échanges sur SwipeTonPro sont conservés et peuvent servir de preuve en cas de désaccord ou de problème avec le professionnel. Si vous communiquez en dehors (SMS, WhatsApp, appels), vous perdez cette protection.
              </p>

              <p style="margin: 10px 0;"><strong>2. Protection contre les arnaques</strong></p>
              <p style="color: #78350f; font-size: 14px; margin: 5px 0 15px 20px;">
                Notre équipe surveille les échanges pour détecter les comportements suspects. En sortant de la plateforme, vous vous exposez à des risques d'escroquerie sans aucune protection.
              </p>

              <p style="margin: 10px 0;"><strong>3. Médiation et support</strong></p>
              <p style="color: #78350f; font-size: 14px; margin: 5px 0 15px 20px;">
                En cas de problème, notre équipe peut intervenir et consulter l'historique complet pour vous aider. Sans cet historique, nous ne pourrons pas vous assister efficacement.
              </p>

              <p style="margin: 10px 0;"><strong>4. Garantie de paiement sécurisé</strong></p>
              <p style="color: #78350f; font-size: 14px; margin: 5px 0 15px 20px;">
                Le système de séquestre de fonds protège votre argent. Tout paiement effectué en dehors de la plateforme n'est pas couvert par nos garanties.
              </p>
            </div>

            <p style="text-align: center; margin: 30px 0;">
              <a href="${data.projectUrl}" class="cta-button">Accéder à mon projet</a>
            </p>

            <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 0; color: #1e40af; font-size: 14px;">
                <strong>💡 Rappel :</strong> Vous recevrez une notification dès qu'un professionnel manifestera son intérêt pour votre projet. Vous pourrez alors consulter son profil et échanger avec lui via notre messagerie sécurisée.
              </p>
            </div>
            
            <div class="footer">
              <p>SwipeTonPro - Plateforme de mise en relation BTP</p>
              <p>Pour toute question : <strong>support@swipetonpro.fr</strong></p>
              <p style="margin-top: 10px; color: #dc2626; font-weight: bold;">⚠️ Ne répondez jamais à des demandes de contact en dehors de la plateforme</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * E-mail envoyé au PROFESSIONNEL lors d'un matching
 * Rappelle l'importance du séquestre des fonds
 */
export function getMatchConfirmedProfessionalEmail(data: {
  proName: string;
  projectTitle: string;
  clientName: string;
  projectBudget: string;
  pricePaid: string;
  dashboardUrl: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Match confirmé - Action requise</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ea580c 0%, #f97316 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
          .success-box { background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; }
          .payment-warning { background: #fef3c7; border: 3px solid #f59e0b; border-radius: 8px; padding: 25px; margin: 20px 0; }
          .critical-box { background: #fee2e2; border: 3px solid #dc2626; border-radius: 8px; padding: 25px; margin: 20px 0; }
          .icon-large { font-size: 40px; text-align: center; margin-bottom: 15px; }
          .cta-button { display: inline-block; background: #ea580c; color: white; padding: 14px 36px; border-radius: 5px; text-decoration: none; font-weight: bold; margin: 20px 0; font-size: 16px; }
          .footer { text-align: center; font-size: 12px; color: #999; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
          .highlight { background: #fef3c7; padding: 2px 6px; border-radius: 3px; font-weight: bold; color: #b45309; }
          .step-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; margin: 10px 0; }
          .step-number { display: inline-block; background: #10b981; color: white; width: 28px; height: 28px; border-radius: 50%; text-align: center; line-height: 28px; font-weight: bold; margin-right: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Match confirmé !</h1>
            <p style="margin: 10px 0 0; font-size: 16px;">Vous avez débloqué le projet "${data.projectTitle}"</p>
          </div>
          
          <div class="content">
            <p>Bonjour ${data.proName},</p>
            
            <div class="success-box">
              <p><strong>Félicitations !</strong> Votre mise en relation avec <strong>${data.clientName}</strong> est confirmée.</p>
              <p style="margin: 10px 0;">
                <strong>Projet :</strong> ${data.projectTitle}<br>
                <strong>Budget client :</strong> ${data.projectBudget}<br>
                <strong>Coût de mise en relation :</strong> ${data.pricePaid}
              </p>
            </div>

            <div class="critical-box">
              <div class="icon-large">💰</div>
              <h3 style="color: #dc2626; margin: 10px 0; text-align: center;">GARANTIE DE PAIEMENT - ACTION REQUISE</h3>
              
              <p style="color: #991b1b; font-size: 16px; font-weight: bold; text-align: center; margin: 15px 0;">
                Pour garantir votre paiement, vous DEVEZ demander au client de séquestrer les fonds sur la plateforme AVANT de commencer les travaux.
              </p>
            </div>

            <div class="payment-warning">
              <h3 style="color: #b45309; margin-top: 0;">🛡️ Pourquoi le séquestre est ESSENTIEL pour vous ?</h3>
              
              <div class="step-box">
                <p style="margin: 0;"><span class="step-number">1</span><strong>Protection contre les impayés</strong></p>
                <p style="color: #166534; font-size: 14px; margin: 5px 0 0 38px;">
                  Les fonds sont bloqués sur un compte sécurisé dès le début du projet. Vous êtes certain d'être payé une fois les travaux terminés et validés.
                </p>
              </div>

              <div class="step-box">
                <p style="margin: 0;"><span class="step-number">2</span><strong>Sécurité juridique</strong></p>
                <p style="color: #166534; font-size: 14px; margin: 5px 0 0 38px;">
                  Le séquestre constitue une preuve d'engagement du client. En cas de litige, vous disposez d'une garantie financière officielle.
                </p>
              </div>

              <div class="step-box">
                <p style="margin: 0;"><span class="step-number">3</span><strong>Libération automatique</strong></p>
                <p style="color: #166534; font-size: 14px; margin: 5px 0 0 38px;">
                  Une fois les travaux validés par le client, les fonds vous sont automatiquement versés sous 48h. Aucune relance nécessaire.
                </p>
              </div>

              <div class="step-box">
                <p style="margin: 0;"><span class="step-number">4</span><strong>Médiation en cas de désaccord</strong></p>
                <p style="color: #166534; font-size: 14px; margin: 5px 0 0 38px;">
                  Si un différend survient, notre équipe peut intervenir et les fonds restent bloqués jusqu'à résolution. Vous ne perdez jamais votre argent.
                </p>
              </div>
            </div>

            <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 0; color: #991b1b; font-size: 14px; font-weight: bold;">
                ⚠️ ATTENTION : Si vous acceptez un paiement en dehors de la plateforme (chèque, virement direct, espèces), vous perdez TOUTE protection et garantie SwipeTonPro. Nous ne pourrons pas intervenir en cas de problème.
              </p>
            </div>

            <h3 style="color: #333; margin: 25px 0 15px;">📋 Prochaines étapes</h3>
            
            <ol style="color: #555; font-size: 15px; line-height: 1.8;">
              <li>Contactez le client via la messagerie SwipeTonPro</li>
              <li><strong style="color: #dc2626;">Demandez-lui de séquestrer les fonds avant de commencer</strong></li>
              <li>Planifiez un rendez-vous pour discuter du projet en détail</li>
              <li>Établissez un devis détaillé via la plateforme</li>
              <li>Une fois le devis accepté et les fonds séquestrés, démarrez les travaux en toute sérénité</li>
            </ol>

            <p style="text-align: center; margin: 30px 0;">
              <a href="${data.dashboardUrl}" class="cta-button">Accéder au projet →</a>
            </p>

            <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 0; color: #1e40af; font-size: 14px;">
                <strong>💡 Besoin d'aide ?</strong> Notre équipe support est disponible pour vous accompagner dans la mise en place du séquestre et répondre à toutes vos questions : <strong>support@swipetonpro.fr</strong>
              </p>
            </div>
            
            <div class="footer">
              <p>SwipeTonPro - Plateforme de mise en relation BTP</p>
              <p style="margin-top: 10px; color: #dc2626; font-weight: bold;">🔒 Exigez toujours le séquestre des fonds pour votre protection</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * E-mail envoyé au PARTICULIER lors d'un matching
 * Rappelle l'importance de rester sur la plateforme
 */
export function getMatchConfirmedClientEmail(data: {
  clientName: string;
  proName: string;
  projectTitle: string;
  dashboardUrl: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Votre professionnel est confirmé</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
          .success-box { background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; }
          .warning-box { background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .cta-button { display: inline-block; background: #0284c7; color: white; padding: 14px 36px; border-radius: 5px; text-decoration: none; font-weight: bold; margin: 20px 0; font-size: 16px; }
          .footer { text-align: center; font-size: 12px; color: #999; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
          ul.security-list { list-style: none; padding: 0; }
          ul.security-list li { padding: 8px 0; padding-left: 30px; position: relative; }
          ul.security-list li:before { content: "🔒"; position: absolute; left: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🤝 Votre professionnel est confirmé !</h1>
          </div>
          
          <div class="content">
            <p>Bonjour ${data.clientName},</p>
            
            <div class="success-box">
              <p><strong>Excellente nouvelle !</strong> <strong>${data.proName}</strong> a confirmé la mise en relation pour votre projet <strong>"${data.projectTitle}"</strong>.</p>
              <p>Il va vous contacter très prochainement via la messagerie SwipeTonPro.</p>
            </div>

            <div class="warning-box">
              <h3 style="color: #b45309; margin-top: 0;">⚠️ RAPPEL IMPORTANT - SÉCURITÉ</h3>
              
              <p style="color: #78350f; font-size: 15px; font-weight: bold;">
                Pour votre protection, communiquez EXCLUSIVEMENT via la messagerie SwipeTonPro.
              </p>

              <ul class="security-list" style="color: #78350f; font-size: 14px;">
                <li><strong>Tous vos échanges sont conservés</strong> et peuvent servir de preuve en cas de litige</li>
                <li><strong>Notre équipe surveille</strong> les conversations pour détecter les comportements suspects</li>
                <li><strong>Le support peut intervenir</strong> rapidement si vous rencontrez un problème</li>
                <li><strong>Vos données personnelles</strong> restent protégées</li>
              </ul>

              <p style="color: #991b1b; font-size: 14px; font-weight: bold; margin-top: 15px; padding: 10px; background: #fee2e2; border-radius: 5px;">
                ⛔ Ne partagez JAMAIS vos coordonnées personnelles (téléphone, e-mail) avant la signature du contrat officiel.
              </p>
            </div>

            <p style="text-align: center; margin: 30px 0;">
              <a href="${data.dashboardUrl}" class="cta-button">Accéder à la messagerie →</a>
            </p>

            <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 0; color: #1e40af; font-size: 14px;">
                <strong>💡 Prochaines étapes :</strong> Le professionnel va vous contacter pour discuter de votre projet. Vous pourrez ensuite planifier un rendez-vous et recevoir un devis détaillé, le tout via la plateforme sécurisée.
              </p>
            </div>
            
            <div class="footer">
              <p>SwipeTonPro - Plateforme de mise en relation BTP</p>
              <p>Pour toute question : <strong>support@swipetonpro.fr</strong></p>
              <p style="margin-top: 10px; color: #dc2626; font-weight: bold;">🔒 Restez sur la plateforme pour votre sécurité</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}
