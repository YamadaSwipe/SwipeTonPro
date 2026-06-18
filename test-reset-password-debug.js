/**
 * Script de test pour diagnostiquer le problème de reset password
 */

const nodemailer = require('nodemailer');

async function testResetPassword() {
  console.log('🔍 DIAGNOSTIC RESET PASSWORD\n');
  
  // 1. Vérifier les variables d'environnement
  console.log('1️⃣ Variables d\'environnement:');
  console.log('   SMTP_HOST:', process.env.SMTP_HOST || '❌ MANQUANT');
  console.log('   SMTP_PORT:', process.env.SMTP_PORT || '❌ MANQUANT');
  console.log('   SMTP_USER:', process.env.SMTP_USER || '❌ MANQUANT');
  console.log('   SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '✅ Défini' : '❌ MANQUANT');
  console.log('   SMTP_USER_NOREPLY:', process.env.SMTP_USER_NOREPLY || '❌ MANQUANT');
  console.log('');

  // 2. Tester la connexion SMTP
  console.log('2️⃣ Test de connexion SMTP OVH...');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'ssl0.ovh.net',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true,
    auth: {
      user: process.env.SMTP_USER_NOREPLY || 'noreply@swipetonpro.fr',
      pass: process.env.SMTP_PASSWORD || '',
    },
    debug: true,
    logger: true,
  });

  try {
    await transporter.verify();
    console.log('✅ Connexion SMTP réussie!\n');
  } catch (error) {
    console.error('❌ Erreur de connexion SMTP:', error.message);
    console.error('   Code:', error.code);
    console.error('   Command:', error.command);
    console.error('');
    return;
  }

  // 3. Tester l'envoi d'un email de test
  console.log('3️⃣ Test d\'envoi d\'email...');
  try {
    const info = await transporter.sendMail({
      from: `"SwipeTonPro Test" <${process.env.SMTP_USER_NOREPLY || 'noreply@swipetonpro.fr'}>`,
      to: 'test@example.com', // Remplacer par un vrai email pour tester
      subject: 'Test Reset Password - SwipeTonPro',
      html: '<h1>Test Email</h1><p>Ceci est un email de test.</p>',
    });
    
    console.log('✅ Email envoyé avec succès!');
    console.log('   Message ID:', info.messageId);
    console.log('   Response:', info.response);
  } catch (error) {
    console.error('❌ Erreur d\'envoi d\'email:', error.message);
    console.error('   Code:', error.code);
    console.error('   Response:', error.response);
  }
}

// Charger les variables d'environnement
require('dotenv').config({ path: '.env.local' });

testResetPassword().catch(console.error);
