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
    console.log('💉 Mise à jour directe SQL sans fonction...');

    // Essayer différentes méthodes pour mettre à jour la configuration
    
    const results = [];
    let success = false;

    // Méthode 1: Essayer d'utiliser la table auth.config directement
    try {
      console.log('🔄 Méthode 1: Update direct auth.config...');
      
      const { data, error } = await supabaseAdmin
        .from('auth.config')
        .upsert([
          { key: 'SITE_URL', value: 'https://www.swipetonpro.fr' },
          { key: 'URI_ALLOW_LIST', value: 'https://www.swipetonpro.fr/auth/callback' },
          { key: 'REDIRECT_URLS', value: 'https://www.swipetonpro.fr/auth/reset-password' }
        ], {
          onConflict: 'key'
        });

      if (!error && data) {
        console.log('✅ Méthode 1 réussie!');
        success = true;
        results.push({
          method: 'Direct upsert',
          success: true,
          data
        });
      } else {
        console.log('❌ Méthode 1 échouée:', error?.message);
        results.push({
          method: 'Direct upsert',
          success: false,
          error: error?.message
        });
      }
    } catch (e: any) {
      console.log('❌ Méthode 1 exception:', e.message);
      results.push({
        method: 'Direct upsert',
        success: false,
        error: e.message
      });
    }

    // Si la méthode 1 a échoué, donner des instructions manuelles
    if (!success) {
      return res.status(200).json({
        success: false,
        message: 'Mise à jour directe impossible - configuration manuelle requise',
        results,
        manualSQL: {
          title: 'SQL À EXÉCUTER MANUELLEMENT DANS SUPABASE DASHBOARD',
          instructions: [
            '1. Allez sur https://supabase.com/dashboard',
            '2. Sélectionnez votre projet SwipeTonPro',
            '3. Allez dans SQL Editor',
            '4. Copiez-collez le SQL ci-dessous',
            '5. Cliquez sur "Run"'
          ],
          sqlCommands: [
            "UPDATE auth.config SET value = 'https://www.swipetonpro.fr' WHERE key = 'SITE_URL';",
            "UPDATE auth.config SET value = 'https://www.swipetonpro.fr/auth/callback' WHERE key = 'URI_ALLOW_LIST';",
            "UPDATE auth.config SET value = 'https://www.swipetonpro.fr/auth/reset-password' WHERE key = 'REDIRECT_URLS';",
            "INSERT INTO auth.config (key, value) VALUES ('SITE_URL', 'https://www.swipetonpro.fr') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;",
            "INSERT INTO auth.config (key, value) VALUES ('URI_ALLOW_LIST', 'https://www.swipetonpro.fr/auth/callback') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;",
            "INSERT INTO auth.config (key, value) VALUES ('REDIRECT_URLS', 'https://www.swipetonpro.fr/auth/reset-password') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;"
          ]
        },
        verification: {
          note: 'Après exécution manuelle, vérifiez avec:',
          command: 'curl https://www.swipetonpro.fr/api/check-supabase-config'
        }
      });
    }

    // Si succès, vérifier la configuration
    const { data: finalConfig, error: checkError } = await supabaseAdmin
      .from('auth.config')
      .select('*')
      .in('key', ['SITE_URL', 'URI_ALLOW_LIST', 'REDIRECT_URLS']);

    return res.status(200).json({
      success: true,
      message: 'Configuration Supabase mise à jour avec succès!',
      results,
      finalConfig: finalConfig || 'Non accessible',
      checkError: checkError?.message,
      nextSteps: {
        verification: 'curl https://www.swipetonpro.fr/api/check-supabase-config',
        test: 'Demandez une réinitialisation de mot de passe pour tester'
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur direct-sql-update:', error);
    return res.status(500).json({
      error: 'Erreur lors de la mise à jour SQL',
      details: error.message
    });
  }
}
