/**
 * Script de test pour le système de tickets de support
 * 
 * Ce script teste la création d'un ticket de support via l'API /api/contact
 * et vérifie que les notifications et emails sont bien envoyés.
 * 
 * Usage:
 *   node test-support-ticket.js
 */

const API_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

async function testSupportTicket() {
  console.log('🧪 Test du système de tickets de support\n');
  console.log('📍 URL de l\'API:', `${API_URL}/api/contact\n`);

  // Données de test
  const testData = {
    name: 'Jean Dupont',
    email: 'jean.dupont@example.com',
    phone: '0612345678',
    address: '123 Rue de la République, 75001 Paris',
    requestType: 'Support technique',
    subject: 'Test du système de tickets',
    message: 'Ceci est un message de test pour vérifier que le système de tickets de support fonctionne correctement.',
  };

  console.log('📝 Données du ticket de test:');
  console.log(JSON.stringify(testData, null, 2));
  console.log('\n⏳ Envoi de la requête...\n');

  try {
    const response = await fetch(`${API_URL}/api/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const data = await response.json();

    console.log('📊 Réponse du serveur:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(data, null, 2));
    console.log('');

    if (response.ok) {
      console.log('✅ SUCCÈS: Le ticket a été créé avec succès!');
      if (data.ticketId) {
        console.log(`🎫 ID du ticket: ${data.ticketId}`);
      }
      console.log('📧 Les administrateurs devraient recevoir:');
      console.log('   - Une notification in-app');
      console.log('   - Un email de notification');
      console.log('');
      console.log('🔍 Vérifications à faire:');
      console.log('   1. Vérifier la table support_tickets dans Supabase');
      console.log('   2. Vérifier la table notifications pour les admins');
      console.log('   3. Vérifier la réception des emails par les admins');
      console.log('');
      console.log('💡 Requête SQL pour vérifier:');
      console.log('   SELECT * FROM support_tickets ORDER BY created_at DESC LIMIT 1;');
      console.log('   SELECT * FROM notifications WHERE type = \'support_ticket\' ORDER BY created_at DESC LIMIT 5;');
    } else {
      console.log('❌ ERREUR: La création du ticket a échoué');
      console.log('Message d\'erreur:', data.error || 'Erreur inconnue');
      if (data.details) {
        console.log('Détails:', data.details);
      }
    }
  } catch (error) {
    console.log('❌ ERREUR RÉSEAU:', error.message);
    console.log('');
    console.log('💡 Vérifications:');
    console.log('   - Le serveur est-il démarré? (npm run dev)');
    console.log('   - L\'URL est-elle correcte?', API_URL);
    console.log('   - Les variables d\'environnement sont-elles configurées?');
  }

  console.log('\n' + '='.repeat(60));
}

// Test de validation des champs
async function testValidation() {
  console.log('\n🧪 Test de validation des champs\n');

  const invalidTests = [
    {
      name: 'Email invalide',
      data: {
        name: 'Test',
        email: 'invalid-email',
        phone: '0612345678',
        subject: 'Test',
        message: 'Test',
      },
    },
    {
      name: 'Champs manquants',
      data: {
        name: 'Test',
        email: 'test@example.com',
      },
    },
  ];

  for (const test of invalidTests) {
    console.log(`📝 Test: ${test.name}`);
    try {
      const response = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(test.data),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log(`✅ Validation correcte: ${data.error}`);
      } else {
        console.log(`❌ La validation aurait dû échouer`);
      }
    } catch (error) {
      console.log(`❌ Erreur: ${error.message}`);
    }
    console.log('');
  }

  console.log('='.repeat(60));
}

// Exécuter les tests
async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 DÉMARRAGE DES TESTS DU SYSTÈME DE SUPPORT');
  console.log('='.repeat(60) + '\n');

  await testSupportTicket();
  await testValidation();

  console.log('\n✨ Tests terminés!\n');
}

runAllTests().catch(console.error);
