import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log(
      '🔧 Correction de la configuration Supabase pour les URLs de redirection...'
    );

    // Forcer la configuration correcte pour les reset password
    const correctRedirectUrl = 'https://www.swipetonpro.fr/auth/reset-password';
    const correctSiteUrl = 'https://www.swipetonpro.fr';

    // Utiliser l'Admin API pour mettre à jour la configuration
    // Note: Cette approche utilise l'API interne de Supabase qui peut changer
    const { data: configData, error: configError } = await supabaseAdmin
      .from('auth.config')
      .upsert(
        [
          { key: 'SITE_URL', value: correctSiteUrl },
          { key: 'REDIRECT_URLS', value: correctRedirectUrl },
          { key: 'URI_ALLOW_LIST', value: `${correctSiteUrl}/auth/callback` },
        ],
        { onConflict: 'key' }
      );

    if (configError) {
      console.error('❌ Erreur mise à jour config:', configError);

      // Essayer avec une requête SQL directe si l'API ne fonctionne pas
      try {
        const { error: sqlError } = await supabaseAdmin.rpc('exec_sql', {
          query: `
            UPDATE auth.config SET value = '${correctSiteUrl}' WHERE key = 'SITE_URL';
            UPDATE auth.config SET value = '${correctRedirectUrl}' WHERE key = 'REDIRECT_URLS';
            UPDATE auth.config SET value = '${correctSiteUrl}/auth/callback' WHERE key = 'URI_ALLOW_LIST';

            INSERT INTO auth.config (key, value) VALUES
              ('SITE_URL', '${correctSiteUrl}'),
              ('REDIRECT_URLS', '${correctRedirectUrl}'),
              ('URI_ALLOW_LIST', '${correctSiteUrl}/auth/callback')
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
          `,
        });

        if (sqlError) {
          throw sqlError;
        }

        console.log('✅ Configuration corrigée via SQL direct');
      } catch (sqlError) {
        console.error('❌ Erreur SQL:', sqlError);
        return res.status(500).json({
          error: 'Impossible de corriger la configuration',
          details: "Ni l'API ni le SQL n'ont fonctionné",
        });
      }
    } else {
      console.log('✅ Configuration corrigée via API:', configData);
    }

    return res.status(200).json({
      success: true,
      message: 'Configuration Supabase corrigée pour les URLs de redirection',
      config: {
        SITE_URL: correctSiteUrl,
        REDIRECT_URLS: correctRedirectUrl,
        URI_ALLOW_LIST: `${correctSiteUrl}/auth/callback`,
      },
    });
  } catch (error: any) {
    console.error('❌ Erreur correction config:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      details: error.message,
    });
  }
}
