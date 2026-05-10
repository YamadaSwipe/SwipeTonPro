const https = require('https');

// Test de diagnostic pour bgreen.rs@gmail.com
const diagnosticData = {
  action: 'diagnose',
  email: 'bgreen.rs@gmail.com',
  newPassword: 'Test1234!'
};

const postData = JSON.stringify(diagnosticData);

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
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
    try {
      const result = JSON.parse(data);
      console.log('\n=== DIAGNOSTIC RESULTS ===');
      console.log(JSON.stringify(result, null, 2));
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

console.log(`\n=== DIAGNOSTIC REQUEST FOR ${diagnosticData.email} ===`);
console.log('Sending:', postData);
console.log('Waiting for response...\n');
