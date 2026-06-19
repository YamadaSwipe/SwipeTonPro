import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { resetPasswordRateLimit } from '@/middleware/rateLimit';
import { sendEmailServerSide } from '@/lib/email';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PRODUCTION_URL = 'https://www.swipetonpro.fr';

function getHostBaseUrl(req: NextApiRequest): string {
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production' ||
    req.headers.host?.includes('swipetonpro.fr');

  if (isProduction) {
    return PRODUCTION_URL;
  }

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '');
  }

  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol =
    typeof forwardedProto === 'string' ? forwardedProto.split(',')[0] : 'http';
  const host = req.headers.host;

  if (host) {
    return `${protocol}://${host.replace(/\/+$|\s+/g, '')}`;
  }

  return 'http://localhost:3000';
}

function getRedirectUrl(req: NextApiRequest): string {
  return 'https://www.swipetonpro.fr/auth/reset-password';
}

function isUserNotFoundError(error: any): boolean {
  const message = error?.message?.toString() || '';
  return (
    message.includes('User with this email not found') ||
    message.includes('user not found') ||
    message.includes('not found') ||
    error?.status === 404
  );
}

/**
 * Génère un lien de récupération de mot de passe via Supabase Admin
 */
async function generateRecoveryLink(
  email: string,
  redirectUrl: string
): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      if (isUserNotFoundError(error)) {
        console.log('⚠️ Utilisateur non trouvé:', email);
        return null;
      }
      throw error;
    }

    const link = data?.properties?.action_link;
    if (!link || typeof link !== 'string') {
      throw new Error('Impossible de générer le lien de récupération.');
    }

    return link;
  } catch (error) {
    console.error('❌ Erreur lors de la génération du lien:', error);
    throw error;
  }
}

/**
 * Envoie l'email de réinitialisation via SMTP OVH (nodemailer)
 */
async function sendResetEmailViaSMTP(
  email: string,
  resetLink: string
): Promise<boolean> {
  try {
    console.log('📧 Envoi email de réinitialisation via SMTP OVH à:', email);
    console.log('🔗 Lien de réinitialisation:', resetLink);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Réinitialisation du mot de passe</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
            background-color: #f4f4f4;
          }
          .container {
            background-color: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #ff6b35, #f7931e); 
            padding: 30px; 
            text-align: center; 
          }
          .header h1 { 
            color: white; 
            margin: 0; 
            font-size: 28px; 
          }
          .content { 
            padding: 40px 30px; 
          }
          .button { 
            display: inline-block; 
            background: #ff6b35; 
            color: white !important; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            font-weight: bold; 
            margin: 20px 0; 
          }
          .button:hover { 
            background: #e55a2b; 
          }
          .link-box {
            word-break: break-all; 
            background: #f9f9f9; 
            padding: 15px; 
            border: 1px solid #ddd; 
            border-radius: 5px; 
            font-family: monospace; 
            font-size: 12px;
            margin: 20px 0;
          }
          .footer { 
            text-align: center; 
            padding: 20px; 
            color: #666; 
            font-size: 14px; 
            background-color: #f9f9f9;
          }
          .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 SwipeTonPro</h1>
          </div>
          <div class="content">
            <h2>Bonjour,</h2>
            <p>Vous avez demandé la réinitialisation de votre mot de passe sur SwipeTonPro.</p>
            <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" class="button">Réinitialiser mon mot de passe</a>
            </div>
            
            <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
            <div class="link-box">${resetLink}</div>
            
            <div class="warning">
              <strong>⚠️ Important :</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Ce lien est valable pendant 1 heure</li>
                <li>Il ne peut être utilisé qu'une seule fois</li>
                <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
              </ul>
            </div>
            
            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              Si vous rencontrez des difficultés, contactez notre support à 
              <a href="mailto:support@swipetonpro.fr">support@swipetonpro.fr</a>
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} SwipeTonPro - Tous droits réservés</p>
            <p>Équipe Support SwipeTonPro</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await sendEmailServerSide({
      to: email,
      subject: '🔐 Réinitialisation de votre mot de passe - SwipeTonPro',
      html: htmlContent,
      fromType: 'noreply',
      replyTo: 'support@swipetonpro.fr',
    });

    if (result.success) {
      console.log(
        '✅ Email de réinitialisation envoyé avec succès via SMTP OVH'
      );
      return true;
    } else {
      console.error("❌ Échec de l'envoi via SMTP OVH:", result.error);
      return false;
    }
  } catch (error: any) {
    console.error("❌ Erreur lors de l'envoi via SMTP:", error);
    console.error('❌ Détails:', error.message);
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Appliquer le rate limiting
  try {
    await new Promise<void>((resolve, reject) => {
      resetPasswordRateLimit(req, res, (err?: any) => {
        if (err) reject(err);
        else resolve();
      });
    });
  } catch (error) {
    // Le rate limiting a déjà envoyé une réponse
    return;
  }

  if (res.headersSent) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email requis' });
  }

  // Validation basique de l'email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Format d'email invalide" });
  }

  try {
    const redirectUrl = getRedirectUrl(req);
    console.log('🔗 URL de redirection configurée:', redirectUrl);
    console.log('📧 Demande de réinitialisation pour:', email);

    // Vérifier la configuration SMTP
    if (!process.env.SMTP_HOST || !process.env.SMTP_PASSWORD) {
      console.error('❌ Configuration SMTP manquante');
      return res.status(500).json({
        error: "Configuration email manquante. Contactez l'administrateur.",
      });
    }

    console.log('✅ Configuration SMTP OVH détectée');

    // Générer le lien de récupération via Supabase Admin
    const resetLink = await generateRecoveryLink(email, redirectUrl);

    if (!resetLink) {
      // Utilisateur non trouvé - on retourne quand même un succès pour la sécurité
      console.log('⚠️ Utilisateur non trouvé, mais on retourne un succès');
      return res.status(200).json({
        success: true,
        message:
          'Si cet email existe dans notre système, un lien de réinitialisation a été envoyé.',
      });
    }

    // Envoyer l'email via SMTP OVH
    const sent = await sendResetEmailViaSMTP(email, resetLink);

    if (!sent) {
      console.error("❌ Échec de l'envoi de l'email");
      return res.status(500).json({
        error:
          "Erreur lors de l'envoi de l'email de réinitialisation. Veuillez réessayer.",
      });
    }

    console.log('✅ Processus de réinitialisation terminé avec succès');
    return res.status(200).json({
      success: true,
      message:
        'Si cet email existe dans notre système, un lien de réinitialisation a été envoyé.',
    });
  } catch (error: any) {
    console.error('❌ Erreur serveur dans reset-password:', error);
    console.error('❌ Message:', error?.message);
    console.error('❌ Stack:', error?.stack);

    // Retourner une erreur plus détaillée pour le debugging
    return res.status(500).json({
      error: "Erreur lors de l'envoi du mail de réinitialisation",
      details:
        process.env.NODE_ENV === 'development'
          ? {
              message: error?.message,
              type: error?.name,
              code: error?.code,
            }
          : undefined,
    });
  }
}
