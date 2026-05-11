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
    console.log('🔧 Forçage configuration Supabase pour domaine de production...');

    // Forcer la mise à jour de la configuration Supabase
    const { data: configUpdate, error: configError } = await supabaseAdmin
      .from('config')
      .upsert([
        {
          key: 'SITE_URL',
          value: 'https://www.swipetonpro.fr'
        },
        {
          key: 'URI_ALLOW_LIST', 
          value: 'https://www.swipetonpro.fr/auth/callback'
        },
        {
          key: 'REDIRECT_URLS',
          value: 'https://www.swipetonpro.fr/auth/reset-password'
        }
      ], {
        onConflict: 'key',
        ignoreDuplicates: false
      });

    if (configError) {
      console.error('❌ Erreur mise à jour config:', configError);
      
      // Essayer avec SQL direct si la méthode upsert ne fonctionne pas
      const { data: sqlResult, error: sqlError } = await supabaseAdmin
        .rpc('exec_sql', {
          sql: `
            UPDATE auth.config 
            SET value = 'https://www.swipetonpro.fr'
            WHERE key = 'SITE_URL';
            
            UPDATE auth.config 
            SET value = 'https://www.swipetonpro.fr/auth/callback'
            WHERE key = 'URI_ALLOW_LIST';
            
            UPDATE auth.config 
            SET value = 'https://www.swipetonpro.fr/auth/reset-password'
            WHERE key = 'REDIRECT_URLS';
            
            INSERT INTO auth.config (key, value) 
            VALUES 
              ('SITE_URL', 'https://www.swipetonpro.fr'),
              ('URI_ALLOW_LIST', 'https://www.swipetonpro.fr/auth/callback'),
              ('REDIRECT_URLS', 'https://www.swipetonpro.fr/auth/reset-password')
            ON CONFLICT (key) DO UPDATE SET 
              value = EXCLUDED.value;
          `
        });

      if (sqlError) {
        console.error('❌ Erreur SQL direct:', sqlError);
        return res.status(500).json({
          error: 'Impossible de mettre à jour la configuration Supabase',
          details: sqlError.message,
          note: 'Veuillez vérifier les permissions du service role key'
        });
      }
    }

    // Vérifier la configuration actuelle
    const { data: currentConfig, error: checkError } = await supabaseAdmin
      .from('config')
      .select('*')
      .in('key', ['SITE_URL', 'URI_ALLOW_LIST', 'REDIRECT_URLS']);

    if (checkError) {
      console.error('❌ Erreur vérification config:', checkError);
    } else {
      console.log('✅ Configuration actuelle:', currentConfig);
    }

    return res.status(200).json({
      success: true,
      message: 'Configuration Supabase mise à jour pour le domaine de production',
      config: {
        SITE_URL: 'https://www.swipetonpro.fr',
        URI_ALLOW_LIST: 'https://www.swipetonpro.fr/auth/callback',
        REDIRECT_URLS: 'https://www.swipetonpro.fr/auth/reset-password'
      },
      currentConfig: currentConfig || 'Non disponible',
      note: 'Les prochains liens de réinitialisation pointeront vers www.swipetonpro.fr'
    });

  } catch (error: any) {
    console.error('❌ Erreur force-supabase-config:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      details: error.message
    });
  }
}
