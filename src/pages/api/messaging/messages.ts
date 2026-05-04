import { NextApiRequest, NextApiResponse } from 'next';
import { anonymousMessagingService } from '@/services/anonymousMessagingService';
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

    const { matchId, userType } = req.query;

    if (!matchId || !userType) {
      return res.status(400).json({ 
        error: 'matchId et userType requis' 
      });
    }

    if (typeof matchId !== 'string' || typeof userType !== 'string') {
      return res.status(400).json({ 
        error: 'matchId et userType doivent être des chaînes de caractères' 
      });
    }

    if (!['professional', 'client'].includes(userType)) {
      return res.status(400).json({ 
        error: 'userType doit être "professional" ou "client"' 
      });
    }

    // Récupérer les messages
    const result = await anonymousMessagingService.getMatchMessages(
      matchId,
      session.user.id,
      userType as 'professional' | 'client'
    );

    if (result.success) {
      return res.status(200).json({
        success: true,
        messages: result.messages
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Erreur API messaging/messages:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des messages' 
    });
  }
}
