import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function sendResetEmailViaResend(
  email: string,
  resetLink: string
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY non configurée');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SwipeTonPro <contact@swipetonpro.fr>',
        to: [email],
        subject: '🔐 Réinitialisation de votre mot de passe - SwipeTonPro',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Réinitialisation du mot de passe</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; }
              .header { background: linear-gradient(135deg, #ff6b35, #f7931e); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .header h1 { color: white; margin: 0; }
              .content { background: #f9f9f9; padding: 40px 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #ff6b35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; }
              .button:hover { background: #e55a2b; }
              .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 SwipeTonPro - Réinitialisation de mot de passe</h1>
              </div>
              <div class="content">
                <h2>Bonjour,</h2>
                <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous :</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetLink}" class="button">Réinitialiser mon mot de passe</a>
                </div>
                
                <div class="warning">
                  <strong>⚠️ Important :</strong> Ce lien expire dans 1 heure. Ne le partagez avec personne.
                </div>
                
                <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
                <p style="word-break: break-all; background: white; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-family: monospace; font-size: 12px;">${resetLink}</p>
                
                <p><strong>Vous n'avez pas demandé cela ?</strong> Ignorez cet email.</p>
              </div>
              <div class="footer">
                <p>© SwipeTonPro - Équipe Support</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Erreur Resend:', error);
      return false;
    }

    console.log('✅ Email envoyé via Resend à:', email);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email requis' });
  }

  try {
    console.log('🔄 Demande reset password pour:', email);

    // Utiliser admin.generateLink pour créer un token de récupération valide
    const { data, error: generateError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
        },
      });

    if (generateError) {
      console.error('❌ Erreur admin.generateLink:', generateError);
      // Pas d'erreur en réponse (raison de sécurité)
      return res.status(200).json({
        success: true,
        message:
          'Si cet email existe, un lien de réinitialisation a été envoyé.',
      });
    }

    const actionLink = data?.properties?.action_link;
    if (!actionLink) {
      console.error('❌ Pas de lien généré');
      return res.status(200).json({
        success: true,
        message:
          'Si cet email existe, un lien de réinitialisation a été envoyé.',
      });
    }

    console.log('✅ Lien généré par Supabase:', actionLink);

    // Extraire le token du lien Supabase
    const tokenMatch = actionLink.match(/token=([^&]+)/);
    const token = tokenMatch ? tokenMatch[1] : '';

    if (!token) {
      console.error("❌ Impossible d'extraire le token du lien");
      return res.status(500).json({
        error: 'Erreur lors de la génération du lien',
      });
    }

    console.log('✅ Token extrait:', token.substring(0, 20) + '...');

    // Créer un lien forcé vers notre page de réinitialisation
    const PRODUCTION_URL = 'https://www.swipetonpro.fr';
    const forcedLink = `${PRODUCTION_URL}/auth/reset-password#access_token=${token}&type=recovery&redirect_to=${PRODUCTION_URL}/auth/reset-password`;

    console.log('🔗 Lien forcé créé:', forcedLink);

    // Envoyer via Resend avec notre template personnalisé
    const emailSent = await sendResetEmailViaResend(email, forcedLink);

    if (!emailSent) {
      console.warn('⚠️ Email non envoyé mais lien généré');
      return res.status(500).json({
        error: "Erreur lors de l'envoi de l'email",
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Un lien de réinitialisation a été envoyé à votre email.',
    });
  } catch (error: any) {
    console.error('❌ Erreur reset-password:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
    });
  }
}
