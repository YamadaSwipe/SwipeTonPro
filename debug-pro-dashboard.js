// Debug pour le dashboard professionnel qui ne s'affiche pas
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugProDashboard() {
  console.log('🔍 DEBUG DASHBOARD PROFESSIONNEL');
  console.log('===================================');
  
  try {
    // 1. Vérifier l'utilisateur connecté
    console.log('\n📋 1. UTILISATEUR CONNECTÉ:');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Erreur auth:', authError);
      console.log('ℹ️ Aucun utilisateur connecté');
      return;
    }
    
    console.log('✅ Utilisateur connecté:', {
      id: user.id,
      email: user.email,
      created_at: user.created_at
    });
    
    // 2. Vérifier le profil
    console.log('\n📋 2. PROFIL UTILISATEUR:');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Erreur profil:', profileError);
    } else {
      console.log('✅ Profil trouvé:', {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        phone: profile.phone,
        city: profile.city
      });
    }
    
    // 3. Vérifier le professionnel
    console.log('\n📋 3. PROFESSIONNEL:');
    const { data: professional, error: professionalError } = await supabase
      .from('professionals')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (professionalError) {
      console.error('❌ Erreur professionnel:', professionalError);
      console.log('ℹ️ Le professionnel n\'existe pas - redirection vers inscription?');
    } else {
      console.log('✅ Professionnel trouvé:', {
        id: professional.id,
        company_name: professional.company_name,
        is_verified: professional.is_verified,
        status: professional.status
      });
    }
    
    // 4. Vérifier les projets disponibles
    console.log('\n📋 4. PROJETS DISPONIBLES:');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, title, status, category, city, budget_min, budget_max')
      .eq('status', 'published')
      .limit(5);
    
    if (projectsError) {
      console.error('❌ Erreur projets:', projectsError);
    } else {
      console.log(`✅ Projets disponibles: ${projects?.length || 0}`);
      projects?.forEach((project, index) => {
        console.log(`   ${index + 1}. ${project.title} (${project.category}) - ${project.city}`);
      });
    }
    
    // 5. Vérifier les intérêts du professionnel
    console.log('\n📋 5. INTÉRÊTS DU PROFESSIONNEL:');
    if (professional) {
      const { data: interests, error: interestsError } = await supabase
        .from('project_interests')
        .select(`
          *,
          project:projects!project_interests_project_id_fkey(
            title,
            budget_min,
            budget_max,
            client_id
          )
        `)
        .eq("professional_id", professional.id)
        .in("status", ["payment_pending", "interested"]);
      
      if (interestsError) {
        console.error('❌ Erreur intérêts:', interestsError);
      } else {
        console.log(`✅ Intérêts trouvés: ${interests?.length || 0}`);
        interests?.forEach((interest, index) => {
          console.log(`   ${index + 1}. ${interest.project?.title} - ${interest.status}`);
        });
      }
    }
    
    // 6. Diagnostic final
    console.log('\n📋 6. DIAGNOSTIC FINAL:');
    if (!user) {
      console.log('❌ Problème: Aucun utilisateur connecté');
    } else if (!profile) {
      console.log('❌ Problème: Profil utilisateur non trouvé');
    } else if (!professional) {
      console.log('❌ Problème: Professionnel non trouvé -> Redirection vers inscription');
    } else {
      console.log('✅ Tout semble OK pour le dashboard');
      console.log('ℹ️ Le problème vient probablement du frontend ou d\'une erreur JavaScript');
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le debug
debugProDashboard();
