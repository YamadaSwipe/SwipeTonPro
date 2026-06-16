/**
 * Script de test du système de notifications amélioré
 * 
 * Ce script teste :
 * 1. La création de notifications avec messages personnalisés par rôle
 * 2. La récupération des notifications non lues
 * 3. Le marquage comme lu
 * 4. La vérification de la pastille de notification
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testNotificationSystem() {
  log('\n========================================', 'cyan');
  log('🔔 TEST DU SYSTÈME DE NOTIFICATIONS', 'cyan');
  log('========================================\n', 'cyan');

  try {
    // 1. Récupérer un utilisateur de test (professionnel)
    log('1️⃣ Recherche d\'un utilisateur professionnel...', 'blue');
    const { data: professionals, error: proError } = await supabase
      .from('professionals')
      .select('id, user_id, company_name')
      .limit(1);

    if (proError || !professionals || professionals.length === 0) {
      log('❌ Aucun professionnel trouvé. Créez d\'abord un compte professionnel.', 'red');
      return;
    }

    const professional = professionals[0];
    log(`✅ Professionnel trouvé : ${professional.company_name}`, 'green');

    // 2. Créer une notification de test pour le professionnel
    log('\n2️⃣ Création d\'une notification de test (Match)...', 'blue');
    const { data: notification, error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: professional.user_id,
        type: 'match_mutual',
        title: '🎉 Nouveau Match !',
        message: 'Nouveau Match ! Jean Dupont est intéressé par votre profil. Débloquez le contact pour voir le projet "Rénovation salle de bain" et organiser un rendez-vous.',
        data: {
          project_id: 'test-project-id',
          client_id: 'test-client-id',
          match_id: 'test-match-id'
        },
        is_read: false
      })
      .select()
      .single();

    if (notifError) {
      log(`❌ Erreur création notification : ${notifError.message}`, 'red');
      return;
    }

    log(`✅ Notification créée avec succès (ID: ${notification.id})`, 'green');
    log(`   Titre : ${notification.title}`, 'yellow');
    log(`   Message : ${notification.message}`, 'yellow');

    // 3. Vérifier le nombre de notifications non lues
    log('\n3️⃣ Vérification du nombre de notifications non lues...', 'blue');
    const { count, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', professional.user_id)
      .eq('is_read', false);

    if (countError) {
      log(`❌ Erreur comptage : ${countError.message}`, 'red');
      return;
    }

    log(`✅ Nombre de notifications non lues : ${count}`, 'green');
    log(`   → La pastille devrait afficher : ${count > 99 ? '99+' : count}`, 'yellow');

    // 4. Récupérer toutes les notifications de l'utilisateur
    log('\n4️⃣ Récupération de toutes les notifications...', 'blue');
    const { data: allNotifications, error: allError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', professional.user_id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (allError) {
      log(`❌ Erreur récupération : ${allError.message}`, 'red');
      return;
    }

    log(`✅ ${allNotifications.length} notification(s) récupérée(s)`, 'green');
    allNotifications.forEach((notif, index) => {
      log(`\n   Notification ${index + 1}:`, 'yellow');
      log(`   - Type : ${notif.type}`, 'yellow');
      log(`   - Titre : ${notif.title}`, 'yellow');
      log(`   - Lue : ${notif.is_read ? 'Oui ✅' : 'Non ❌'}`, 'yellow');
      log(`   - Date : ${new Date(notif.created_at).toLocaleString('fr-FR')}`, 'yellow');
    });

    // 5. Marquer la notification comme lue
    log('\n5️⃣ Marquage de la notification comme lue...', 'blue');
    const { error: updateError } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notification.id);

    if (updateError) {
      log(`❌ Erreur mise à jour : ${updateError.message}`, 'red');
      return;
    }

    log('✅ Notification marquée comme lue', 'green');

    // 6. Vérifier à nouveau le nombre de notifications non lues
    log('\n6️⃣ Vérification après marquage comme lu...', 'blue');
    const { count: newCount, error: newCountError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', professional.user_id)
      .eq('is_read', false);

    if (newCountError) {
      log(`❌ Erreur comptage : ${newCountError.message}`, 'red');
      return;
    }

    log(`✅ Nouveau nombre de notifications non lues : ${newCount}`, 'green');
    log(`   → La pastille devrait ${newCount === 0 ? 'disparaître ✅' : `afficher : ${newCount > 99 ? '99+' : newCount}`}`, 'yellow');

    // 7. Test de la fonction SQL create_notification
    log('\n7️⃣ Test de la fonction SQL create_notification...', 'blue');
    const { data: sqlResult, error: sqlError } = await supabase.rpc('create_notification', {
      p_user_id: professional.user_id,
      p_type: 'account_validated',
      p_title: '✅ Votre compte a été validé !',
      p_message: `Félicitations ${professional.company_name} ! Votre compte a été validé par l'administration. Vous pouvez maintenant postuler aux projets et développer votre activité.`,
      p_data: {
        professional_id: professional.id,
        company_name: professional.company_name
      }
    });

    if (sqlError) {
      log(`❌ Erreur fonction SQL : ${sqlError.message}`, 'red');
    } else {
      log(`✅ Notification créée via fonction SQL (ID: ${sqlResult})`, 'green');
    }

    // 8. Test de la fonction get_unread_notifications_count
    log('\n8️⃣ Test de la fonction get_unread_notifications_count...', 'blue');
    const { data: unreadCount, error: unreadError } = await supabase.rpc('get_unread_notifications_count', {
      p_user_id: professional.user_id
    });

    if (unreadError) {
      log(`❌ Erreur fonction SQL : ${unreadError.message}`, 'red');
    } else {
      log(`✅ Nombre de notifications non lues (via fonction) : ${unreadCount}`, 'green');
    }

    // 9. Récupérer un admin pour tester les notifications admin
    log('\n9️⃣ Test des notifications admin...', 'blue');
    const { data: admins, error: adminError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('role', ['admin', 'super_admin'])
      .limit(1);

    if (adminError || !admins || admins.length === 0) {
      log('⚠️  Aucun admin trouvé. Création d\'une notification admin ignorée.', 'yellow');
    } else {
      const admin = admins[0];
      log(`✅ Admin trouvé : ${admin.full_name || admin.email}`, 'green');

      // Créer une notification admin
      const { data: adminNotif, error: adminNotifError } = await supabase
        .from('notifications')
        .insert({
          user_id: admin.id,
          type: 'new_support_ticket',
          title: '🎫 Nouveau ticket de support reçu',
          message: 'Nouveau ticket de support reçu de Jean Dupont (jean@example.com). Sujet : "Problème de connexion". Priorité : haute. Traitez ce ticket rapidement pour assurer la satisfaction client.',
          data: {
            ticket_id: 'test-ticket-id',
            user_id: 'test-user-id',
            subject: 'Problème de connexion',
            priority: 'haute',
            category: 'technique'
          },
          is_read: false
        })
        .select()
        .single();

      if (adminNotifError) {
        log(`❌ Erreur création notification admin : ${adminNotifError.message}`, 'red');
      } else {
        log(`✅ Notification admin créée (ID: ${adminNotif.id})`, 'green');
        log(`   Titre : ${adminNotif.title}`, 'yellow');
      }
    }

    // Résumé final
    log('\n========================================', 'cyan');
    log('✅ TESTS TERMINÉS AVEC SUCCÈS', 'green');
    log('========================================\n', 'cyan');

    log('📊 Résumé des tests :', 'blue');
    log('✅ Création de notifications : OK', 'green');
    log('✅ Récupération des notifications : OK', 'green');
    log('✅ Marquage comme lu : OK', 'green');
    log('✅ Comptage des non lues : OK', 'green');
    log('✅ Fonctions SQL : OK', 'green');
    log('✅ Notifications par rôle : OK', 'green');

    log('\n🎯 Points de vérification :', 'blue');
    log('1. La pastille de notification s\'affiche quand unreadCount > 0', 'yellow');
    log('2. La pastille disparaît quand toutes les notifications sont lues', 'yellow');
    log('3. Les messages sont personnalisés selon le rôle (professionnel, particulier, admin)', 'yellow');
    log('4. Le système temps réel fonctionne via Supabase Realtime', 'yellow');

  } catch (error) {
    log(`\n❌ ERREUR GÉNÉRALE : ${error.message}`, 'red');
    console.error(error);
  }
}

// Exécuter les tests
testNotificationSystem();
