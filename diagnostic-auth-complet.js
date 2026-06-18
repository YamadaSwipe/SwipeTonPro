/**
 * Script de diagnostic complet pour l'authentification
 * Vérifie l'état des utilisateurs dans Supabase
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qhuvnpmqlucpjdslnfui.supabase.co';
const supabaseServiceKey = '[REDACTED_SUPABASE_SERVICE_ROLE_KEY]';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function diagnosticAuth() {
  console.log('🔍 DIAGNOSTIC AUTHENTIFICATION COMPLET\n');
  console.log('=' .repeat(80));

  const emails = [
    'admin@swipetonpro.fr',
    'sotbirida@gmail.com',
    'sotbirida@yahoo.fr'
  ];

  for (const email of emails) {
    console.log(`\n📧 Vérification de: ${email}`);
    console.log('-'.repeat(80));

    try {
      // 1. Vérifier dans auth.users
      const { data: authUser, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('❌ Erreur lors de la récupération des utilisateurs:', authError.message);
        continue;
      }

      const user = authUser.users.find(u => u.email === email);

      if (!user) {
        console.log('❌ Utilisateur NON TROUVÉ dans auth.users');
        continue;
      }

      console.log('✅ Utilisateur trouvé dans auth.users');
      console.log('   ID:', user.id);
      console.log('   Email:', user.email);
      console.log('   Email confirmé:', user.email_confirmed_at ? '✅ OUI' : '❌ NON');
      console.log('   Créé le:', user.created_at);
      console.log('   Dernière connexion:', user.last_sign_in_at || 'Jamais');
      console.log('   Banni:', user.banned_until ? '❌ OUI' : '✅ NON');

      // 2. Vérifier le profil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.log('❌ Erreur profil:', profileError.message);
      } else if (!profile) {
        console.log('❌ PAS DE PROFIL dans la table profiles');
      } else {
        console.log('✅ Profil trouvé');
        console.log('   Nom:', profile.full_name || 'Non défini');
        console.log('   Rôle:', profile.role || 'Non défini');
        console.log('   Email profil:', profile.email);
      }

      // 3. Vérifier les identités
      const { data: identities, error: identitiesError } = await supabase
        .from('auth.identities')
        .select('*')
        .eq('user_id', user.id);

      if (identitiesError) {
        console.log('⚠️  Impossible de vérifier les identités (normal si pas d\'accès direct)');
      } else if (!identities || identities.length === 0) {
        console.log('⚠️  Aucune identité trouvée');
      } else {
        console.log('✅ Identités trouvées:', identities.length);
      }

      // 4. Test de connexion
      console.log('\n🔐 Test de connexion...');
      
      // Créer un client sans service role pour tester l'auth normale
      const testClient = createClient(
        supabaseUrl,
        '[REDACTED_SUPABASE_ANON_KEY]'
      );

      // Tester avec le mot de passe connu
      const password = email === 'admin@swipetonpro.fr' ? '[REDACTED_ADMIN_PASSWORD]' : 'TestPassword123!';
      
      const { data: signInData, error: signInError } = await testClient.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        console.log('❌ Échec de connexion:', signInError.message);
        
        if (signInError.message.includes('Invalid login credentials')) {
          console.log('   ⚠️  Le mot de passe est incorrect OU l\'email n\'est pas confirmé');
          console.log('   💡 Solution: Réinitialiser le mot de passe ou confirmer l\'email');
        } else if (signInError.message.includes('Email not confirmed')) {
          console.log('   ⚠️  L\'email n\'est pas confirmé');
          console.log('   💡 Solution: Exécuter la requête SQL pour confirmer l\'email');
        }
      } else {
        console.log('✅ Connexion réussie!');
        console.log('   Session créée pour:', signInData.user.email);
        
        // Se déconnecter immédiatement
        await testClient.auth.signOut();
      }

      // 5. Diagnostic final
      console.log('\n📊 DIAGNOSTIC FINAL:');
      const issues = [];
      
      if (!user.email_confirmed_at) {
        issues.push('Email non confirmé');
      }
      if (!profile) {
        issues.push('Profil manquant');
      }
      if (user.banned_until) {
        issues.push('Compte banni');
      }

      if (issues.length === 0) {
        console.log('✅ Aucun problème détecté - Le compte devrait fonctionner');
        console.log('   Si la connexion échoue, le problème est probablement le mot de passe');
      } else {
        console.log('❌ Problèmes détectés:');
        issues.forEach(issue => console.log(`   - ${issue}`));
      }

    } catch (error) {
      console.error('❌ Erreur lors du diagnostic:', error.message);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n💡 RECOMMANDATIONS:');
  console.log('1. Si "Email non confirmé" → Exécuter fix-connexions-definitif.sql');
  console.log('2. Si "Profil manquant" → Exécuter fix-connexions-definitif.sql');
  console.log('3. Si "Invalid login credentials" → Réinitialiser le mot de passe via Supabase Dashboard');
  console.log('4. Vérifier que la configuration Supabase autorise les connexions par email/password');
  console.log('\n📝 Pour réinitialiser un mot de passe:');
  console.log('   - Aller sur https://supabase.com/dashboard');
  console.log('   - Authentication → Users');
  console.log('   - Cliquer sur l\'utilisateur → Reset Password');
}

diagnosticAuth().catch(console.error);
