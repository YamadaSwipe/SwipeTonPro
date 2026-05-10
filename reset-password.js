const https = require('https');

// Réinitialiser le mot de passe pour bgreen.rs@gmail.com
const resetData = {
  action: 'reset-password',
  email: 'bgreen.rs@gmail.com',
  newPassword: 'SwipeTonPro2026!'
};

const postData = JSON.stringify(resetData);

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
      console.log('\n=== RESET RESULTS ===');
      console.log(JSON.stringify(result, null, 2));
      
      if (result.results?.success) {
        console.log('\n✅ MOT DE PASSE RÉINITIALISÉ AVEC SUCCÈS!');
        console.log('📧 Nouveau mot de passe: SwipeTonPro2026!');
        console.log('📧 Vous pouvez maintenant vous connecter avec ce mot de passe.');
      } else {
        console.log('\n❌ ÉCHEC DE LA RÉINITIALISATION');
        console.log('Vérifiez les erreurs ci-dessus.');
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

console.log(`\n=== PASSWORD RESET FOR ${resetData.email} ===`);
console.log('New password:', resetData.newPassword);
console.log('Sending reset request...\n');
