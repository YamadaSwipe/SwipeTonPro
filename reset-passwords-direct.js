/**
 * Script pour réinitialiser les mots de passe DIRECTEMENT via l'API Admin
 * Contourne le problème d'envoi d'email de Supabase
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qhuvnpmqlucpjdslnfui.supabase.co';
const supabaseServiceKey = '[REDACTED_SUPABASE_SERVICE_ROLE_KEY]';
const supabaseAnonKey = '[REDACTED_SUPABASE_ANON_KEY]';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetPasswordDirect() {
  console.log('🔐 RÉINITIALISATION DIRECTE DES MOTS DE PASSE\n');
  console.log('=' .repeat(80));
  console.log('⚠️  IMPORTANT: Cette méthode contourne l\'envoi d\'email');
  console.log('    Les mots de passe seront définis DIRECTEMENT dans la base de données\n');

  const accounts = [
    {
      email: 'admin@swipetonpro.fr',
      password: 'Admin2024!Secure',
      description: 'Compte administrateur'
    },
    {
      email: 'sotbirida@gmail.com',
      password: 'Sotbi2024!Pro',
      description: 'Compte professionnel'
    },
    {
      email: 'sotbirida@yahoo.fr',
      password: 'Sotbi2024!Client',
      description: 'Compte particulier'
    }
  ];

  for (const account of accounts) {
    console.log(`\n📧 Traitement de: ${account.email}`);
    console.log(`   Description: ${account.description}`);
    console.log(`   Nouveau mot de passe: ${account.password}`);
    console.log('-'.repeat(80));

    try {
      // 1. Récupérer l'utilisateur
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) {
        console.error('❌ Erreur lors de la récupération des utilisateurs:', listError.message);
        continue;
      }

      const user = users.users.find(u => u.email === account.email);

      if (!user) {
        console.log('❌ Utilisateur non trouvé');
        continue;
      }

      console.log('✅ Utilisateur trouvé, ID:', user.id);

      // 2. Mettre à jour le mot de passe DIRECTEMENT
      console.log('🔄 Mise à jour du mot de passe...');
      
      const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        {
          password: account.password,
          email_confirm: true // S'assurer que l'email est confirmé
        }
      );

      if (updateError) {
        console.error('❌ Erreur lors de la mise à jour du mot de passe:', updateError.message);
        continue;
      }

      console.log('✅ Mot de passe mis à jour avec succès!');

      // 3. Attendre un peu pour que la mise à jour soit propagée
      console.log('⏳ Attente de la propagation (2 secondes)...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 4. Tester IMMÉDIATEMENT la connexion
      console.log('\n🔐 Test de connexion avec le nouveau mot de passe...');
      
      const testClient = createClient(supabaseUrl, supabaseAnonKey);

      const { data: signInData, error: signInError } = await testClient.auth.signInWithPassword({
        email: account.email,
        password: account.password
      });

      if (signInError) {
        console.log('❌ ÉCHEC du test de connexion:', signInError.message);
        console.log('   ⚠️  Le mot de passe a été mis à jour mais la connexion échoue');
        console.log('   💡 Cela peut indiquer un problème de configuration Supabase Auth');
      } else {
        console.log('✅ ✅ ✅ TEST DE CONNEXION RÉUSSI! ✅ ✅ ✅');
        console.log('   User ID:', signInData.user.id);
        console.log('   Email:', signInData.user.email);
        console.log('   Email confirmé:', signInData.user.email_confirmed_at ? 'Oui' : 'Non');
        
        // Se déconnecter immédiatement
        await testClient.auth.signOut();
        console.log('   🚪 Déconnexion effectuée');
      }

    } catch (error) {
      console.error('❌ Erreur lors du traitement:', error.message);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ RÉINITIALISATION TERMINÉE\n');
  console.log('📝 RÉCAPITULATIF DES MOTS DE PASSE:');
  console.log('-'.repeat(80));
  accounts.forEach(account => {
    console.log(`\n${account.email}`);
    console.log(`   Mot de passe: ${account.password}`);
    console.log(`   Description: ${account.description}`);
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('\n💡 PROCHAINES ÉTAPES:');
  console.log('1. Si tous les tests ont réussi, vous pouvez vous connecter avec ces mots de passe');
  console.log('2. Si les tests ont échoué, il y a un problème de configuration Supabase Auth');
  console.log('3. Vérifiez la configuration dans Supabase Dashboard → Authentication → Settings');
  console.log('\n⚠️  PROBLÈME IDENTIFIÉ:');
  console.log('Supabase ne peut pas envoyer d\'emails de réinitialisation.');
  console.log('Cela signifie que la configuration SMTP est incorrecte ou manquante.');
  console.log('\n🔧 SOLUTION:');
  console.log('1. Dashboard Supabase → Authentication → Email Templates');
  console.log('2. Vérifier que les templates d\'email sont configurés');
  console.log('3. Dashboard → Settings → Auth → SMTP Settings');
  console.log('4. Configurer SMTP avec Resend ou un autre fournisseur');
}

resetPasswordDirect().catch(console.error);
