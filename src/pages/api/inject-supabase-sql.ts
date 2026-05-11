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
    console.log('💉 Injection SQL directe dans Supabase...');

    // SQL direct pour forcer la configuration
    const sqlCommands = [
      // Mettre à jour SITE_URL
      `UPDATE auth.config SET value = 'https://www.swipetonpro.fr' WHERE key = 'SITE_URL';`,
      
      // Mettre à jour URI_ALLOW_LIST
      `UPDATE auth.config SET value = 'https://www.swipetonpro.fr/auth/callback' WHERE key = 'URI_ALLOW_LIST';`,
      
      // Mettre à jour REDIRECT_URLS
      `UPDATE auth.config SET value = 'https://www.swipetonpro.fr/auth/reset-password' WHERE key = 'REDIRECT_URLS';`,
      
      // Insérer si n'existe pas
      `INSERT INTO auth.config (key, value) VALUES ('SITE_URL', 'https://www.swipetonpro.fr') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;`,
      
      `INSERT INTO auth.config (key, value) VALUES ('URI_ALLOW_LIST', 'https://www.swipetonpro.fr/auth/callback') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;`,
      
      `INSERT INTO auth.config (key, value) VALUES ('REDIRECT_URLS', 'https://www.swipetonpro.fr/auth/reset-password') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;`
    ];

    const results = [];
    let allSuccess = true;

    // Exécuter chaque commande SQL
    for (const sql of sqlCommands) {
      try {
        console.log('💉 Exécution SQL:', sql);
        
        // Utiliser la méthode RPC pour exécuter du SQL
        const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql });
        
        if (error) {
          console.error('❌ Erreur SQL:', error);
          results.push({
            sql,
            success: false,
            error: error.message
          });
          allSuccess = false;
        } else {
          console.log('✅ SQL exécuté avec succès');
          results.push({
            sql,
            success: true,
            data
          });
        }
      } catch (e: any) {
        console.error('❌ Erreur exception SQL:', e);
        results.push({
          sql,
          success: false,
          error: e.message
        });
        allSuccess = false;
      }
    }

    // Vérifier la configuration après injection
    const { data: finalConfig, error: checkError } = await supabaseAdmin
      .from('auth.config')
      .select('*')
      .in('key', ['SITE_URL', 'URI_ALLOW_LIST', 'REDIRECT_URLS']);

    return res.status(200).json({
      success: allSuccess,
      message: allSuccess 
        ? 'Configuration Supabase mise à jour avec succès via injection SQL'
        : 'Injection SQL partielle - certains éléments ont échoué',
      results,
      finalConfig: finalConfig || 'Non accessible',
      checkError: checkError?.message,
      nextSteps: {
        verification: 'curl https://www.swipetonpro.fr/api/check-supabase-config',
        test: 'Demandez une réinitialisation de mot de passe pour tester'
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur injection SQL:', error);
    return res.status(500).json({
      error: 'Erreur lors de l\'injection SQL',
      details: error.message
    });
  }
}
