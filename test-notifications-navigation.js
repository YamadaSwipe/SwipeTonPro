// Test pour vérifier la navigation des notifications
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testNotificationsNavigation() {
  console.log('🔍 TEST NAVIGATION NOTIFICATIONS');
  console.log('===================================');
  
  try {
    // 1. Vérifier les notifications avec project_id
    console.log('\n📋 1. NOTIFICATIONS AVEC PROJECT_ID:');
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .not('data', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (notifError) {
      console.error('❌ Erreur notifications:', notifError);
      return;
    }
    
    console.log(`📊 Nombre de notifications: ${notifications?.length || 0}`);
    
    if (notifications && notifications.length > 0) {
      notifications.forEach((notif, index) => {
        console.log(`\n🔍 Notification ${index + 1}:`);
        console.log(`   - ID: ${notif.id}`);
        console.log(`   - Titre: ${notif.title}`);
        console.log(`   - Type: ${notif.type}`);
        console.log(`   - is_read: ${notif.is_read}`);
        console.log(`   - Data:`, notif.data);
        
        if (notif.data?.project_id) {
          console.log(`   - ✅ Project ID présent: ${notif.data.project_id}`);
          console.log(`   - 🔗 URL: /particulier/projects/${notif.data.project_id}`);
        } else {
          console.log(`   - ❌ Project ID manquant`);
        }
      });
    }
    
    // 2. Vérifier les projets correspondants
    console.log('\n📋 2. VÉRIFICATION PROJETS CORRESPONDANTS:');
    const projectIds = notifications
      ?.filter(n => n.data?.project_id)
      ?.map(n => n.data.project_id) || [];
    
    if (projectIds.length > 0) {
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, title, status')
        .in('id', projectIds);
      
      if (projectsError) {
        console.error('❌ Erreur projets:', projectsError);
      } else {
        console.log(`✅ Projets trouvés: ${projects?.length || 0}`);
        projects?.forEach(project => {
          console.log(`   - ${project.id}: ${project.title} (${project.status})`);
        });
      }
    }
    
    // 3. Créer une notification de test si nécessaire
    console.log('\n📋 3. CRÉATION NOTIFICATION TEST:');
    const userId = 'e6801069-8d0a-46f6-b6ca-735f4e110eda'; // ID de Rida SOTBI
    
    // Récupérer un projet existant
    const { data: existingProject } = await supabase
      .from('projects')
      .select('id, title')
      .eq('client_id', userId)
      .limit(1)
      .single();
    
    if (existingProject) {
      const { data: testNotif, error: createError } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: 'Test navigation',
          message: `Test de navigation vers le projet "${existingProject.title}"`,
          type: 'test_navigation',
          data: {
            project_id: existingProject.id,
            test: true
          },
          is_read: false
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Erreur création test:', createError);
      } else {
        console.log('✅ Notification test créée:', {
          id: testNotif.id,
          title: testNotif.title,
          project_id: testNotif.data.project_id,
          url: `/particulier/projects/${testNotif.data.project_id}`
        });
      }
    } else {
      console.log('ℹ️ Aucun projet trouvé pour créer une notification test');
    }
    
    console.log('\n🎉 TEST TERMINÉ');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testNotificationsNavigation();
