import { NextApiRequest, NextApiResponse } from 'next';

async function sendProjectStatusEmail(data: {
  projectId: string;
  projectTitle: string;
  clientEmail: string;
  action: 'validate' | 'reject';
  reason?: string;
}) {
  // Vérifier si la clé API Resend est configurée
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY non configurée pour les notifications');
    return false;
  }

  try {
    const isValidation = data.action === 'validate';
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SwipeTonPro <contact@swipetonpro.fr>',
        to: [data.clientEmail],
        subject: isValidation 
          ? `✅ Votre projet "${data.projectTitle}" a été validé !`
          : `❌ Votre projet "${data.projectTitle}" a été rejeté`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>${isValidation ? 'Projet Validé' : 'Projet Rejeté'}</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: ${isValidation ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)'}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .project-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${isValidation ? '#10b981' : '#ef4444'}; }
              .cta { display: inline-block; background: ${isValidation ? '#10b981' : '#ef4444'}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${isValidation ? '✅ Projet Validé !' : '❌ Projet Rejeté'}</h1>
              <p>${isValidation ? 'Votre projet a été approuvé et est maintenant visible' : 'Votre projet n\'a pas été approuvé'}</p>
            </div>
            
            <div class="content">
              <div class="project-info">
                <h3>📋 Informations du projet</h3>
                <p><strong>Titre :</strong> ${data.projectTitle}</p>
                <p><strong>ID :</strong> ${data.projectId}</p>
                <p><strong>Statut :</strong> ${isValidation ? 'Validé' : 'Rejeté'}</p>
                ${data.reason ? `<p><strong>Raison :</strong> ${data.reason}</p>` : ''}
              </div>
              
              ${isValidation ? `
                <p>Félicitations ! Votre projet est maintenant visible sur notre plateforme et les professionnels peuvent commencer à y répondre.</p>
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/projets/${data.projectId}" class="cta">Voir mon projet</a>
              ` : `
                <p>Nous sommes désolés, mais votre projet ne répond pas à nos critères de publication.</p>
                <p>Vous pouvez modifier votre projet et le soumettre à nouveau.</p>
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/projets/${data.projectId}/edit" class="cta">Modifier mon projet</a>
              `}
            </div>
            
            <div class="footer">
              <p>Cet email a été envoyé automatiquement par SwipeTonPro</p>
              <p>Date: ${new Date().toLocaleString('fr-FR')}</p>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Erreur Resend notification:', errorData);
      return false;
    }

    console.log(`✅ Email de ${isValidation ? 'validation' : 'rejet'} envoyé à ${data.clientEmail}`);
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
    const { projectId, projectTitle, clientEmail, action, reason } = req.body;

    // Validation des données
    if (!projectId || !projectTitle || !clientEmail || !action) {
      return res.status(400).json({ 
        error: 'Données manquantes: projectId, projectTitle, clientEmail, action sont requis' 
      });
    }

    if (!['validate', 'reject'].includes(action)) {
      return res.status(400).json({ 
        error: 'Action invalide. Actions possibles: validate, reject' 
      });
    }

    // Envoyer l'email
    const emailSent = await sendProjectStatusEmail({
      projectId,
      projectTitle,
      clientEmail,
      action,
      reason,
    });

    if (!emailSent) {
      // En cas d'échec, retourner quand même un succès pour ne pas bloquer le processus
      // mais logger le problème
      return res.status(200).json({
        success: true,
        message: 'Statut du projet mis à jour',
        note: process.env.NODE_ENV === 'development' 
          ? 'Email non envoyé (problème de configuration Resend)'
          : 'Mise à jour effectuée',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Email de ${action === 'validate' ? 'validation' : 'rejet'} envoyé avec succès`,
    });

  } catch (error) {
    console.error('❌ Erreur API notification projet:', error);
    
    // En cas d'erreur serveur, retourner quand même un succès pour ne pas bloquer
    return res.status(200).json({
      success: true,
      message: 'Statut du projet mis à jour',
      note: process.env.NODE_ENV === 'development' 
        ? 'Erreur: ' + (error as Error).message
        : 'Mise à jour effectuée',
    });
  }
}
