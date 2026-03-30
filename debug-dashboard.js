// Script de débogage pour analyser les erreurs du dashboard
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugDashboard() {
  console.log('🔍 DÉBOGAGE DASHBOARD PARTICULIER');
  console.log('===================================');
  
  try {
    // 1. Vérifier l'utilisateur connecté (simulation)
    console.log('\n📋 1. SIMULATION UTILISATEUR CONNECTÉ:');
    const userId = 'e6801069-8d0a-46f6-b6ca-735f4e110eda'; // ID de Rida SOTBI
    console.log('👤 Utilisateur ID:', userId);
    
    // 2. Récupérer les projets de cet utilisateur
    console.log('\n📋 2. PROJETS UTILISATEUR:');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, title, status, budget_max, budget_min, estimated_budget_max, estimated_budget_min, created_at, category, city, bids_count, ai_analysis, validation_status')
      .eq('client_id', userId)
      .order('created_at', { ascending: false });
    
    if (projectsError) {
      console.error('❌ Erreur projets:', projectsError);
      return;
    }
    
    console.log(`📊 Nombre de projets: ${projects?.length || 0}`);
    
    if (projects && projects.length > 0) {
      projects.forEach((project, index) => {
        console.log(`\n🔍 Projet ${index + 1}:`);
        console.log(`   - ID: ${project.id}`);
        console.log(`   - Titre: ${project.title}`);
        console.log(`   - Status: ${project.status}`);
        console.log(`   - Validation: ${project.validation_status}`);
        console.log(`   - Budget max: ${project.budget_max} (${typeof project.budget_max})`);
        console.log(`   - Estimated budget max: ${project.estimated_budget_max} (${typeof project.estimated_budget_max})`);
        console.log(`   - AI Analysis: ${project.ai_analysis} (${typeof project.ai_analysis})`);
        
        // Test de conversion
        const budget = parseFloat(project.estimated_budget_max) || parseFloat(project.budget_max) || 0;
        const aiEstimation = project.ai_analysis ? parseFloat(project.ai_analysis) : 0;
        console.log(`   - Budget converti: ${budget}`);
        console.log(`   - AI Estimation convertie: ${aiEstimation}`);
      });
      
      // 3. Calculer les statistiques comme dans le dashboard
      console.log('\n📋 3. CALCUL STATISTIQUES:');
      
      const draftCount = projects.filter(p => p.status === "draft").length;
      const pendingCount = projects.filter(p => p.status === "pending").length;
      const publishedCount = projects.filter(p => p.status === "published").length;
      
      console.log(`📊 Draft: ${draftCount}, Pending: ${pendingCount}, Published: ${publishedCount}`);
      
      // Calculer le budget total
      const totalBudget = projects.reduce((sum, p) => {
        const budget = parseFloat(p.estimated_budget_max) || parseFloat(p.budget_max) || 0;
        return sum + budget;
      }, 0);
      console.log(`💰 Budget total: ${totalBudget}`);
      
      // Calculer le budget IA total
      const totalAIBudget = projects.reduce((sum, p) => {
        const aiEstimation = p.ai_analysis ? parseFloat(p.ai_analysis) : 0;
        return sum + aiEstimation;
      }, 0);
      console.log(`🤖 Budget IA total: ${totalAIBudget}`);
      
      // 4. Vérifier les types de données problématiques
      console.log('\n📋 4. VÉRIFICATION TYPES DE DONNÉES:');
      projects.forEach((project, index) => {
        console.log(`\n🔍 Projet ${index + 1} - Types:`);
        console.log(`   - estimated_budget_max: ${project.estimated_budget_max} -> ${typeof project.estimated_budget_max}`);
        console.log(`   - budget_max: ${project.budget_max} -> ${typeof project.budget_max}`);
        console.log(`   - ai_analysis: ${project.ai_analysis} -> ${typeof project.ai_analysis}`);
        
        // Tests de conversion
        console.log(`   - parseFloat(estimated_budget_max): ${parseFloat(project.estimated_budget_max)}`);
        console.log(`   - parseFloat(budget_max): ${parseFloat(project.budget_max)}`);
        console.log(`   - parseFloat(ai_analysis): ${parseFloat(project.ai_analysis)}`);
      });
      
    } else {
      console.log('ℹ️ Aucun projet trouvé pour cet utilisateur');
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le débogage
debugDashboard();
