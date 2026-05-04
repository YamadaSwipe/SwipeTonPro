#!/usr/bin/env node

const { spawn } = require('child_process');
const os = require('os');

// Obtenir l'adresse IP locale
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIP();
const port = process.env.PORT || 3000;

console.log(`🚀 Démarrage du serveur sur le réseau...`);
console.log(`📍 Adresse IP locale: ${localIP}`);
console.log(`🌐 URL réseau: http://${localIP}:${port}`);
console.log(`💻 URL locale: http://localhost:${port}`);
console.log(``);
console.log(`📱 Pour tester depuis votre téléphone:`);
console.log(`   1. Assurez-vous que votre téléphone est sur le même WiFi`);
console.log(`   2. Ouvrez: http://${localIP}:${port}`);
console.log(``);
console.log(`🔧 Pour tester depuis un autre appareil:`);
console.log(`   1. Assurez-vous que l'appareil est sur le même réseau`);
console.log(`   2. Ouvrez: http://${localIP}:${port}`);
console.log(``);
console.log(`⚠️  Note: Le pare-feu Windows doit autoriser les connexions sur le port ${port}`);
console.log(``);

// Démarrer Next.js avec l'option --hostname 0.0.0.0
const nextProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    HOST: '0.0.0.0',
    PORT: port
  }
});

nextProcess.on('error', (error) => {
  console.error('❌ Erreur de démarrage:', error);
  process.exit(1);
});

nextProcess.on('close', (code) => {
  console.log(`📦 Processus terminé avec le code: ${code}`);
  process.exit(code);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur...');
  nextProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Arrêt du serveur...');
  nextProcess.kill('SIGTERM');
});
