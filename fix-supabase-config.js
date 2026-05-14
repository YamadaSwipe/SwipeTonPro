#!/usr/bin/env node

/**
 * Script pour corriger la configuration Supabase pour les URLs de redirection
 * Ce script met à jour la table auth.config pour s'assurer que les liens
 * de réinitialisation de mot de passe pointent vers la bonne URL.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixSupabaseConfig() {
  console.log('🔧 Correction de la configuration Supabase...');

  const correctSiteUrl = 'https://www.swipetonpro.fr';
  const correctRedirectUrl = 'https://www.swipetonpro.fr/auth/reset-password';
  const correctCallbackUrl = 'https://www.swipetonpro.fr/auth/callback';

  try {
    console.log('📝 Mise à jour de SITE_URL...');
    const { error: siteError } = await supabaseAdmin
      .from('auth.config')
      .upsert(
        { key: 'SITE_URL', value: correctSiteUrl },
        { onConflict: 'key' }
      );

    if (siteError) {
      console.error('❌ Erreur SITE_URL:', siteError);
    } else {
      console.log('✅ SITE_URL corrigé');
    }

    console.log('📝 Mise à jour de REDIRECT_URLS...');
    const { error: redirectError } = await supabaseAdmin
      .from('auth.config')
      .upsert(
        { key: 'REDIRECT_URLS', value: correctRedirectUrl },
        { onConflict: 'key' }
      );

    if (redirectError) {
      console.error('❌ Erreur REDIRECT_URLS:', redirectError);
    } else {
      console.log('✅ REDIRECT_URLS corrigé');
    }

    console.log('📝 Mise à jour de URI_ALLOW_LIST...');
    const { error: uriError } = await supabaseAdmin
      .from('auth.config')
      .upsert(
        { key: 'URI_ALLOW_LIST', value: correctCallbackUrl },
        { onConflict: 'key' }
      );

    if (uriError) {
      console.error('❌ Erreur URI_ALLOW_LIST:', uriError);
    } else {
      console.log('✅ URI_ALLOW_LIST corrigé');
    }

    console.log('🎉 Configuration Supabase corrigée avec succès !');
    console.log('📋 Configuration appliquée :');
    console.log(`   SITE_URL: ${correctSiteUrl}`);
    console.log(`   REDIRECT_URLS: ${correctRedirectUrl}`);
    console.log(`   URI_ALLOW_LIST: ${correctCallbackUrl}`);
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
    process.exit(1);
  }
}

// Exécuter le script
fixSupabaseConfig();
