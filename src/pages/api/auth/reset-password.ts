import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// FORCER TOUJOURS le domaine de production pour corriger le problème localhost
const BASE_URL = 'https://www.swipetonpro.fr';

console.log('🔒 BASE_URL FORCÉ (production):', BASE_URL);

// Fonction pour envoyer l'email via Resend
async function sendResetEmail(email: string, resetLink: string) {
  // Vérifier si la clé API Resend est configurée
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY non configurée');
    return false;
  }

  try {
    console.log("📧 Tentative d'envoi email via Resend à:", email);

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
              .security { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🔐 SwipeTonPro</h1>
            </div>
            
            <div class="content">
              <h2>Bonjour,</h2>
              <p>Vous avez demandé la réinitialisation de votre mot de passe sur SwipeTonPro.</p>
              
              <div class="security">
                <strong>⚠️ Important :</strong> Ce lien est valable 1 heure seulement. Ne le partagez avec personne.
              </div>
              
              <p style="text-align: center;">
                <a href="${resetLink}" class="button">Réinitialiser mon mot de passe</a>
              </p>
              
              <p>Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :</p>
              <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px; font-family: monospace;">
                ${resetLink}
              </p>
              
              <p><strong>Si vous n'avez pas demandé cette réinitialisation</strong>, ignorez cet email. Votre mot de passe restera inchangé.</p>
            </div>
            
            <div class="footer">
              <p>Cordialement,<br>L'équipe SwipeTonPro</p>
              <p style="font-size: 12px; margin-top: 20px;">
                Cet email a été envoyé automatiquement. Merci de ne pas y répondre.
              </p>
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

    console.log('✅ Email de réinitialisation envoyé via Resend à:', email);
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
    console.log('🔄 Début processus de réinitialisation pour:', email);

    // Générer le lien de récupération avec le service role
    const redirectUrl = `${BASE_URL}/auth/reset-password`;
    console.log('🔗 Reset password redirect URL:', redirectUrl);
    console.log('🌍 Environment:', process.env.NODE_ENV);
    console.log('📧 BASE_URL:', BASE_URL);

    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: {
          redirectTo: redirectUrl,
        },
      });

    if (linkError) {
      console.error('❌ Erreur generateLink:', linkError);

      // Si l'utilisateur n'existe pas, on retourne quand même un succès (sécurité)
      if (
        linkError.message?.includes('User not found') ||
        linkError.message?.includes('user not found') ||
        linkError.status === 404 ||
        linkError.code === 'user_not_found'
      ) {
        return res.status(200).json({
          success: true,
          message:
            'Si cet email existe dans notre système, un lien de réinitialisation a été envoyé.',
        });
      }

      return res.status(500).json({
        error: 'Impossible de générer le lien de réinitialisation',
        details: linkError.message,
      });
    }

    // @ts-ignore - properties properties not fully typed
    const resetLink =
      (linkData.properties as any)?.action_link ||
      (linkData.properties as any)?.link;

    console.log('✅ Lien de réinitialisation généré pour:', email);

    // Envoyer l'email via Resend
    const emailSent = await sendResetEmail(email, resetLink);

    if (!emailSent) {
      // Si l'email échoue, retourner toujours un succès pour la sécurité
      // mais avec un message approprié
      return res.status(200).json({
        success: true,
        message:
          'Si cet email existe dans notre système, un lien de réinitialisation a été envoyé.',
        note:
          process.env.NODE_ENV === 'development'
            ? 'En développement: Resend peut ne pas être configuré.'
            : 'Vérifiez votre boîte de réception et vos spams.',
      });
    }

    return res.status(200).json({
      success: true,
      message:
        'Un email de réinitialisation a été envoyé à votre adresse email.',
      note: 'Vérifiez votre boîte de réception et vos spams.',
    });
  } catch (error: any) {
    console.error('❌ Erreur reset-password API:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      details: error.message,
    });
  }
}
