/**
 * Script de Test - Configuration SMTP Resend
 * 
 * Ce script teste l'envoi d'emails via Resend pour vérifier
 * que la configuration SMTP est correcte.
 */

const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testResendEmail() {
  log('\n🧪 Test de Configuration SMTP Resend', 'cyan');
  log('=====================================\n', 'cyan');

  // Vérifier les variables d'environnement
  log('📋 Vérification des variables d\'environnement...', 'blue');
  
  const config = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    fromAddress: process.env.SMTP_USER_NOREPLY,
  };

  log(`   Host: ${config.host}`, 'yellow');
  log(`   Port: ${config.port}`, 'yellow');
  log(`   User: ${config.user}`, 'yellow');
  log(`   Password: ${config.password ? '***' + config.password.slice(-4) : 'NON DÉFINI'}`, 'yellow');
  log(`   From: ${config.fromAddress}\n`, 'yellow');

  // Vérifier que toutes les variables sont définies
  if (!config.host || !config.user || !config.password || !config.fromAddress) {
    log('❌ ERREUR: Variables d\'environnement manquantes!', 'red');
    log('   Assurez-vous que .env.local contient:', 'red');
    log('   - SMTP_HOST', 'red');
    log('   - SMTP_PORT', 'red');
    log('   - SMTP_USER', 'red');
    log('   - SMTP_PASSWORD', 'red');
    log('   - SMTP_USER_NOREPLY\n', 'red');
    process.exit(1);
  }

  // Créer le transporter
  log('🔧 Création du transporter Nodemailer...', 'blue');
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: true, // SSL/TLS
    auth: {
      user: config.user,
      pass: config.password,
    },
  });

  // Vérifier la connexion
  log('🔌 Test de connexion au serveur SMTP...', 'blue');
  try {
    await transporter.verify();
    log('✅ Connexion au serveur SMTP réussie!\n', 'green');
  } catch (error) {
    log('❌ Échec de la connexion au serveur SMTP:', 'red');
    log(`   ${error.message}\n`, 'red');
    process.exit(1);
  }

  // Demander l'email de destination
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

  log('📧 Envoi d\'un email de test...', 'blue');
  const toEmail = await askQuestion('   Entrez l\'adresse email de destination (ou appuyez sur Entrée pour utiliser noreply@swipetonpro.fr): ');
  const destinationEmail = toEmail.trim() || 'noreply@swipetonpro.fr';
  
  rl.close();

  // Préparer l'email de test
  const mailOptions = {
    from: `"SwipeTonPro Test" <${config.fromAddress}>`,
    to: destinationEmail,
    subject: '✅ Test Configuration SMTP Resend - SwipeTonPro',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            h1 { margin: 0; font-size: 24px; }
            h2 { color: #667eea; margin-top: 0; }
            ul { padding-left: 20px; }
            li { margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Test Réussi!</h1>
            </div>
            <div class="content">
              <h2>Configuration SMTP Resend Fonctionnelle</h2>
              
              <div class="success">
                <strong>🎉 Félicitations!</strong><br>
                Votre configuration SMTP avec Resend fonctionne correctement.
              </div>

              <div class="info">
                <strong>📋 Détails de la configuration:</strong>
                <ul>
                  <li><strong>Serveur SMTP:</strong> ${config.host}</li>
                  <li><strong>Port:</strong> ${config.port}</li>
                  <li><strong>Sécurité:</strong> SSL/TLS activé</li>
                  <li><strong>Expéditeur:</strong> ${config.fromAddress}</li>
                  <li><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</li>
                </ul>
              </div>

              <h3>✨ Prochaines étapes:</h3>
              <ul>
                <li>Vérifiez que le domaine <strong>swipetonpro.fr</strong> est vérifié dans Resend</li>
                <li>Configurez les enregistrements DNS (SPF, DKIM, DMARC)</li>
                <li>Testez les emails d'authentification Supabase</li>
                <li>Surveillez les logs Resend pour la délivrabilité</li>
              </ul>

              <div class="footer">
                <p>SwipeTonPro - Plateforme de mise en relation<br>
                Email envoyé via Resend SMTP</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Test Configuration SMTP Resend - SwipeTonPro
=============================================

✅ Félicitations! Votre configuration SMTP avec Resend fonctionne correctement.

Détails de la configuration:
- Serveur SMTP: ${config.host}
- Port: ${config.port}
- Sécurité: SSL/TLS activé
- Expéditeur: ${config.fromAddress}
- Date: ${new Date().toLocaleString('fr-FR')}

Prochaines étapes:
1. Vérifiez que le domaine swipetonpro.fr est vérifié dans Resend
2. Configurez les enregistrements DNS (SPF, DKIM, DMARC)
3. Testez les emails d'authentification Supabase
4. Surveillez les logs Resend pour la délivrabilité

SwipeTonPro - Plateforme de mise en relation
Email envoyé via Resend SMTP
    `,
  };

  // Envoyer l'email
  try {
    log(`   Envoi vers: ${destinationEmail}...`, 'yellow');
    const info = await transporter.sendMail(mailOptions);
    
    log('\n✅ EMAIL ENVOYÉ AVEC SUCCÈS!', 'green');
    log('=====================================', 'green');
    log(`   Message ID: ${info.messageId}`, 'green');
    log(`   Destinataire: ${destinationEmail}`, 'green');
    log(`   Expéditeur: ${config.fromAddress}`, 'green');
    log(`   Serveur: ${config.host}:${config.port}\n`, 'green');
    
    log('📊 Vérifications recommandées:', 'cyan');
    log('   1. Vérifiez votre boîte de réception', 'yellow');
    log('   2. Consultez le dashboard Resend pour les statistiques', 'yellow');
    log('   3. Vérifiez que l\'email n\'est pas dans les spams\n', 'yellow');
    
  } catch (error) {
    log('\n❌ ERREUR LORS DE L\'ENVOI:', 'red');
    log('=====================================', 'red');
    log(`   Message: ${error.message}`, 'red');
    if (error.code) log(`   Code: ${error.code}`, 'red');
    if (error.command) log(`   Commande: ${error.command}`, 'red');
    if (error.response) log(`   Réponse: ${error.response}`, 'red');
    log('', 'red');
    
    log('🔧 Solutions possibles:', 'yellow');
    log('   1. Vérifiez que la clé API Resend est correcte', 'yellow');
    log('   2. Assurez-vous que le domaine est vérifié dans Resend', 'yellow');
    log('   3. Vérifiez les paramètres SMTP dans .env.local', 'yellow');
    log('   4. Consultez la documentation: https://resend.com/docs\n', 'yellow');
    
    process.exit(1);
  }
}

// Exécuter le test
testResendEmail().catch((error) => {
  log(`\n❌ Erreur inattendue: ${error.message}`, 'red');
  process.exit(1);
});
