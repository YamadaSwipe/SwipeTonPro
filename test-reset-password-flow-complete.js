require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

console.log('🔍 TEST COMPLET DU FLUX DE RÉINITIALISATION DE MOT DE PASSE\n');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_EMAIL = 'admin@swipetonpro.fr';
const REDIRECT_URL = 'https://www.swipetonpro.fr/auth/reset-password';

async function testCompleteFlow() {
  try {
    console.log('1️⃣ Génération du lien de récupération via Supabase Admin...');
    console.log('   Email:', TEST_EMAIL);
    console.log('   Redirect URL:', REDIRECT_URL);
    console.log('');

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: TEST_EMAIL,
      options: {
        redirectTo: REDIRECT_URL,
      },
    });

    if (error) {
      console.error('❌ Erreur lors de la génération du lien:', error);
      return;
    }

    const resetLink = data?.properties?.action_link;
    
    if (!resetLink) {
      console.error('❌ Aucun lien généré');
      return;
    }

    console.log('✅ Lien de récupération généré avec succès!');
    console.log('');
    console.log('📋 DÉTAILS DU LIEN:');
    console.log('─'.repeat(80));
    console.log('Lien complet:', resetLink);
    console.log('─'.repeat(80));
    console.log('');

    // Analyser le lien
    const url = new URL(resetLink);
    console.log('🔍 ANALYSE DU LIEN:');
    console.log('   Base URL:', url.origin + url.pathname);
    console.log('   Hash:', url.hash);
    console.log('');

    // Extraire les paramètres du hash
    if (url.hash) {
      const hashParams = new URLSearchParams(url.hash.substring(1));
      console.log('📦 PARAMÈTRES DU HASH:');
      for (const [key, value] of hashParams.entries()) {
        if (key === 'access_token' || key === 'refresh_token') {
          console.log(`   ${key}: ${value.substring(0, 20)}...`);
        } else {
          console.log(`   ${key}: ${value}`);
        }
      }
      console.log('');
    }

    console.log('2️⃣ Envoi de l\'email avec le lien...');
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true,
      auth: {
        user: process.env.SMTP_USER_NOREPLY || 'noreply@swipetonpro.fr',
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: true,
      },
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .container { background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #ff6b35, #f7931e); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .button { display: inline-block; background: #ff6b35; color: white !important; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .link-box { word-break: break-all; background: #f9f9f9; padding: 15px; border: 1px solid #ddd; border-radius: 5px; font-family: monospace; font-size: 12px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; background-color: #f9f9f9; }
          .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 SwipeTonPro</h1>
          </div>
          <div class="content">
            <h2>Réinitialisation de votre mot de passe</h2>
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

    const mailOptions = {
      from: `"SwipeTonPro" <${process.env.SMTP_USER_NOREPLY}>`,
      to: TEST_EMAIL,
      subject: '🔐 Réinitialisation de votre mot de passe - SwipeTonPro',
      html: htmlContent,
      replyTo: 'support@swipetonpro.fr',
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email envoyé avec succès!');
    console.log('   Message ID:', info.messageId);
    console.log('   Destinataire:', TEST_EMAIL);
    console.log('');

    console.log('═'.repeat(80));
    console.log('✅ TEST COMPLET RÉUSSI!');
    console.log('═'.repeat(80));
    console.log('');
    console.log('📬 Vérifiez votre boîte mail:', TEST_EMAIL);
    console.log('🔗 Cliquez sur le lien dans l\'email pour tester le flux complet');
    console.log('');
    console.log('⚠️  IMPORTANT:');
    console.log('   - Le lien contient un hash (#) avec les tokens d\'authentification');
    console.log('   - La page /auth/reset-password doit extraire ces tokens du hash');
    console.log('   - Les tokens sont valables pendant 1 heure');
    console.log('   - Ils ne peuvent être utilisés qu\'une seule fois');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ ERREUR:', error.message);
    console.error('');
    console.error('Détails complets:', error);
  }
}

testCompleteFlow();
