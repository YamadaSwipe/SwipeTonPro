import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const buildTime = process.env.NEXT_BUILD_TIME || new Date().toISOString();
    const commitHash = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'unknown';
    const environment = process.env.NODE_ENV || 'unknown';
    const vercelUrl = process.env.VERCEL_URL || 'not deployed';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'not configured';

    // Vérifier si les dernières modifications sont déployées
    const hasRecentFixes = process.env.NEXT_BUILD_TIME && 
      new Date(process.env.NEXT_BUILD_TIME) > new Date('2026-05-12T11:00:00Z');

    return res.status(200).json({
      success: true,
      deployment: {
        environment,
        buildTime,
        commitHash,
        vercelUrl,
        siteUrl,
        hasRecentFixes,
        deployedAt: new Date().toISOString()
      },
      features: {
        resetPasswordFixed: hasRecentFixes,
        baseUrl: environment === 'production' ? 'https://www.swipetonpro.fr' : 'http://localhost:3000',
        endpoints: {
          resetPassword: '/api/auth/reset-password',
          resetPasswordFixed: '/api/auth/reset-password-fixed',
          checkConfig: '/api/check-supabase-config'
        }
      },
      instructions: {
        ifNotDeployed: 'Attendez 2-3 minutes pour le déploiement complet',
        testCommand: 'curl -X POST https://www.swipetonpro.fr/api/auth/reset-password -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\"}"'
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur check-deployment:', error);
    return res.status(500).json({
      error: 'Erreur lors de la vérification du déploiement',
      details: error.message
    });
  }
}
