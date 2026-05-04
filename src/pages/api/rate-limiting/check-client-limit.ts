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

    const clientId = req.query.clientId as string || session.user.id;

    if (!clientId || typeof clientId !== 'string') {
      return res.status(400).json({ 
        error: 'clientId requis et doit être une chaîne de caractères' 
      });
    }

    // Vérifier si l'utilisateur vérifie sa propre limite ou est admin
    const userRole = session.user.user_metadata?.role || 'user';
    if (session.user.id !== clientId && !['admin', 'super_admin'].includes(userRole)) {
      return res.status(403).json({ 
        error: 'Accès non autorisé' 
      });
    }

    const result = await rateLimitingService.checkClientWeeklyLimit(clientId);

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Erreur API check-client-limit:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur lors de la vérification de la limite' 
    });
  }
}
