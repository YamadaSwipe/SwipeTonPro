require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

console.log('🔍 TEST RESET PASSWORD AVEC EMAIL RÉEL\n');

// Configuration
const SMTP_CONFIG = {
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
  debug: true,
  logger: true,
};

console.log('1️⃣ Configuration SMTP:');
console.log('   Host:', SMTP_CONFIG.host);
console.log('   Port:', SMTP_CONFIG.port);
console.log('   User:', SMTP_CONFIG.auth.user);
console.log('   Password:', SMTP_CONFIG.auth.pass ? '✅ Défini' : '❌ Manquant');
console.log('');

// Email de test vers admin@swipetonpro.fr (compte réel)
const TEST_EMAIL = 'admin@swipetonpro.fr';

async function testEmailSend() {
  try {
    console.log('2️⃣ Création du transporter...');
    const transporter = nodemailer.createTransport(SMTP_CONFIG);

    console.log('');
    console.log('3️⃣ Vérification de la connexion...');
    await transporter.verify();
    console.log('✅ Connexion SMTP vérifiée!\n');

    console.log('4️⃣ Envoi d\'email de test à:', TEST_EMAIL);
    const resetLink = 'https://www.swipetonpro.fr/auth/reset-password?token=test123';
    
    const mailOptions = {
      from: `"SwipeTonPro" <${SMTP_CONFIG.auth.user}>`,
      to: TEST_EMAIL,
      subject: '🔐 Test - Réinitialisation de mot de passe',
      html: `
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
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 SwipeTonPro</h1>
            </div>
            <div class="content">
              <h2>Test de réinitialisation de mot de passe</h2>
              <p>Ceci est un email de test pour vérifier la configuration SMTP OVH.</p>
              <p>Cliquez sur le bouton ci-dessous pour tester le lien :</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" class="button">Tester le lien</a>
              </div>
              <p><strong>Date du test:</strong> ${new Date().toLocaleString('fr-FR')}</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} SwipeTonPro - Email de test</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    console.log('');
    const info = await transporter.sendMail(mailOptions);
    console.log('');
    console.log('✅ EMAIL ENVOYÉ AVEC SUCCÈS!');
    console.log('   Message ID:', info.messageId);
    console.log('   Destinataire:', TEST_EMAIL);
    console.log('   Réponse:', info.response);
    console.log('');
    console.log('📬 Vérifiez votre boîte mail:', TEST_EMAIL);
    
  } catch (error) {
    console.error('');
    console.error('❌ ERREUR:', error.message);
    if (error.code) console.error('   Code:', error.code);
    if (error.response) console.error('   Réponse:', error.response);
    if (error.responseCode) console.error('   Code réponse:', error.responseCode);
    console.error('');
    console.error('Détails complets:', error);
  }
}

testEmailSend();
