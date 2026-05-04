import { NextApiRequest, NextApiResponse } from 'next';
import { anonymousMessagingService } from '@/services/anonymousMessagingService';
import { authService } from '@/services/authService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Uniquement POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // Vérifier l'authentification
    const session = await authService.getCurrentSession();
    if (!session?.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const { content, matchId, senderType } = req.body;

    // Validation des données
    if (!content || !matchId || !senderType) {
      return res.status(400).json({ 
        error: 'content, matchId et senderType requis' 
      });
    }

    if (!['professional', 'client'].includes(senderType)) {
      return res.status(400).json({ 
        error: 'senderType doit être "professional" ou "client"' 
      });
    }

    if (content.trim().length < 1) {
      return res.status(400).json({ 
        error: 'Le message ne peut pas être vide' 
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({ 
        error: 'Le message ne peut pas dépasser 1000 caractères' 
      });
    }

    // Envoyer le message
    const result = await anonymousMessagingService.sendMessage({
      content: content.trim(),
      senderType,
      senderId: session.user.id,
      matchId
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        messageId: result.messageId,
        moderationResult: result.moderationResult
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error,
        moderationResult: result.moderationResult
      });
    }

  } catch (error) {
    console.error('❌ Erreur API messaging/send:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur lors de l\'envoi du message' 
    });
  }
}
