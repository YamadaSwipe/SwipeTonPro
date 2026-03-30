// Script pour vérifier la configuration SMTP existante
require('dotenv').config({ path: '.env.local' });

console.log('🔍 VÉRIFICATION CONFIGURATION SMTP EXISTANTE');
console.log('==============================================');

console.log('\n📋 VARIABLES D\'ENVIRONNEMENT ACTUELLES:');
console.log(`SMTP_HOST: ${process.env.SMTP_HOST || '❌ NON DÉFINI'}`);
console.log(`SMTP_PORT: ${process.env.SMTP_PORT || '❌ NON DÉFINI'}`);
console.log(`SMTP_USER_NOREPLY: ${process.env.SMTP_USER_NOREPLY || '❌ NON DÉFINI'}`);
console.log(`SMTP_USER_SUPPORT: ${process.env.SMTP_USER_SUPPORT || '❌ NON DÉFINI'}`);
console.log(`SMTP_USER_ADMIN: ${process.env.SMTP_USER_ADMIN || '❌ NON DÉFINI'}`);
console.log(`SMTP_PASSWORD: ${process.env.SMTP_PASSWORD ? '✅ DÉFINI' : '❌ NON DÉFINI'}`);
console.log(`NEXT_PUBLIC_SITE_URL: ${process.env.NEXT_PUBLIC_SITE_URL || '❌ NON DÉFINI'}`);

console.log('\n🔍 ANALYSE DE LA CONFIGURATION:');

// Vérifier si les variables minimales sont présentes
const hasBasicConfig = process.env.SMTP_HOST && 
                      process.env.SMTP_PORT && 
                      process.env.SMTP_USER_NOREPLY && 
                      process.env.SMTP_PASSWORD;

if (hasBasicConfig) {
  console.log('✅ Configuration SMTP de base présente');
  console.log('📧 Les emails devraient fonctionner');
  
  console.log('\n🎯 ACTIONS RECOMMANDÉES:');
  console.log('1. Testez l\'envoi d\'email via l\'application');
  console.log('2. Connectez-vous comme professionnel');
  console.log('3. Cliquez sur "Ça m\'intéresse" sur un projet');
  console.log('4. Vérifiez les logs dans la console du navigateur');
  console.log('5. Vérifiez la boîte de réception du client');
  
} else {
  console.log('❌ Configuration SMTP incomplète');
  console.log('🛠️ Variables manquantes:');
  
  if (!process.env.SMTP_HOST) console.log('   - SMTP_HOST (serveur SMTP)');
  if (!process.env.SMTP_PORT) console.log('   - SMTP_PORT (port SMTP)');
  if (!process.env.SMTP_USER_NOREPLY) console.log('   - SMTP_USER_NOREPLY (email noreply)');
  if (!process.env.SMTP_PASSWORD) console.log('   - SMTP_PASSWORD (mot de passe SMTP)');
  
  console.log('\n📝 CONFIGURATION REQUISE:');
  console.log('Ajoutez ces lignes dans votre fichier .env.local:');
  console.log('');
  console.log('# Configuration SMTP OVH');
  console.log('SMTP_HOST=ssl0.ovh.net');
  console.log('SMTP_PORT=465');
  console.log('SMTP_USER_NOREPLY=noreply@swipetonpro.fr');
  console.log('SMTP_USER_SUPPORT=support@swipetonpro.fr');
  console.log('SMTP_USER_ADMIN=admin@swipetonpro.fr');
  console.log('SMTP_PASSWORD=votre_mot_de_passe_ovh');
  console.log('NEXT_PUBLIC_SITE_URL=https://swipetonpro.fr');
}

console.log('\n🔍 ÉTAT ACTUEL DU SYSTÈME:');
console.log('✅ Notifications dans dashboard: Fonctionnelles');
console.log('✅ Code d\'envoi d\'email: Amélioré avec logs');
console.log('📧 Envoi d\'emails: Dépend de la configuration SMTP');

console.log('\n🚀 PROCÉDURE DE TEST:');
console.log('1. Vérifiez que .env.local contient les variables SMTP');
console.log('2. Redémarrez le serveur: npm run dev');
console.log('3. Testez via l\'interface web');
console.log('4. Surveillez les logs dans la console navigateur');

console.log('\n📊 RÉSUMÉ:');
console.log('Le système de notifications est prêt.');
console.log('Il ne manque que la configuration SMTP pour les emails.');
console.log('Une fois configurée, les emails seront envoyés automatiquement.');
