// =====================================================
// RECHERCHE COMPTES - sotbirida@yahoo.fr & sotbirida@gmail.com
// =====================================================

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = 'https://qhuvnpmqlucpjdslnfui.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodXZucG1xbHVjcGpkc2xuZnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NDM1MjYsImV4cCI6MjA4NzUxOTUyNn0.KZIdHPyxjArRY5RLHBeAm_CzU-zOPM97fj1XKR9SRbw';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkAccounts() {
  console.log('🔍 RECHERCHE DES COMPTES');
  console.log('=====================================');
  console.log('📧 Emails recherchés:');
  console.log('   - sotbirida@yahoo.fr');
  console.log('   - sotbirida@gmail.com');
  console.log('');

  try {
    // 1. Vérifier dans la table profiles
    console.log('1️⃣ Recherche dans la table profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('email', ['sotbirida@yahoo.fr', 'sotbirida@gmail.com']);

    if (profilesError) {
      console.error('❌ Erreur profiles:', profilesError.message);
    } else {
      console.log('📊 Profiles trouvés:', profiles.length);
      profiles.forEach(profile => {
        console.log('---');
        console.log('👤 Email:', profile.email);
        console.log('📝 Nom complet:', profile.full_name || 'Non défini');
        console.log('🔐 Rôle:', profile.role || 'user');
        console.log('🆔 ID:', profile.id);
        console.log('📅 Créé le:', new Date(profile.created_at).toLocaleString('fr-FR'));
        console.log('📱 Téléphone:', profile.phone || 'Non défini');
      });
    }

    console.log('');

    // 2. Vérifier dans auth.users (si possible)
    console.log('2️⃣ Tentative de vérification auth.users...');
    try {
      const { data: authUsers, error: authError } = await supabase
        .rpc('get_user_by_email', { email: 'sotbirida@yahoo.fr' });

      if (authError) {
        console.log('ℹ️ Accès auth.users non disponible (normal)');
      } else {
        console.log('✅ Données auth:', authUsers);
      }
    } catch (e) {
      console.log('ℹ️ Accès auth.users non disponible (normal)');
    }

    console.log('');

    // 3. Vérifier les professionnels
    console.log('3️⃣ Recherche dans la table professionals...');
    const { data: professionals, error: proError } = await supabase
      .from('professionals')
      .select('*')
      .in('email', ['sotbirida@yahoo.fr', 'sotbirida@gmail.com']);

    if (proError) {
      console.error('❌ Erreur professionals:', proError.message);
    } else {
      console.log('📊 Professionals trouvés:', professionals.length);
      professionals.forEach(pro => {
        console.log('---');
        console.log('👤 Email:', pro.email);
        console.log('🏢 Entreprise:', pro.company_name || 'Non défini');
        console.log('🎯 Spécialité:', pro.specialty || 'Non défini');
        console.log('✅ Statut:', pro.status || 'Non défini');
      });
    }

    console.log('');
    console.log('📋 RÉSUMÉ');
    console.log('=====================================');
    
    if (profiles.length === 0 && professionals.length === 0) {
      console.log('❌ AUCUN COMPTE TROUVÉ');
      console.log('');
      console.log('💡 Solutions possibles:');
      console.log('   1. Les comptes n\'existent pas');
      console.log('   2. Les emails sont différents');
      console.log('   3. Les comptes sont dans une autre table');
      console.log('   4. Vérifier l\'orthographe des emails');
    } else {
      console.log(`✅ ${profiles.length + professionals.length} compte(s) trouvé(s)`);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Exécuter la recherche
checkAccounts();
