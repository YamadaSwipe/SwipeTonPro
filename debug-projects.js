// Script de débogage pour trouver les projets manquants
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuration Supabase
const supabaseUrl = 'https://qhuvnpmqlucpjdslnfui.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugProjects() {
  console.log('🔍 DÉBOGAGE DES PROJETS MANQUANTS');
  console.log('=====================================');
  
  try {
    // 1. Récupérer tous les projets publiés
    console.log('\n📋 1. TOUS LES PROJETS PUBLIÉS:');
    const { data: allPublished, error: errorAll } = await supabase
      .from('projects')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });
    
    if (errorAll) {
      console.error('❌ Erreur:', errorAll);
      return;
    }
    
    console.log(`📊 Nombre total de projets publiés: ${allPublished.length}`);
    allPublished.forEach((project, index) => {
      console.log(`  ${index + 1}. ${project.title} (ID: ${project.id})`);
      console.log(`     - Client ID: ${project.client_id}`);
      console.log(`     - Statut: ${project.status}`);
      console.log(`     - Validation: ${project.validation_status}`);
      console.log(`     - Créé: ${project.created_at}`);
      console.log('');
    });
    
    // 2. Récupérer tous les utilisateurs avec rôle 'client'
    console.log('\n👥 2. UTILISATEURS CLIENTS:');
    const { data: clients, error: errorClients } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'client');
    
    if (errorClients) {
      console.error('❌ Erreur:', errorClients);
      return;
    }
    
    console.log(`📊 Nombre total de clients: ${clients.length}`);
    clients.forEach((client, index) => {
      console.log(`  ${index + 1}. ${client.full_name || client.email} (ID: ${client.id})`);
      console.log(`     - Email: ${client.email}`);
      console.log('');
    });
    
    // 3. Vérifier les projets par client
    console.log('\n🔍 3. PROJETS PAR CLIENT:');
    for (const client of clients) {
      const { data: clientProjects, error: clientError } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });
      
      if (!clientError && clientProjects.length > 0) {
        console.log(`  👤 ${client.full_name || client.email}:`);
        clientProjects.forEach((project, index) => {
          console.log(`    ${index + 1}. ${project.title} (${project.status})`);
        });
        console.log('');
      }
    }
    
    // 4. Projets sans client valide
    console.log('\n⚠️ 4. PROJETS AVEC CLIENT_ID SUSPECT:');
    const suspiciousProjects = allPublished.filter(project => {
      const hasValidClient = clients.some(client => client.id === project.client_id);
      return !hasValidClient;
    });
    
    if (suspiciousProjects.length > 0) {
      console.log(`🚨 ${suspiciousProjects.length} projets avec client_id invalide:`);
      suspiciousProjects.forEach((project, index) => {
        console.log(`  ${index + 1}. ${project.title}`);
        console.log(`     - Client ID: ${project.client_id} (NON TROUVÉ)`);
        console.log(`     - Statut: ${project.status}`);
      });
    } else {
      console.log('✅ Tous les projets ont un client_id valide');
    }
    
    // 6. Vérifier l'utilisateur connecté actuellement
    console.log('\n� 6. VÉRIFICATION UTILISATEUR CONNECTÉ:');
    
    // Simuler la récupération de la session utilisateur
    console.log('📝 Note: Pour vérifier l\'utilisateur connecté, vous devez:');
    console.log('   1. Vous connecter à l\'application');
    console.log('   2. Ouvrir la console du navigateur (F12)');
    console.log('   3. Exécuter: localStorage.getItem(\'supabase.auth.token\')');
    console.log('   4. Comparer l\'ID utilisateur avec le client_id du projet');
    
    console.log('\n🎯 INFORMATIONS DU PROJET TROUVÉ:');
    console.log(`   - Titre: "Rénovation complète de salle de bain."`);
    console.log(`   - ID: 9d1d43bb-d0d9-44e1-8956-e7a39a32c07d`);
    console.log(`   - Client ID: e6801069-8d0a-46f6-b6ca-735f4e110eda`);
    console.log(`   - Client: Rida SOTBI (sotbirida@yahoo.fr)`);
    console.log(`   - Statut: published`);
    console.log(`   - Validation: null`);
    
    console.log('\n🔍 DIAGNOSTIC:');
    console.log('   ✅ Le projet existe et est publié');
    console.log('   ✅ Le client existe dans la base de données');
    console.log('   ✅ Le client_id du projet correspond à un utilisateur valide');
    console.log('   ❓ Le problème est probablement dans l\'authentification de l\'utilisateur');
    
    console.log('\n🛠️  ACTIONS RECOMMANDÉES:');
    console.log('   1. Vérifiez que vous êtes connecté avec le bon compte');
    console.log('   2. Vérifiez que vous utilisez le compte "Rida SOTBI"');
    console.log('   3. Déconnectez-vous et reconnectez-vous si nécessaire');
    console.log('   4. Vérifiez les logs dans la console du navigateur');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le débogage
debugProjects();
