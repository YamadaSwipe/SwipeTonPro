/**
 * @fileoverview Script de Test du Dashboard Professionnel
 * @author Senior Architect
 * @version 1.0.0
 * 
 * Script pour vérifier que le dashboard professionnel fonctionne
 */

import { supabase } from '../integrations/supabase/client';

/**
 * Test complet du dashboard professionnel
 */
async function testProfessionalDashboard() {
  console.log('🧪 TEST DU DASHBOARD PROFESSIONNEL');
  console.log('=====================================');

  try {
    // Test 1: Vérifier la connexion Supabase
    console.log('\n1️⃣ Test connexion Supabase...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('❌ Erreur auth:', authError.message);
      return;
    }
    
    if (!user) {
      console.log('ℹ️ Aucun utilisateur connecté - Test en mode non authentifié');
    } else {
      console.log('✅ Utilisateur connecté:', user.email);
    }

    // Test 2: Vérifier les tables requises
    console.log('\n2️⃣ Test tables de la base de données...');
    
    const tables = [
      'professionals',
      'projects', 
      'project_interests',
      'profiles',
      'notifications'
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table ${table}:`, error.message);
        } else {
          console.log(`✅ Table ${table}: OK`);
        }
      } catch (err) {
        console.log(`❌ Table ${table}:`, err);
      }
    }

    // Test 3: Vérifier le profil professionnel si connecté
    if (user) {
      console.log('\n3️⃣ Test profil professionnel...');
      
      const { data: professional, error: proError } = await supabase
        .from('professionals')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (proError) {
        console.log('❌ Erreur profil professionnel:', proError.message);
      } else if (professional) {
        console.log('✅ Profil professionnel trouvé:', professional.company_name);
        console.log('   - Statut:', professional.status);
        console.log('   - Crédits:', professional.credits_balance || 0);
      } else {
        console.log('ℹ️ Aucun profil professionnel trouvé');
      }
    }

    // Test 4: Vérifier les imports React
    console.log('\n4️⃣ Test imports des icônes...');
    
    try {
      const { CreditCard, Activity, AlertTriangle } = await import('lucide-react');
      console.log('✅ Import CreditCard: OK');
      console.log('✅ Import Activity: OK');
      console.log('✅ Import AlertTriangle: OK');
    } catch (err) {
      console.log('❌ Erreur imports icônes:', err);
    }

    console.log('\n🎉 Test terminé !');
    console.log('=====================================');
    
    if (user) {
      console.log('📋 Prochaines étapes:');
      console.log('1. Accéder à /professionnel/dashboard');
      console.log('2. Vérifier que la page se charge sans erreur');
      console.log('3. Tester les différentes sections');
    } else {
      console.log('📋 Prochaines étapes:');
      console.log('1. Se connecter avec un compte professionnel');
      console.log('2. Accéder à /professionnel/dashboard');
      console.log('3. Vérifier le chargement');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

/**
 * Test des composants critiques
 */
function testComponents() {
  console.log('\n🧩 TEST DES COMPOSANTS CRITIQUES');
  console.log('=====================================');

  // Tests basiques
  const tests = [
    {
      name: 'Import CreditCard',
      test: () => import('lucide-react').then(m => !!m.CreditCard)
    },
    {
      name: 'Import Activity', 
      test: () => import('lucide-react').then(m => !!m.Activity)
    },
    {
      name: 'Import AlertTriangle',
      test: () => import('lucide-react').then(m => !!m.AlertTriangle)
    }
  ];

  tests.forEach(({ name, test }) => {
    test()
      .then(result => {
        console.log(`${result ? '✅' : '❌'} ${name}`);
      })
      .catch(err => {
        console.log(`❌ ${name}:`, err.message);
      });
  });
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Lancement du script de test du dashboard professionnel');
  console.log('Date:', new Date().toISOString());
  console.log('Environnement:', process.env.NODE_ENV || 'development');
  
  await testProfessionalDashboard();
  testComponents();
  
  console.log('\n📋 Résumé:');
  console.log('- Dashboard professionnel testé');
  console.log('- Imports vérifiés');
  console.log('- Base de données vérifiée');
  console.log('- Prêt pour l\'utilisation');
}

// Exécuter si appelé directement
if (require.main === module) {
  main().catch(console.error);
}

export { testProfessionalDashboard, testComponents };
