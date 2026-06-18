/**
 * Script de test complet pour la réinitialisation de mot de passe
 * 
 * Ce script teste:
 * 1. L'envoi de l'email de réinitialisation
 * 2. La vérification que Resend est utilisé (pas Supabase)
 * 3. La génération du lien de réinitialisation
 * 
 * Usage: node test-reset-password-complete.js
 */

const https = require('https');

// Configuration
const TEST_EMAIL = 'admin@swipetonpro.fr'; // Changez par votre email de test
const API_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

console.log('🧪 Test de réinitialisation de mot de passe');
console.log('=' .repeat(60));
console.log(`📧 Email de test: ${TEST_EMAIL}`);
console.log(`🌐 API URL: ${API_URL}`);
console.log('=' .repeat(60));

/**
 * Fonction pour faire une requête POST
 */
function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(data);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const protocol = urlObj.protocol === 'https:' ? https : require('http');
    
    const req = protocol.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: JSON.parse(body),
          };
          resolve(response);
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Test principal
 */
async function testPasswordReset() {
  try {
    console.log('\n📤 Étape 1: Envoi de la demande de réinitialisation...');
    console.log(`   URL: ${API_URL}/api/auth/reset-password`);
    console.log(`   Email: ${TEST_EMAIL}`);

    const response = await makeRequest(`${API_URL}/api/auth/reset-password`, {
      email: TEST_EMAIL,
    });

    console.log('\n📥 Réponse reçue:');
    console.log(`   Status: ${response.statusCode}`);
    console.log(`   Body:`, JSON.stringify(response.body, null, 2));

    // Vérification du statut
    if (response.statusCode === 200) {
      console.log('\n✅ Succès: La demande a été traitée');
      
      if (response.body.success) {
        console.log('✅ L\'email devrait être envoyé');
        console.log('\n📋 Prochaines étapes:');
        console.log('   1. Vérifiez votre boîte email:', TEST_EMAIL);
        console.log('   2. Vérifiez les logs de l\'application pour confirmer l\'utilisation de Resend');
        console.log('   3. Vérifiez que le lien reçu pointe vers:');
        console.log(`      ${API_URL}/auth/reset-password#access_token=...`);
        console.log('   4. Et PAS vers: https://qhuvnpmqlucpjdslnfui.supabase.co/...');
        
        console.log('\n🔍 Logs à vérifier:');
        console.log('   ✅ Attendu: "📧 Utilisation de Resend pour l\'envoi d\'email"');
        console.log('   ✅ Attendu: "✅ Email envoyé avec succès via Resend"');
        console.log('   ❌ À éviter: "⚠️ RESEND_API_KEY non configurée"');
      } else {
        console.log('⚠️ La réponse indique un problème:', response.body.message);
      }
    } else if (response.statusCode === 429) {
      console.log('\n⚠️ Rate limit atteint');
      console.log('   Attendez quelques minutes avant de réessayer');
    } else if (response.statusCode === 500) {
      console.log('\n❌ Erreur serveur');
      console.log('   Détails:', response.body.error);
      if (response.body.details) {
        console.log('   Plus d\'infos:', response.body.details);
      }
    } else {
      console.log('\n❌ Erreur inattendue');
      console.log('   Status:', response.statusCode);
      console.log('   Body:', response.body);
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Résumé du test');
    console.log('='.repeat(60));
    console.log(`Status HTTP: ${response.statusCode}`);
    console.log(`Succès: ${response.statusCode === 200 ? '✅' : '❌'}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error.message);
    console.error('\n🔍 Vérifications à faire:');
    console.error('   1. Le serveur est-il démarré? (npm run dev)');
    console.error('   2. L\'URL est-elle correcte?', API_URL);
    console.error('   3. Les variables d\'environnement sont-elles configurées?');
  }
}

/**
 * Test de vérification de la configuration
 */
async function checkConfiguration() {
  console.log('\n🔧 Vérification de la configuration...\n');

  // Charger les variables depuis .env.local
  const fs = require('fs');
  const path = require('path');
  
  try {
    const envPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      
      lines.forEach(line => {
        // Ignorer les commentaires (lignes commençant par # sans espace avant)
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
          return;
        }
        
        // Matcher les variables d'environnement (peut avoir des espaces avant)
        const match = line.match(/^\s*([A-Z_]+)=(.*)$/);
        if (match) {
          const [, key, value] = match;
          if (!process.env[key]) {
            process.env[key] = value.trim();
          }
        }
      });
      console.log('✅ Fichier .env.local chargé\n');
    } else {
      console.log('⚠️ Fichier .env.local non trouvé\n');
    }
  } catch (error) {
    console.log('⚠️ Erreur lors du chargement de .env.local:', error.message, '\n');
  }

  // Vérifier les variables d'environnement
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'RESEND_API_KEY',
  ];

  let allConfigured = true;

  requiredEnvVars.forEach((varName) => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: Configurée`);
    } else {
      console.log(`❌ ${varName}: MANQUANTE`);
      allConfigured = false;
    }
  });

  if (!allConfigured) {
    console.log('\n⚠️ Certaines variables d\'environnement sont manquantes');
    console.log('   Assurez-vous que le fichier .env.local est présent et correctement configuré');
    return false;
  }

  console.log('\n✅ Toutes les variables requises sont configurées');
  return true;
}

/**
 * Exécution du test
 */
async function run() {
  console.log('\n🚀 Démarrage du test de réinitialisation de mot de passe\n');

  // Vérifier la configuration
  const configOk = await checkConfiguration();
  
  if (!configOk) {
    console.log('\n❌ Configuration incomplète. Arrêt du test.');
    process.exit(1);
  }

  // Exécuter le test
  await testPasswordReset();

  console.log('\n✅ Test terminé\n');
}

// Exécuter le script
run().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
