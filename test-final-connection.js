const https = require('https');

// Test final de connexion avec le nouveau mot de passe
const testData = {
  action: 'diagnose',
  email: 'bgreen.rs@gmail.com',
  newPassword: 'SwipeTonPro2026!'
};

const postData = JSON.stringify(testData);

const options = {
  hostname: 'www.swipetonpro.fr',
  port: 443,
  path: '/api/fix-auth-issues',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
    try {
      const result = JSON.parse(data);
      console.log('\n=== FINAL CONNECTION TEST ===');
      console.log(JSON.stringify(result, null, 2));
      
      if (result.results?.signInTest?.success) {
        console.log('\n🎉 CONNEXION RÉUSSIE!');
        console.log('✅ Le compte bgreen.rs@gmail.com fonctionne parfaitement');
        console.log('📧 Mot de passe: SwipeTonPro2026!');
        console.log('🌐 Site prêt pour la connexion utilisateur');
      } else {
        console.log('\n❌ PROBLÈME DE CONNEXION PERSISTE');
        console.log('Erreur:', result.results?.signInTest?.error);
      }
    } catch (e) {
      console.log('Error parsing JSON:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.write(postData);
req.end();

console.log(`\n=== FINAL CONNECTION TEST FOR ${testData.email} ===`);
console.log('Testing with new password:', testData.newPassword);
console.log('Sending test request...\n');
