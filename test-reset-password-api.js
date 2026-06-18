/**
 * Script de test pour l'API de réinitialisation de mot de passe
 */

const axios = require('axios');

async function testResetPasswordAPI() {
  console.log('🧪 TEST DE L\'API RESET PASSWORD\n');

  const testEmail = 'admin@swipetonpro.fr'; // Utiliser un email existant
  const apiUrl = 'http://localhost:3000/api/auth/reset-password';

  console.log('📧 Email de test:', testEmail);
  console.log('🔗 URL de l\'API:', apiUrl);
  console.log('');

  try {
    console.log('📤 Envoi de la requête POST...');
    const response = await axios.post(
      apiUrl,
      { email: testEmail },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        validateStatus: () => true, // Accepter toutes les réponses
      }
    );

    console.log('📥 Réponse reçue:');
    console.log('   Status:', response.status);
    console.log('   Data:', JSON.stringify(response.data, null, 2));
    console.log('');

    if (response.status === 200) {
      console.log('✅ Succès! L\'email devrait être envoyé.');
      console.log('📬 Vérifiez votre boîte mail:', testEmail);
    } else if (response.status === 500) {
      console.error('❌ Erreur 500 - Erreur serveur');
      console.error('   Message:', response.data.error);
      if (response.data.details) {
        console.error('   Détails:', JSON.stringify(response.data.details, null, 2));
      }
    } else {
      console.warn('⚠️ Réponse inattendue:', response.status);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la requête:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    } else if (error.request) {
      console.error('   Aucune réponse reçue du serveur');
      console.error('   Assurez-vous que le serveur Next.js est démarré (npm run dev)');
    }
  }
}

console.log('⚠️  IMPORTANT: Assurez-vous que le serveur Next.js est démarré (npm run dev)\n');

testResetPasswordAPI().catch(console.error);
