// Script de test pour vérifier la correction des notifications
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testNotificationsFix() {
  console.log('🔍 TEST DE CORRECTION DES NOTIFICATIONS');
  console.log('=======================================');
  
  try {
    // 1. Vérifier la structure de la table notifications
    console.log('\n📋 1. STRUCTURE TABLE NOTIFICATIONS:');
    const { data: columns, error: columnsError } = await supabase
      .from('notifications')
      .select('*')
      .limit(1);
    
    if (columnsError) {
      console.error('❌ Erreur structure:', columnsError);
      return;
    }
    
    if (columns && columns.length > 0) {
      console.log('✅ Colonnes trouvées:', Object.keys(columns[0]));
    } else {
      console.log('ℹ️ Aucune notification existante pour vérifier la structure');
    }
    
    // 2. Créer une notification de test
    console.log('\n📋 2. CRÉATION NOTIFICATION TEST:');
    const userId = 'e6801069-8d0a-46f6-b6ca-735f4e110eda'; // ID de Rida SOTBI
    
    const { data: newNotification, error: createError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: 'Test de correction',
        message: 'Test du système de notifications après correction',
        type: 'test',
        is_read: false  // Utiliser "is_read" (colonne existante)
      })
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Erreur création:', createError);
      return;
    }
    
    console.log('✅ Notification créée:', {
      id: newNotification.id,
      title: newNotification.title,
      is_read: newNotification.is_read,
      read_at: newNotification.read_at
    });
    
    // 3. Tester markAsRead
    console.log('\n📋 3. TEST MARK AS READ:');
    const { error: markError } = await supabase
      .from('notifications')
      .update({ 
        is_read: true,  // Utiliser "is_read" (colonne existante)
        read_at: new Date().toISOString()
      })
      .eq('id', newNotification.id);
    
    if (markError) {
      console.error('❌ Erreur markAsRead:', markError);
    } else {
      console.log('✅ markAsRead réussi');
    }
    
    // 4. Vérifier la mise à jour
    console.log('\n📋 4. VÉRIFICATION MISE À JOUR:');
    const { data: updatedNotification, error: verifyError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', newNotification.id)
      .single();
    
    if (verifyError) {
      console.error('❌ Erreur vérification:', verifyError);
    } else {
      console.log('✅ Notification mise à jour:', {
        id: updatedNotification.id,
        is_read: updatedNotification.is_read,
        read_at: updatedNotification.read_at
      });
    }
    
    // 5. Tester getUnreadCount
    console.log('\n📋 5. TEST GET UNREAD COUNT:');
    const { count, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);  // Utiliser "is_read" (colonne existante)
    
    if (countError) {
      console.error('❌ Erreur count:', countError);
    } else {
      console.log(`✅ Unread count: ${count}`);
    }
    
    // 6. Nettoyer
    console.log('\n📋 6. NETTOYAGE:');
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('id', newNotification.id);
    
    if (deleteError) {
      console.error('❌ Erreur suppression:', deleteError);
    } else {
      console.log('✅ Notification de test supprimée');
    }
    
    console.log('\n🎉 TEST COMPLETÉ AVEC SUCCÈS');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testNotificationsFix();
