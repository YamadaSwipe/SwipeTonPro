// =====================================================
// TEST DE CONNEXION SUPABASE - Diagnostic complet
// =====================================================

const https = require('https');

// Configuration depuis votre projet
const SUPABASE_URL = 'https://qhuvnpmqlucpjdslnfui.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodXZucG1xbHVjcGpkc2xuZnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NDM1MjYsImV4cCI6MjA4NzUxOTUyNn0.KZIdHPyxjArRY5RLHBeAm_CzU-zOPM97fj1XKR9SRbw';

async function testConnection() {
  console.log('🔍 TEST DE CONNEXION SUPABASE');
  console.log('=====================================');
  console.log('📍 URL:', SUPABASE_URL);
  console.log('🔑 Projet: qhuvnpmqlucpjdslnfui');
  console.log('');

  // Test 1: Base URL
  console.log('1️⃣ Test URL de base...');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': ANON_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log(`✅ Base URL: ${response.status} ${response.statusText}`);
  } catch (error) {
    console.log(`❌ Base URL: ${error.message}`);
  }

  // Test 2: Service Auth
  console.log('\n2️⃣ Test Service Auth...');
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: {
        'apikey': ANON_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log(`🔐 Auth Settings: ${response.status} ${response.statusText}`);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log('✅ Service Auth fonctionne');
    } else {
      console.log('❌ Service Auth a un problème');
    }
  } catch (error) {
    console.log(`❌ Auth Settings: ${error.message}`);
  }

  // Test 3: Endpoint de login
  console.log('\n3️⃣ Test endpoint login...');
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'test'
      })
    });
    console.log(`🔐 Login endpoint: ${response.status} ${response.statusText}`);
    
    if (response.status === 400) {
      console.log('✅ Login endpoint répond (400 = normal pour mauvais credentials)');
    } else if (response.status >= 500) {
      console.log('❌ Login endpoint en erreur (500 = service down)');
    }
  } catch (error) {
    console.log(`❌ Login endpoint: ${error.message}`);
  }

  // Test 4: Base de données
  console.log('\n4️⃣ Test base de données...');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=id&limit=1`, {
      headers: {
        'apikey': ANON_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log(`🗄️  Database: ${response.status} ${response.statusText}`);
    
    if (response.status === 200) {
      console.log('✅ Base de données accessible');
    } else {
      console.log('❌ Base de données inaccessible');
    }
  } catch (error) {
    console.log(`❌ Database: ${error.message}`);
  }

  console.log('\n📊 RÉSUMÉ');
  console.log('=====================================');
  console.log('Si Auth renvoie 500+ : Service Auth down');
  console.log('Si Database renvoie 200 : Base de données OK');
  console.log('Solution: Admin fantôme (déjà configuré)');
}

// Exécuter le test
testConnection().catch(console.error);
