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

    // Essayer d'abord de lire la table auth.config directement
    let authConfig = null;
    let authError = null;

    try {
      const result = await supabaseAdmin
        .from('config')
        .select('*')
        .in('key', ['SITE_URL', 'URI_ALLOW_LIST', 'REDIRECT_URLS']);

      authConfig = result.data;
      authError = result.error;
    } catch (e) {
      console.log('❌ Erreur accès table config:', e);
      authError = e;
    }

    if (authError) {
      console.error('❌ Erreur lecture config auth:', authError);

      // La table config n'existe probablement pas, essayer avec auth.config
      try {
        const { data: authConfigData, error: authConfigError } =
          await supabaseAdmin
            .from('auth.config')
            .select('*')
            .in('key', ['SITE_URL', 'URI_ALLOW_LIST', 'REDIRECT_URLS']);

        if (authConfigError) {
          console.error('❌ Erreur lecture auth.config:', authConfigError);

          // Si ça ne marche pas, retourner un message clair
          return res.status(200).json({
            success: false,
            message: 'Configuration Supabase non accessible',
            error:
              "La table auth.config n'est pas accessible avec le service role key actuel",
            details: authConfigError.message,
            recommendations: [
              'Vérifiez que SUPABASE_SERVICE_ROLE_KEY est correct',
              'Accédez au dashboard Supabase > Settings > API',
              "Copiez le service_role key et ajoutez-le à vos variables d'environnement",
              'Ou configurez manuellement dans le dashboard Supabase',
            ],
            manualInstructions: {
              step1: 'Allez sur https://supabase.com/dashboard',
              step2: 'Sélectionnez votre projet',
              step3: 'Allez dans Settings > Authentication',
              step4: 'Dans "Site URL", mettez: https://www.swipetonpro.fr',
              step5:
                'Dans "Redirect URLs", ajoutez: https://www.swipetonpro.fr/auth/callback',
              step6: 'Sauvegardez les changements',
            },
          });
        }

        authConfig = authConfigData;
      } catch (e) {
        console.error('❌ Erreur auth.config:', e);
        return res.status(500).json({
          error: "Impossible d'accéder à la configuration Supabase",
          details: e.message,
          note: 'Veuillez configurer manuellement dans le dashboard Supabase',
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Configuration Supabase actuelle',
      config: authConfig,
      analysis: analyzeConfig(authConfig),
    });
  } catch (error: any) {
    console.error('❌ Erreur check-supabase-config:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      details: error.message,
    });
  }
}

function analyzeConfig(config: any[]) {
  if (!config || config.length === 0) {
    return {
      status: 'NOT_CONFIGURED',
      issues: ['Aucune configuration trouvée'],
      recommendations: ['Exécutez /api/force-supabase-config pour configurer'],
    };
  }

  const siteUrl = config.find((c) => c.key === 'SITE_URL')?.value;
  const allowList = config.find((c) => c.key === 'URI_ALLOW_LIST')?.value;
  const redirectUrls = config.find((c) => c.key === 'REDIRECT_URLS')?.value;

  const issues = [];
  const recommendations = [];

  if (!siteUrl || siteUrl.includes('localhost')) {
    issues.push('SITE_URL pointe vers localhost ou non configuré');
    recommendations.push('Configurez SITE_URL vers https://www.swipetonpro.fr');
  }

  if (!allowList || allowList.includes('localhost')) {
    issues.push('URI_ALLOW_LIST pointe vers localhost ou non configuré');
    recommendations.push(
      'Configurez URI_ALLOW_LIST vers https://www.swipetonpro.fr/auth/callback'
    );
  }

  if (!redirectUrls || redirectUrls.includes('localhost')) {
    issues.push('REDIRECT_URLS pointe vers localhost ou non configuré');
    recommendations.push(
      'Configurez REDIRECT_URLS vers https://www.swipetonpro.fr/auth/reset-password'
    );
  }

  const isProductionDomain =
    siteUrl?.includes('www.swipetonpro.fr') &&
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
      redirectUrls,
    },
  };
}
