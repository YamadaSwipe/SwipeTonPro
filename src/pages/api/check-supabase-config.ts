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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Vérification configuration Supabase...');

    // Vérifier la configuration actuelle
    const { data: authConfig, error: authError } = await supabaseAdmin
      .from('config')
      .select('*')
      .in('key', ['SITE_URL', 'URI_ALLOW_LIST', 'REDIRECT_URLS']);

    if (authError) {
      console.error('❌ Erreur lecture config auth:', authError);
      
      // Essayer avec une requête SQL directe
      const { data: sqlResult, error: sqlError } = await supabaseAdmin
        .rpc('exec_sql', {
          sql: `
            SELECT key, value 
            FROM auth.config 
            WHERE key IN ('SITE_URL', 'URI_ALLOW_LIST', 'REDIRECT_URLS');
          `
        });

      if (sqlError) {
        console.error('❌ Erreur SQL direct:', sqlError);
        return res.status(500).json({
          error: 'Impossible de lire la configuration Supabase',
          details: sqlError.message,
          note: 'Vérifiez que le service role key a les permissions nécessaires'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Configuration Supabase (via SQL)',
        config: sqlResult,
        analysis: analyzeConfig(sqlResult)
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Configuration Supabase actuelle',
      config: authConfig,
      analysis: analyzeConfig(authConfig)
    });

  } catch (error: any) {
    console.error('❌ Erreur check-supabase-config:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      details: error.message
    });
  }
}

function analyzeConfig(config: any[]) {
  if (!config || config.length === 0) {
    return {
      status: 'NOT_CONFIGURED',
      issues: ['Aucune configuration trouvée'],
      recommendations: ['Exécutez /api/force-supabase-config pour configurer']
    };
  }

  const siteUrl = config.find(c => c.key === 'SITE_URL')?.value;
  const allowList = config.find(c => c.key === 'URI_ALLOW_LIST')?.value;
  const redirectUrls = config.find(c => c.key === 'REDIRECT_URLS')?.value;

  const issues = [];
  const recommendations = [];

  if (!siteUrl || siteUrl.includes('localhost')) {
    issues.push('SITE_URL pointe vers localhost ou non configuré');
    recommendations.push('Configurez SITE_URL vers https://www.swipetonpro.fr');
  }

  if (!allowList || allowList.includes('localhost')) {
    issues.push('URI_ALLOW_LIST pointe vers localhost ou non configuré');
    recommendations.push('Configurez URI_ALLOW_LIST vers https://www.swipetonpro.fr/auth/callback');
  }

  if (!redirectUrls || redirectUrls.includes('localhost')) {
    issues.push('REDIRECT_URLS pointe vers localhost ou non configuré');
    recommendations.push('Configurez REDIRECT_URLS vers https://www.swipetonpro.fr/auth/reset-password');
  }

  const isProductionDomain = siteUrl?.includes('www.swipetonpro.fr') && 
                            allowList?.includes('www.swipetonpro.fr') && 
                            redirectUrls?.includes('www.swipetonpro.fr');

  return {
    status: isProductionDomain ? 'CORRECT' : 'NEEDS_FIX',
    issues,
    recommendations,
    isProductionDomain,
    currentUrls: {
      siteUrl,
      allowList,
      redirectUrls
    }
  };
}
