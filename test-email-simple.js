// Test simple de configuration email
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('🔧 Test configuration email');
  console.log('SMTP_HOST:', process.env.SMTP_HOST);
  console.log('SMTP_PORT:', process.env.SMTP_PORT);
  console.log('SMTP_USER_SUPPORT:', process.env.SMTP_USER_SUPPORT);
  console.log('SMTP_PASSWORD exists:', !!process.env.SMTP_PASSWORD);

  try {
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'ssl0.ovh.net',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true,
      auth: {
        user: process.env.SMTP_USER_SUPPORT || 'support@swipetonpro.fr',
        pass: process.env.SMTP_PASSWORD || '',
      },
    });

    const info = await transporter.sendMail({
      from: `"SwipeTonPro" <${process.env.SMTP_USER_SUPPORT || 'support@swipetonpro.fr'}>`,
      to: "support@swipetonpro.fr",
      subject: "🧪 Test Email Configuration Simple",
      html: `
        <h2>Test de configuration SMTP</h2>
        <p>Email de test envoyé depuis SwipeTonPro</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
        <p>Si vous recevez cet email, la configuration est correcte.</p>
      `,
    });

    console.log('✅ Test email sent successfully:', info.messageId);
    console.log('📧 Response:', info.response);
  } catch (error) {
    console.error('❌ Test email failed:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
  }
}

testEmail();
