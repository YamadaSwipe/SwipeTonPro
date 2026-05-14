const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qhuvnpmqlucpjdslnfui.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY non définie');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getUsersAndPasswords() {
  try {
    console.log('🔍 Récupération des utilisateurs...');
    
    // Récupérer tous les utilisateurs
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Erreur lors de la récupération des utilisateurs:', error);
      process.exit(1);
    }
    
    console.log(`✅ ${users.users.length} utilisateurs trouvés\n`);
    
    // Afficher les informations des utilisateurs
    users.users.forEach((user, index) => {
      console.log(`👤 Utilisateur ${index + 1}:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Créé le: ${new Date(user.created_at).toLocaleString('fr-FR')}`);
      console.log(`   Confirmé: ${user.email_confirmed_at ? 'Oui' : 'Non'}`);
      console.log(`   Dernière connexion: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('fr-FR') : 'Jamais'}`);
      console.log('');
    });
    
    // Note: Les mots de passe ne sont pas stockés en clair dans Supabase
    // Ils sont hashés, donc on ne peut pas les récupérer
    console.log('⚠️  Note: Les mots de passe ne sont pas stockés en clair pour des raisons de sécurité.');
    console.log('⚠️  Ils sont hashés dans la base de données Supabase.');
    console.log('⚠️  Pour réinitialiser un mot de passe, utilisez le flux de réinitialisation.');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

getUsersAndPasswords();
