#!/usr/bin/env node

// Test la génération de lien via Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testGenerateLink() {
  console.log('\n=== TEST SUPABASE admin.generateLink ===\n');

  try {
    const usersRes = await supabaseAdmin.auth.admin.listUsers();
    console.log('Users count:', usersRes.data.users.length);
    usersRes.data.users.slice(0, 20).forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} [${user.id}]`);
    });
  } catch (listError) {
    console.error('Error listing users:', listError);
  }

  try {
    const configRes = await supabaseAdmin.from('auth.config').select('*');
    console.log('\nSupabase auth.config:');
    console.log(JSON.stringify(configRes, null, 2));
  } catch (configError) {
    console.error('Error reading auth.config:', configError);
  }

  const testEmail = 'admin@swipetonpro.fr';
  const redirectUrl = 'https://www.swipetonpro.fr/auth/reset-password';

  console.log('📧 Email:', testEmail);
  console.log('🔗 Redirect URL:', redirectUrl);

  try {
    // Test generateLink avec type 'recovery'
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: testEmail,
      options: { redirectTo: redirectUrl },
    });

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    if (!data?.properties?.action_link) {
      console.error('❌ No action_link returned');
      console.log('Data:', JSON.stringify(data, null, 2));
      return;
    }

    console.log('\nRéponse complète generateLink:');
    console.log(JSON.stringify(data, null, 2));

    const actionLink = data.properties.action_link;

    console.log('\n✅ Lien généré avec succès!');
    console.log('\n📋 Lien complet:');
    console.log(actionLink);

    console.log('\n🔍 Listing first 20 users to verify an existing account...');
    try {
      const usersRes = await supabaseAdmin.auth.admin.listUsers();
      console.log('Users count:', usersRes.data.users.length);
      usersRes.data.users.slice(0, 20).forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} [${user.id}]`);
      });
    } catch (e) {
      console.error('Error listing users:', e.message);
    }

    console.log('\n🔍 Analyse du lien:');
    const url = new URL(actionLink);
    console.log('Hash params:');
    const hashParams = new URLSearchParams(url.hash.substring(1));
    for (const [key, value] of hashParams) {
      console.log(`  ${key}: ${value.substring(0, 50)}...`);
    }

    console.log('\n✨ Simulation de clic:');
    console.log('1. Utilisateur reçoit cet email');
    console.log('2. Utilisateur clique sur le lien');
    console.log('3. Navigateur redirige vers: ' + actionLink);
    console.log(
      '4. reset-password.tsx should extract access_token et type=recovery'
    );
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }
}

testGenerateLink().catch(console.error);
