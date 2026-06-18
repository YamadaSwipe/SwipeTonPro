require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSupportTicketsTable() {
  console.log('🔍 Vérification de la table support_tickets...\n');

  // Test 1: Vérifier si la table existe
  console.log('Test 1: Vérification de l\'existence de la table');
  const { data: tableData, error: tableError } = await supabase
    .from('support_tickets')
    .select('*')
    .limit(1);

  if (tableError) {
    console.error('❌ Erreur:', tableError.message);
    console.error('Code:', tableError.code);
    console.error('Details:', tableError.details);
    console.error('Hint:', tableError.hint);
    return;
  }

  console.log('✅ La table support_tickets existe\n');

  // Test 2: Essayer d'insérer un ticket de test
  console.log('Test 2: Insertion d\'un ticket de test');
  const testTicket = {
    name: 'Test User',
    email: 'test@example.com',
    phone: '0612345678',
    address: '123 Test Street',
    request_type: 'Demande générale',
    subject: 'Test Subject',
    message: 'Test message',
    status: 'pending',
    priority: 'normal',
    source: 'contact_form',
  };

  const { data: insertData, error: insertError } = await supabase
    .from('support_tickets')
    .insert(testTicket)
    .select()
    .single();

  if (insertError) {
    console.error('❌ Erreur lors de l\'insertion:', insertError.message);
    console.error('Code:', insertError.code);
    console.error('Details:', insertError.details);
    console.error('Hint:', insertError.hint);
    return;
  }

  console.log('✅ Ticket créé avec succès:', insertData.id);

  // Test 3: Vérifier les notifications créées
  console.log('\nTest 3: Vérification des notifications créées');
  const { data: notifications, error: notifError } = await supabase
    .from('notifications')
    .select('*')
    .eq('type', 'support_ticket')
    .order('created_at', { ascending: false })
    .limit(5);

  if (notifError) {
    console.error('❌ Erreur lors de la récupération des notifications:', notifError.message);
  } else {
    console.log(`✅ ${notifications.length} notification(s) trouvée(s)`);
    if (notifications.length > 0) {
      console.log('Dernière notification:', {
        id: notifications[0].id,
        title: notifications[0].title,
        message: notifications[0].message,
      });
    }
  }

  // Test 4: Nettoyer le ticket de test
  console.log('\nTest 4: Nettoyage du ticket de test');
  const { error: deleteError } = await supabase
    .from('support_tickets')
    .delete()
    .eq('id', insertData.id);

  if (deleteError) {
    console.error('❌ Erreur lors de la suppression:', deleteError.message);
  } else {
    console.log('✅ Ticket de test supprimé');
  }

  console.log('\n✅ Tous les tests sont terminés');
}

testSupportTicketsTable().catch(console.error);
