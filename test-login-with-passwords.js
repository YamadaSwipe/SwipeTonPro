/**
 * Script pour tester la connexion avec les mots de passe fournis
 * Vérifie si les mots de passe fonctionnent correctement
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qhuvnpmqlucpjdslnfui.supabase.co';
const supabaseAnonKey = '[REDACTED_SUPABASE_ANON_KEY]';

async function testLogin() {
  console.log('🔐 TEST DE CONNEXION AVEC LES MOTS DE PASSE FOURNIS\n');
  console.log('=' .repeat(80));

  const accounts = [
    {
      email: 'admin@swipetonpro.fr',
      password: '[REDACTED_ADMIN_PASSWORD]',
      description: 'Compte administrateur'
    },
    {
      email: 'sotbirida@yahoo.fr',
      password: 'Red123456',
      description: 'Compte particulier (nouveau mot de passe)'
    },
    {
      email: 'sotbirida@gmail.com',
      password: 'Red12345',
      description: 'Compte professionnel'
    }
  ];

  for (const account of accounts) {
    console.log(`\n📧 Test de connexion: ${account.email}`);
    console.log(`   Description: ${account.description}`);
    console.log(`   Mot de passe: ${account.password}`);
    console.log('-'.repeat(80));

    try {
      // Créer un nouveau client pour chaque test
      const testClient = createClient(supabaseUrl, supabaseAnonKey);

      const { data, error } = await testClient.auth.signInWithPassword({
        email: account.email,
        password: account.password
      });

      if (error) {
        console.log('❌ ÉCHEC DE CONNEXION');
        console.log('   Erreur:', error.message);
        
        if (error.message.includes('Invalid login credentials')) {
          console.log('   💡 Le mot de passe est incorrect ou l\'email n\'est pas confirmé');
          console.log('   🔧 Action requise: Réinitialiser le mot de passe via Supabase Dashboard');
        } else if (error.message.includes('Email not confirmed')) {
          console.log('   💡 L\'email n\'est pas confirmé');
          console.log('   🔧 Action requise: Confirmer l\'email via SQL ou Dashboard');
        }
      } else {
        console.log('✅ CONNEXION RÉUSSIE!');
        console.log('   User ID:', data.user.id);
        console.log('   Email:', data.user.email);
        console.log('   Email confirmé:', data.user.email_confirmed_at ? 'Oui' : 'Non');
        
        // Récupérer le profil
        const { data: profile, error: profileError } = await testClient
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profile) {
          console.log('   Profil trouvé:');
          console.log('     - Nom:', profile.full_name);
          console.log('     - Rôle:', profile.role);
        } else {
          console.log('   ⚠️  Profil non trouvé');
        }

        // Se déconnecter
        await testClient.auth.signOut();
        console.log('   🚪 Déconnexion effectuée');
      }

    } catch (error) {
      console.error('❌ ERREUR LORS DU TEST:', error.message);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n📊 RÉSUMÉ DES TESTS\n');
  console.log('Si tous les tests ont réussi, vous pouvez vous connecter à l\'application.');
  console.log('Si des tests ont échoué, vous devez réinitialiser les mots de passe via:');
  console.log('  1. Supabase Dashboard → Authentication → Users → Reset Password');
  console.log('  2. Ou utiliser la fonction "Mot de passe oublié" sur la page de connexion');
}

testLogin().catch(console.error);
