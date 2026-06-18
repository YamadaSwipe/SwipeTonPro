const fs = require('fs');
const path = require('path');

// Liste de tous les secrets à remplacer
const secrets = {
  '[REDACTED_SMTP_PASSWORD]': '[REDACTED_SMTP_PASSWORD]',
  '[REDACTED_SUPABASE_SERVICE_ROLE_KEY]': '[REDACTED_SUPABASE_SERVICE_ROLE_KEY]',
  '[REDACTED_OPENAI_API_KEY]': '[REDACTED_OPENAI_API_KEY]',
  '[REDACTED_STRIPE_SECRET_KEY]': '[REDACTED_STRIPE_SECRET_KEY]',
  '[REDACTED_GITHUB_TOKEN]': '[REDACTED_GITHUB_TOKEN]',
  '[REDACTED_GITHUB_TOKEN]': '[REDACTED_GITHUB_TOKEN]',
  '[REDACTED_ADMIN_PASSWORD]': '[REDACTED_ADMIN_PASSWORD]',
  '[REDACTED_INSEE_API_KEY]': '[REDACTED_INSEE_API_KEY]',
  '[REDACTED_STRIPE_PUBLISHABLE_KEY]': '[REDACTED_STRIPE_PUBLISHABLE_KEY]',
  '[REDACTED_SUPABASE_ANON_KEY]': '[REDACTED_SUPABASE_ANON_KEY]'
};

let totalFilesScanned = 0;
let totalFilesModified = 0;
let totalSecretsFound = 0;

function cleanFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let secretsInFile = 0;
    
    for (const [secret, replacement] of Object.entries(secrets)) {
      const regex = new RegExp(secret.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = content.match(regex);
      
      if (matches) {
        content = content.replace(regex, replacement);
        modified = true;
        secretsInFile += matches.length;
        totalSecretsFound += matches.length;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      totalFilesModified++;
      console.log(`✅ Nettoyé: ${filePath} (${secretsInFile} secret(s) trouvé(s))`);
    }
  } catch (error) {
    console.error(`❌ Erreur lors du nettoyage de ${filePath}:`, error.message);
  }
}

function scanDirectory(dir) {
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      
      try {
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          // Ignorer certains dossiers
          if (!file.startsWith('.') && 
              file !== 'node_modules' && 
              file !== 'dist' && 
              file !== 'build' &&
              file !== '.next') {
            scanDirectory(filePath);
          }
        } else if (
          file.endsWith('.md') || 
          file.endsWith('.js') || 
          file.endsWith('.ts') || 
          file.endsWith('.tsx') ||
          file.endsWith('.jsx') ||
          file.endsWith('.sql')
        ) {
          totalFilesScanned++;
          cleanFile(filePath);
        }
      } catch (error) {
        console.error(`❌ Erreur lors de l'accès à ${filePath}:`, error.message);
      }
    }
  } catch (error) {
    console.error(`❌ Erreur lors du scan de ${dir}:`, error.message);
  }
}

console.log('🧹 Démarrage du nettoyage des secrets...\n');
console.log('📁 Répertoire de travail:', process.cwd());
console.log('🔍 Types de fichiers scannés: .md, .js, .ts, .tsx, .jsx, .sql\n');

const startTime = Date.now();
scanDirectory('.');
const endTime = Date.now();

console.log('\n' + '='.repeat(60));
console.log('📊 RÉSUMÉ DU NETTOYAGE');
console.log('='.repeat(60));
console.log(`📄 Fichiers scannés: ${totalFilesScanned}`);
console.log(`✏️  Fichiers modifiés: ${totalFilesModified}`);
console.log(`🔐 Secrets trouvés et remplacés: ${totalSecretsFound}`);
console.log(`⏱️  Temps d'exécution: ${((endTime - startTime) / 1000).toFixed(2)}s`);
console.log('='.repeat(60));

if (totalFilesModified > 0) {
  console.log('\n⚠️  IMPORTANT:');
  console.log('1. Vérifiez les fichiers modifiés avant de commiter');
  console.log('2. Assurez-vous que les remplacements sont corrects');
  console.log('3. Committez les changements:');
  console.log('   git add .');
  console.log('   git commit -m "security: Remove exposed secrets from documentation"');
  console.log('   git push');
} else {
  console.log('\n✅ Aucun secret trouvé dans les fichiers scannés.');
}

console.log('\n✅ Nettoyage terminé!');
