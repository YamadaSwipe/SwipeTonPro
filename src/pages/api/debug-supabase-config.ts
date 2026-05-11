import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    console.log('🔍 Diagnostic configuration Supabase...');

    const config = {
      environment: process.env.NODE_ENV,
      supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '***CONFIGURED***' : 'NOT_CONFIGURED',
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '***CONFIGURED***' : 'NOT_CONFIGURED'
      },
      urls: {
        vercel: process.env.VERCEL_URL,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
        localhost: 'http://localhost:3000',
        production: 'https://www.swipetonpro.fr'
      },
      resetPassword: {
        baseUrl: (() => {
          if (process.env.NODE_ENV === 'production') {
            const productionUrl = process.env.VERCEL_URL
              ? `https://${process.env.VERCEL_URL}`
              : process.env.NEXT_PUBLIC_SITE_URL
                ? process.env.NEXT_PUBLIC_SITE_URL
                : 'https://www.swipetonpro.fr';
            
            console.log('🌐 PRODUCTION - Reset URL will be:', productionUrl);
            return productionUrl;
          } else {
            const devUrl = 'http://localhost:3000';
            console.log('🔧 DEVELOPMENT - Reset URL will be:', devUrl);
            return devUrl;
          }
        })()
      },
      issues: []
    };

    // Vérifier les problèmes potentiels
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      config.issues.push('❌ NEXT_PUBLIC_SUPABASE_URL manquant');
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      config.issues.push('❌ SUPABASE_SERVICE_ROLE_KEY manquant');
    }

    if (process.env.NODE_ENV === 'production') {
      if (!process.env.VERCEL_URL && !process.env.NEXT_PUBLIC_SITE_URL) {
        config.issues.push('⚠️ VERCEL_URL ou NEXT_PUBLIC_SITE_URL manquant en production');
      }
    }

    if (!process.env.RESEND_API_KEY) {
      config.issues.push('⚠️ RESEND_API_KEY manquant (emails reset ne fonctionneront pas)');
    }

    // Calculer le BASE_URL qui sera utilisé
    const actualBaseUrl = config.resetPassword.baseUrl;
    config.actualBaseUrl = actualBaseUrl;
    config.baseUrlCorrect = actualBaseUrl.includes('www.swipetonpro.fr') && process.env.NODE_ENV === 'production';

    return res.status(200).json({
      success: true,
      config,
      summary: {
        totalIssues: config.issues.length,
        criticalIssues: config.issues.filter(i => i.includes('❌')).length,
        warningIssues: config.issues.filter(i => i.includes('⚠️')).length,
        baseUrlCorrect: config.baseUrlCorrect,
        environment: process.env.NODE_ENV
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur diagnostic config:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
}
