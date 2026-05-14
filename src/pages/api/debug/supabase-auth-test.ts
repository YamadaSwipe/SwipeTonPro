import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Test de configuration Supabase Auth...');

    // Test 1: Vérifier les settings Auth
    const { data: authSettings, error: authError } =
      await supabaseAdmin.auth.admin.getConfig();

    if (authError) {
      console.error('❌ Erreur récupération config:', authError);
      return res
        .status(500)
        .json({ error: 'Erreur config', details: authError });
    }

    console.log('✅ Config Auth récupérée');

    // Test 2: Générer un lien de test
    const testEmail = 'test@example.com';
    const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`
      : 'https://www.swipetonpro.fr/auth/reset-password';

    console.log('🔗 URL de redirection utilisée:', redirectUrl);

    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: testEmail,
        options: {
          redirectTo: redirectUrl,
        },
      });

    if (linkError) {
      console.error('❌ Erreur génération lien:', linkError);
      return res.status(500).json({
        error: 'Erreur génération lien',
        details: linkError,
        redirectUrl: redirectUrl,
      });
    }

    console.log('✅ Lien généré avec succès');

    // Extraire des infos du lien (sans le révéler complètement)
    const link = linkData.properties?.action_link || '';
    const hasToken = link.includes('access_token=');
    const hasType = link.includes('type=recovery');

    return res.status(200).json({
      success: true,
      config: {
        siteUrl: authSettings?.site_url,
        redirectUrls: authSettings?.redirect_urls || [],
      },
      test: {
        redirectUrl: redirectUrl,
        linkGenerated: !!link,
        hasToken: hasToken,
        hasType: hasType,
        linkPreview: link.substring(0, 100) + '...',
      },
    });
  } catch (error) {
    console.error('❌ Erreur test:', error);
    return res
      .status(500)
      .json({ error: 'Erreur test', details: error.message });
  }
}
