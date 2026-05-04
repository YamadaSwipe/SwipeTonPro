import { NextApiRequest, NextApiResponse } from 'next';
import { rateLimitingService } from '@/services/rateLimitingService';
import { authService } from '@/services/authService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Uniquement GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // Vérifier l'authentification
    const session = await authService.getCurrentSession();
    if (!session?.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const { projectId } = req.query;

    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({ 
        error: 'projectId requis et doit être une chaîne de caractères' 
      });
    }

    const result = await rateLimitingService.checkProjectEstimationLimit(projectId);

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Erreur API check-project-limit:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur lors de la vérification de la limite' 
    });
  }
}
