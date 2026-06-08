import { NextApiRequest, NextApiResponse } from 'next';

async function sendAccountActionEmail(data: {
  email: string;
  userName: string;
  action: string;
  reason?: string;
}) {
  // Vérifier si la clé API Resend est configurée
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY non configurée pour les notifications');
    return false;
  }

  try {
    let subject = '';
    let htmlContent = '';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.swipetonpro.fr';

    switch (data.action) {
      case 'activate':
        subject = `✅ Votre compte SwipeTonPro a été réactivé`;
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Compte Réactivé</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>✅ Compte Réactivé</h1>
              <p>Votre compte a été réactivé avec succès</p>
            </div>
            <div class="content">
              <p>Bonjour ${data.userName},</p>
              <p>Nous avons le plaisir de vous informer que votre compte SwipeTonPro a été réactivé.</p>
              <div class="info-box">
                <p><strong>Action :</strong> Réactivation</p>
                <p><strong>Date :</strong> ${new Date().toLocaleString('fr-FR')}</p>
              </div>
              <p>Vous pouvez maintenant vous connecter et utiliser votre compte normalement.</p>
              <p style="text-align: center; margin-top: 20px;">
                <a href="${siteUrl}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Me connecter</a>
              </p>
            </div>
            <div class="footer">
              <p>Cet email a été envoyé automatiquement par SwipeTonPro</p>
            </div>
          </body>
          </html>
        `;
        break;

      case 'suspend':
        subject = `⚠️ Votre compte SwipeTonPro a été suspendu`;
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Compte Suspendu</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>⚠️ Compte Suspendu</h1>
              <p>Votre compte a été temporairement suspendu</p>
            </div>
            <div class="content">
              <p>Bonjour ${data.userName},</p>
              <p>Nous vous informons que votre compte SwipeTonPro a été suspendu temporairement.</p>
              ${data.reason ? `
              <div class="info-box">
                <p><strong>Raison :</strong> ${data.reason}</p>
              </div>
              ` : ''}
              <p>Pour réactiver votre compte, veuillez contacter notre support.</p>
              <p style="text-align: center; margin-top: 20px;">
                <a href="mailto:support@swipetonpro.fr" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Contacter le support</a>
              </p>
            </div>
            <div class="footer">
              <p>Cet email a été envoyé automatiquement par SwipeTonPro</p>
            </div>
          </body>
          </html>
        `;
        break;

      case 'block':
        subject = `🚫 Votre compte SwipeTonPro a été bloqué`;
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Compte Bloqué</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🚫 Compte Bloqué</h1>
              <p>Votre compte a été bloqué</p>
            </div>
            <div class="content">
              <p>Bonjour ${data.userName},</p>
              <p>Nous vous informons que votre compte SwipeTonPro a été bloqué suite à une violation de nos conditions d'utilisation.</p>
              ${data.reason ? `
              <div class="info-box">
                <p><strong>Raison :</strong> ${data.reason}</p>
              </div>
              ` : ''}
              <p>Si vous pensez qu'il s'agit d'une erreur, veuillez contacter notre support.</p>
              <p style="text-align: center; margin-top: 20px;">
                <a href="mailto:support@swipetonpro.fr" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Contacter le support</a>
              </p>
            </div>
            <div class="footer">
              <p>Cet email a été envoyé automatiquement par SwipeTonPro</p>
            </div>
          </body>
          </html>
        `;
        break;

      case 'delete':
        subject = `🗑️ Votre compte SwipeTonPro a été supprimé`;
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Compte Supprimé</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #6b7280, #4b5563); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6b7280; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🗑️ Compte Supprimé</h1>
              <p>Votre compte a été supprimé</p>
            </div>
            <div class="content">
              <p>Bonjour ${data.userName},</p>
              <p>Nous vous informons que votre compte SwipeTonPro a été supprimé.</p>
              ${data.reason ? `
              <div class="info-box">
                <p><strong>Raison :</strong> ${data.reason}</p>
              </div>
              ` : ''}
              <p>Toutes vos données ont été supprimées conformément à notre politique de confidentialité.</p>
              <p>Merci d'avoir utilisé SwipeTonPro.</p>
            </div>
            <div class="footer">
              <p>Cet email a été envoyé automatiquement par SwipeTonPro</p>
            </div>
          </body>
          </html>
        `;
        break;

      case 'admin':
      case 'support':
      case 'moderator':
        subject = `🎉 Vous avez été promu sur SwipeTonPro`;
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Promotion</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🎉 Félicitations !</h1>
              <p>Vous avez été promu</p>
            </div>
            <div class="content">
              <p>Bonjour ${data.userName},</p>
              <p>Nous avons le plaisir de vous informer que vous avez été promu au rôle de <strong>${data.action}</strong> sur SwipeTonPro.</p>
              <div class="info-box">
                <p><strong>Nouveau rôle :</strong> ${data.action}</p>
                <p><strong>Date :</strong> ${new Date().toLocaleString('fr-FR')}</p>
              </div>
              <p>Vous pouvez maintenant accéder aux nouvelles fonctionnalités liées à votre rôle.</p>
              <p style="text-align: center; margin-top: 20px;">
                <a href="${siteUrl}" style="background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Accéder à mon compte</a>
              </p>
            </div>
            <div class="footer">
              <p>Cet email a été envoyé automatiquement par SwipeTonPro</p>
            </div>
          </body>
          </html>
        `;
        break;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SwipeTonPro <contact@swipetonpro.fr>',
        to: [data.email],
        subject: subject,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Erreur Resend notification:', errorData);
      return false;
    }

    console.log(`✅ Email de notification ${data.action} envoyé à ${data.email}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email notification:', error);
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { email, userName, action, reason } = req.body;

    // Validation des données
    if (!email || !userName || !action) {
      return res.status(400).json({ 
        error: 'Données manquantes: email, userName, action sont requis' 
      });
    }

    // Envoyer l'email
    const emailSent = await sendAccountActionEmail({
      email,
      userName,
      action,
      reason,
    });

    if (!emailSent) {
      // En cas d'échec, retourner quand même un succès pour ne pas bloquer le processus
      return res.status(200).json({
        success: true,
        message: 'Action effectuée',
        note: process.env.NODE_ENV === 'development' 
          ? 'Email non envoyé (problème de configuration Resend)'
          : 'Action effectuée',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Email de notification envoyé avec succès`,
    });

  } catch (error) {
    console.error('❌ Erreur API notification compte:', error);
    
    // En cas d'erreur serveur, retourner quand même un succès pour ne pas bloquer
    return res.status(200).json({
      success: true,
      message: 'Action effectuée',
      note: process.env.NODE_ENV === 'development' 
        ? 'Erreur: ' + (error as Error).message
        : 'Action effectuée',
    });
  }
}
