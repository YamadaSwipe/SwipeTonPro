const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testResetFlow() {
  console.log('=== TEST RESET PASSWORD FLOW ===\n');

  // Test avec un email test
  const testEmail = 'test-reset@example.com';

  console.log('1️⃣ Testing resetPasswordForEmail...');
  const res1 = await supabaseAdmin.auth.resetPasswordForEmail(testEmail, {
    redirectTo: 'https://www.swipetonpro.fr/auth/reset-password',
  });

  console.log('Response:', JSON.stringify(res1, null, 2));

  console.log('\n2️⃣ Testing with admin.generateLink...');
  try {
    const res2 = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: testEmail,
      options: { redirectTo: 'https://www.swipetonpro.fr/auth/reset-password' },
    });
    console.log('Response:', JSON.stringify(res2, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  }

  console.log('\n3️⃣ Testing with admin.generateLink type=magiclink...');
  try {
    const res3 = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: testEmail,
      options: { redirectTo: 'https://www.swipetonpro.fr/auth/reset-password' },
    });
    console.log('Response:', JSON.stringify(res3, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  }

  console.log('\n4️⃣ Checking Supabase Auth config...');
  try {
    const { data } = await supabaseAdmin.auth.admin.listUsers();
    console.log('Users in db:', data?.users?.length || 0);
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testResetFlow().catch(console.error);
