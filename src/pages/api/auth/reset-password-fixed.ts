import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PRODUCTION_URL = 'https://www.swipetonpro.fr';

function getHostBaseUrl(req: NextApiRequest): string {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol = typeof forwardedProto === 'string' ? forwardedProto.split(',')[0] : 'http';
  const host = req.headers.host;

  if (host) {
    return `${protocol}://${host.replace(/\/+$|\s+/g, '')}`;
  }

  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') ?? PRODUCTION_URL;
}

function getRedirectUrl(req: NextApiRequest): string {
  return `${getHostBaseUrl(req)}/auth/reset-password`;
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

async function generateRecoveryLink(
  email: string,
  redirectUrl: string
): Promise<string | null> {
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: {
      redirectTo: redirectUrl,
    },
  });

  if (error) {
    console.error('❌ Erreur generation recovery link:', error);
    if (isUserNotFoundError(error)) {
      return null;
    }
    throw error;
  }

  const link = data?.properties?.action_link;
  if (!link || typeof link !== 'string') {
    throw new Error('Impossible de générer le lien de récupération.');
  }

  return link;
}

async function sendResetEmailViaResend(
  email: string,
  resetLink: string
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY non configurée');
    return false;
  }

  try {
    console.log('📧 Envoi Resend de l’email de réinitialisation à:', email);

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
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Réinitialisation du mot de passe</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #ff6b35, #f7931e); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .header h1 { color: white; margin: 0; font-size: 28px; }
              .content { background: #f9f9f9; padding: 40px 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #ff6b35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
              .button:hover { background: #e55a2b; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🔐 SwipeTonPro</h1>
            </div>
            <div class="content">
              <h2>Bonjour,</h2>
              <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous :</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" class="button">Réinitialiser mon mot de passe</a>
              </div>
              <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
              <p style="word-break: break-all; background: white; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-family: monospace; font-size: 12px;">${resetLink}</p>
              <p><strong>Vous n'avez pas demandé cette réinitialisation ?</strong> Ignorez cet email.</p>
            </div>
            <div class="footer">
              <p>© SwipeTonPro - Équipe Support</p>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Erreur Resend:', error);
      throw new Error(`Resend API error: ${error.message}`);
    }

    console.log('✅ Email envoyé via Resend à:', email);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email Resend:', error);
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
    console.log('🔄 Début processus de réinitialisation FORCÉ pour:', email);

    const redirectUrl = getRedirectUrl(req);
    console.log('🔗 redirectTo calculé:', redirectUrl);

    if (process.env.RESEND_API_KEY) {
      const resetLink = await generateRecoveryLink(email, redirectUrl);
      if (!resetLink) {
        return res.status(200).json({
          success: true,
          message:
            'Si cet email existe dans notre système, un lien de réinitialisation a été envoyé.',
        });
      }

      const sent = await sendResetEmailViaResend(email, resetLink);

      if (!sent) {
        console.error('❌ Le mail Resend n a pas pu être envoyé');
        return res.status(500).json({
          error: 'Erreur envoi email de réinitialisation',
        });
      }

      return res.status(200).json({
        success: true,
        message:
          'Si cet email existe dans notre système, un lien de réinitialisation a été envoyé.',
      });
    }

    const { error: resetError } =
      await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

    if (resetError) {
      console.error('❌ Erreur resetPasswordForEmail:', resetError);
      return res.status(500).json({
        error: 'Erreur de réinitialisation',
      });
    }

    console.log('✅ Email de réinitialisation envoyé via Supabase à:', email);
    return res.status(200).json({
      success: true,
      message:
        'Si cet email existe dans notre système, un lien de réinitialisation a été envoyé.',
    });
  } catch (error: any) {
    console.error('❌ Erreur reset-password-fixed API:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      details: error?.message ?? 'Erreur inconnue',
    });
  }
}
