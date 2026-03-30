// Script de test pour vérifier la configuration email
require('dotenv').config({ path: '.env.local' });

// Import direct du module email
const path = require('path');
const fs = require('fs');

// Charger le module email
const emailModulePath = path.join(__dirname, 'src', 'lib', 'email.ts');
const emailCode = fs.readFileSync(emailModulePath, 'utf8');

// Exécuter le code dans ce contexte
const module = { exports: {} };
const evalCode = emailCode.replace(/import\s+.*?from\s+['"`]([^'"`]+)['"`]/g, '');
eval(evalCode);

const { sendEmailServerSide } = module.exports;

async function testEmailConfig() {
  console.log('🔧 TEST DE CONFIGURATION EMAIL');
  console.log('==================================');
  
  // Vérifier les variables d'environnement
  console.log('\n📋 VARIABLES D\'ENVIRONNEMENT:');
  console.log(`SMTP_HOST: ${process.env.SMTP_HOST || 'NON DÉFINI'}`);
  console.log(`SMTP_PORT: ${process.env.SMTP_PORT || 'NON DÉFINI'}`);
  console.log(`SMTP_USER_NOREPLY: ${process.env.SMTP_USER_NOREPLY || 'NON DÉFINI'}`);
  console.log(`SMTP_PASSWORD: ${process.env.SMTP_PASSWORD ? 'DÉFINI' : 'NON DÉFINI'}`);
  console.log(`NEXT_PUBLIC_SITE_URL: ${process.env.NEXT_PUBLIC_SITE_URL || 'NON DÉFINI'}`);
  
  if (!process.env.SMTP_PASSWORD) {
    console.error('\n❌ ERREUR: SMTP_PASSWORD n\'est pas défini dans .env.local');
    console.log('Veuillez ajouter cette variable d\'environnement:');
    console.log('SMTP_PASSWORD=votre_mot_de_passe_ovh');
    return;
  }
  
  // Test d'envoi d'email
  console.log('\n📧 TEST D\'ENVOI D\'EMAIL:');
  
  const testHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">🧪 Test de configuration email</h2>
      <p>Ceci est un email de test pour vérifier que la configuration SMTP fonctionne correctement.</p>
      <p><strong>Envoyé le:</strong> ${new Date().toLocaleString('fr-FR')}</p>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p>Si vous recevez cet email, la configuration est correcte !</p>
      </div>
      <p>Cordialement,<br>L'équipe SwipeTonPro</p>
    </div>
  `;
  
  try {
    const result = await sendEmailServerSide({
      to: 'sotbirida@yahoo.fr', // Email du client pour test
      subject: '🧪 Test de configuration email - SwipeTonPro',
      html: testHtml,
      fromType: 'noreply'
    });
    
    if (result.success) {
      console.log('✅ Email de test envoyé avec succès !');
      console.log(`Message ID: ${result.messageId}`);
      console.log('\n📝 Vérifiez votre boîte de réception: sotbirida@yahoo.fr');
    } else {
      console.error('❌ Échec de l\'envoi de l\'email de test:');
      console.error('Erreur:', result.error);
    }
  } catch (error) {
    console.error('❌ Erreur lors du test d\'email:', error);
  }
}

// Exécuter le test
testEmailConfig();
