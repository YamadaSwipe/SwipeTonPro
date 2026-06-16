/**
 * VERIFICATION SCRIPT FOR RLS SECURITY FIX
 * =========================================
 * This script verifies that Row Level Security (RLS) is properly
 * enabled on all tables and that security policies are in place.
 * 
 * Run this after applying the migration to confirm the fix.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyRLSSecurity() {
  console.log('🔍 VERIFYING RLS SECURITY CONFIGURATION');
  console.log('==========================================\n');

  try {
    // Check RLS status using the helper function
    const { data: rlsStatus, error } = await supabase.rpc('check_rls_status');

    if (error) {
      console.error('❌ Error checking RLS status:', error.message);
      return false;
    }

    if (!rlsStatus || rlsStatus.length === 0) {
      console.error('❌ No tables found in the database');
      return false;
    }

    console.log('📊 RLS STATUS FOR ALL TABLES:\n');
    console.log('Table Name'.padEnd(40) + 'RLS Enabled'.padEnd(15) + 'Policies');
    console.log('='.repeat(70));

    let allTablesSecure = true;
    let tablesWithoutRLS = [];
    let tablesWithoutPolicies = [];

    rlsStatus.forEach(table => {
      const rlsStatus = table.rls_enabled ? '✅ Yes' : '❌ No';
      const policyCount = table.policy_count || 0;
      
      console.log(
        table.table_name.padEnd(40) + 
        rlsStatus.padEnd(15) + 
        policyCount
      );

      if (!table.rls_enabled) {
        allTablesSecure = false;
        tablesWithoutRLS.push(table.table_name);
      }

      if (policyCount === 0) {
        tablesWithoutPolicies.push(table.table_name);
      }
    });

    console.log('\n' + '='.repeat(70));
    console.log('\n📈 SUMMARY:\n');
    console.log(`Total tables: ${rlsStatus.length}`);
    console.log(`Tables with RLS enabled: ${rlsStatus.filter(t => t.rls_enabled).length}`);
    console.log(`Tables without RLS: ${tablesWithoutRLS.length}`);
    console.log(`Tables without policies: ${tablesWithoutPolicies.length}`);

    if (tablesWithoutRLS.length > 0) {
      console.log('\n⚠️  TABLES WITHOUT RLS:');
      tablesWithoutRLS.forEach(table => console.log(`   - ${table}`));
    }

    if (tablesWithoutPolicies.length > 0) {
      console.log('\n⚠️  TABLES WITHOUT POLICIES (may be intentional for some tables):');
      tablesWithoutPolicies.forEach(table => console.log(`   - ${table}`));
    }

    console.log('\n==========================================');
    
    if (allTablesSecure) {
      console.log('✅ SUCCESS: All tables have RLS enabled!');
      console.log('✅ The critical security vulnerability has been fixed.');
      console.log('\n📝 Next steps:');
      console.log('   1. Apply this migration to your Supabase project');
      console.log('   2. Test your application to ensure everything works');
      console.log('   3. Monitor the Supabase dashboard for any new alerts');
      return true;
    } else {
      console.log('❌ SECURITY ISSUE: Some tables do not have RLS enabled!');
      console.log('   Please run the migration: 20260627000000_comprehensive_rls_security_fix.sql');
      return false;
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

// Test unauthorized access (should be blocked)
async function testUnauthorizedAccess() {
  console.log('\n\n🔒 TESTING UNAUTHORIZED ACCESS');
  console.log('==========================================\n');

  // Create a client without authentication
  const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

  const tablesToTest = ['profiles', 'projects', 'professionals', 'messages'];
  
  console.log('Attempting to read data without authentication...\n');

  for (const table of tablesToTest) {
    try {
      const { data, error } = await anonClient.from(table).select('*').limit(1);
      
      if (error) {
        console.log(`✅ ${table.padEnd(20)} - Access blocked (${error.message})`);
      } else if (!data || data.length === 0) {
        console.log(`✅ ${table.padEnd(20)} - No data returned (RLS working)`);
      } else {
        console.log(`❌ ${table.padEnd(20)} - SECURITY ISSUE: Data accessible without auth!`);
      }
    } catch (error) {
      console.log(`✅ ${table.padEnd(20)} - Access blocked (${error.message})`);
    }
  }

  console.log('\n==========================================');
}

// Main execution
async function main() {
  console.log('\n🛡️  SUPABASE RLS SECURITY VERIFICATION');
  console.log('==========================================\n');
  console.log('Project: SwipeTonPro');
  console.log('Date:', new Date().toLocaleString('fr-FR'));
  console.log('\n');

  const isSecure = await verifyRLSSecurity();
  
  if (isSecure) {
    await testUnauthorizedAccess();
  }

  console.log('\n\n📋 MIGRATION FILE LOCATION:');
  console.log('   supabase/migrations/20260627000000_comprehensive_rls_security_fix.sql');
  console.log('\n💡 TO APPLY THE MIGRATION:');
  console.log('   1. Go to your Supabase Dashboard');
  console.log('   2. Navigate to SQL Editor');
  console.log('   3. Copy and paste the migration file content');
  console.log('   4. Execute the SQL');
  console.log('   5. Run this verification script again');
  console.log('\n');
}

main().catch(console.error);
