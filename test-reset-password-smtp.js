/**
 * Script de test pour la réinitialisation de mot de passe avec SMTP OVH
 * 
 * Ce script teste:
 * 1. La configuration SMTP OVH
 * 2. L'envoi de l'email de réinitialisation
 * 3. La génération du lien de réinitialisation
 * 
 * Usage: node test-reset-password-smtp.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const TEST_EMAIL = 'admin@swipetonpro.fr';
const API_URL = 'http://localhost:3000';

console.log('🧪 Test de réinitialisation de mot de passe avec SMTP OVH');
console.log('=' .repeat(70));
console.log(`📧 Email de test: ${TEST_EMAIL}`);
console.log(`🌐 API URL: ${API_URL}`);
console.log('=' .repeat(70));

/**
 * Charger les variables d'environnement depuis .env.local
 */
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      
      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
          return;
        }
        
        const match = line.match(/^([A-Z_]+)=(.*)$/);
        if (match) {
          const [, key, value] = match;
          if (!process.env[key]) {
            process.env[key] = value.trim();
          }
        }
      });
      console.log('✅ Fichier .env.local chargé\n');
      return true;
    } else {
      console.log('⚠️ Fichier .env.local non trouvé\n');
      return false;
    }
  } catch (error) {
    console.log('⚠️ Erreur lors du chargement de .env.local:', error.message, '\n');
    return false;
  }
}

/**
 * Vérifier la configuration
 */
function checkConfiguration() {
  console.log('🔧 Vérification de la configuration...\n');

  const requiredEnvVars = {
    'NEXT_PUBLIC_SUPABASE_URL': 'Configuration Supabase',
    'SUPABASE_SERVICE_ROLE_KEY': 'Clé service Supabase',
    'SMTP_HOST': 'Serveur SMTP',
    'SMTP_PORT': 'Port SMTP',
    'SMTP_PASSWORD': 'Mot de passe SMTP',
    'SMTP_USER': 'Utilisateur SMTP',
  };

  let allConfigured = true;
  const config = {};

  Object.entries(requiredEnvVars).forEach(([varName, description]) => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: Configurée`);
      config[varName] = value;
    } else {
      console.log(`❌ ${varName}: MANQUANTE (${description})`);
      allConfigured = false;
    }
  });

  if (allConfigured) {
    console.log('\n📋 Configuration SMTP détectée:');
    console.log(`   Serveur: ${config.SMTP_HOST}:${config.SMTP_PORT}`);
    console.log(`   Utilisateur: ${config.SMTP_USER}`);
    console.log(`   Mot de passe: ${config.SMTP_PASSWORD ? '***' + config.SMTP_PASSWORD.slice(-4) : 'NON DÉFINI'}`);
  }

  return allConfigured;
}

/**
 * Faire une requête POST
 */
function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(data);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
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
    console.log('\n📤 Envoi de la demande de réinitialisation...');
    console.log(`   URL: ${API_URL}/api/auth/reset-password`);
    console.log(`   Email: ${TEST_EMAIL}\n`);

    const response = await makeRequest(`${API_URL}/api/auth/reset-password`, {
      email: TEST_EMAIL,
    });

    console.log('📥 Réponse reçue:');
    console.log(`   Status HTTP: ${response.statusCode}`);
    console.log(`   Body:`, JSON.stringify(response.body, null, 2));

    if (response.statusCode === 200) {
      console.log('\n✅ SUCCÈS: La demande a été traitée');
      
      if (response.body.success) {
        console.log('\n📧 Email envoyé avec succès!');
        console.log('\n📋 Prochaines étapes:');
        console.log('   1. Vérifiez votre boîte email:', TEST_EMAIL);
        console.log('   2. Vérifiez les logs du serveur pour confirmer:');
        console.log('      - "📧 Envoi email de réinitialisation via SMTP OVH"');
        console.log('      - "✅ Email de réinitialisation envoyé avec succès via SMTP OVH"');
        console.log('   3. Vérifiez que le lien reçu pointe vers:');
        console.log(`      ${API_URL}/auth/reset-password#access_token=...`);
        console.log('   4. Cliquez sur le lien et changez votre mot de passe');
        
        console.log('\n🎯 Le système de réinitialisation fonctionne correctement!');
      } else {
        console.log('\n⚠️ La réponse indique un problème:', response.body.message);
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
      console.log('\n🔍 Vérifications à faire:');
      console.log('   1. Le serveur est-il démarré? (npm run dev)');
      console.log('   2. Les logs du serveur montrent-ils des erreurs?');
      console.log('   3. La configuration SMTP est-elle correcte?');
    } else {
      console.log('\n❌ Erreur inattendue');
      console.log('   Status:', response.statusCode);
      console.log('   Body:', response.body);
    }

    console.log('\n' + '='.repeat(70));
    console.log('📊 RÉSUMÉ DU TEST');
    console.log('='.repeat(70));
    console.log(`Status HTTP: ${response.statusCode}`);
    console.log(`Succès: ${response.statusCode === 200 && response.body.success ? '✅ OUI' : '❌ NON'}`);
    console.log('='.repeat(70));

    return response.statusCode === 200 && response.body.success;

  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error.message);
    console.error('\n🔍 Vérifications à faire:');
    console.error('   1. Le serveur est-il démarré? (npm run dev)');
    console.error('   2. L\'URL est-elle correcte?', API_URL);
    console.error('   3. Le port 3000 est-il accessible?');
    return false;
  }
}

/**
 * Exécution du test
 */
async function run() {
  console.log('\n🚀 Démarrage du test de réinitialisation de mot de passe\n');

  // Charger les variables d'environnement
  loadEnvFile();

  // Vérifier la configuration
  const configOk = checkConfiguration();
  
  if (!configOk) {
    console.log('\n❌ Configuration incomplète.');
    console.log('\n💡 Actions à faire:');
    console.log('   1. Vérifiez que le fichier .env.local existe');
    console.log('   2. Vérifiez que toutes les variables sont définies');
    console.log('   3. Redémarrez le serveur après modification');
    process.exit(1);
  }

  console.log('\n✅ Configuration complète et valide\n');
  console.log('⏳ Lancement du test...\n');

  // Exécuter le test
  const success = await testPasswordReset();

  if (success) {
    console.log('\n🎉 TEST RÉUSSI! Le système de réinitialisation fonctionne correctement.\n');
    process.exit(0);
  } else {
    console.log('\n❌ TEST ÉCHOUÉ. Consultez les logs ci-dessus pour plus de détails.\n');
    process.exit(1);
  }
}

// Exécuter le script
run().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
