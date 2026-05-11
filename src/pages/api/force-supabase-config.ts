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
      '🔧 Forçage configuration Supabase pour domaine de production...'
    );

    // Essayer de mettre à jour la configuration Supabase
    let configUpdate = null;
    let configError = null;

    try {
      // Essayer d'abord avec la table config
      const result = await supabaseAdmin.from('config').upsert(
        [
          {
            key: 'SITE_URL',
            value: 'https://www.swipetonpro.fr',
          },
          {
            key: 'URI_ALLOW_LIST',
            value: 'https://www.swipetonpro.fr/auth/callback',
          },
          {
            key: 'REDIRECT_URLS',
            value: 'https://www.swipetonpro.fr/auth/reset-password',
          },
        ],
        {
          onConflict: 'key',
        }
      );

      configUpdate = result.data;
      configError = result.error;
    } catch (e) {
      console.log('❌ Erreur upsert table config:', e);
      configError = e;
    }

    if (configError) {
      console.error('❌ Erreur mise à jour config:', configError);

      // Si ça ne marche pas, donner des instructions manuelles
      return res.status(200).json({
        success: false,
        message: 'Configuration Supabase non modifiable via API',
        error:
          "La table auth.config n'est pas accessible en écriture avec le service role key actuel",
        details: configError.message,
        manualInstructions: {
          title: 'CONFIGURATION MANUELLE REQUISE',
          step1: 'Allez sur https://supabase.com/dashboard',
          step2: 'Sélectionnez votre projet SwipeTonPro',
          step3: 'Allez dans Settings > Authentication',
          step4: 'Dans "Site URL", remplacez par: https://www.swipetonpro.fr',
          step5:
            'Dans "Redirect URLs", ajoutez: https://www.swipetonpro.fr/auth/callback',
          step6:
            'Dans "Redirect URLs", ajoutez aussi: https://www.swipetonpro.fr/auth/reset-password',
          step7: 'Cliquez sur "Save" pour sauvegarder',
          step8: 'Attendez 1-2 minutes pour que les changements prennent effet',
        },
        verification: {
          note: 'Après la configuration manuelle, testez avec:',
          testCommand:
            'curl https://www.swipetonpro.fr/api/check-supabase-config',
        },
        expectedUrls: {
          SITE_URL: 'https://www.swipetonpro.fr',
          URI_ALLOW_LIST: 'https://www.swipetonpro.fr/auth/callback',
          REDIRECT_URLS: 'https://www.swipetonpro.fr/auth/reset-password',
        },
      });
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
      message:
        'Configuration Supabase mise à jour pour le domaine de production',
      config: {
        SITE_URL: 'https://www.swipetonpro.fr',
        URI_ALLOW_LIST: 'https://www.swipetonpro.fr/auth/callback',
        REDIRECT_URLS: 'https://www.swipetonpro.fr/auth/reset-password',
      },
      currentConfig: currentConfig || 'Non disponible',
      note: 'Les prochains liens de réinitialisation pointeront vers www.swipetonpro.fr',
    });
  } catch (error: any) {
    console.error('❌ Erreur force-supabase-config:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      details: error.message,
    });
  }
}
