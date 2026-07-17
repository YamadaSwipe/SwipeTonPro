import { NextApiRequest, NextApiResponse } from 'next';
import { anonymousMessagingService } from '@/services/anonymousMessagingService';
import { withAuth, AuthenticatedRequest } from '@/middleware/withAuth';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default withAuth(async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Uniquement POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { content, matchId } = req.body;

    // Validation des données
    if (!content || !matchId) {
      return res.status(400).json({ 
        error: 'content et matchId requis' 
      });
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(matchId)) {
      return res.status(400).json({ error: 'matchId invalide' });
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

    // Vérifier l'appartenance au match et dériver le senderType côté serveur
    const { data: matchPayment, error: matchError } = await supabaseAdmin
      .from('match_payments')
      .select(
        'id, project:projects(client_id), professional:professionals(user_id)'
      )
      .eq('id', matchId)
      .maybeSingle();

    if (matchError || !matchPayment) {
      return res.status(404).json({ error: 'Match introuvable' });
    }

    const currentUserId = req.user?.id;
    const isClient = (matchPayment as any).project?.client_id === currentUserId;
    const isProfessional =
      (matchPayment as any).professional?.user_id === currentUserId;

    if (!isClient && !isProfessional) {
      return res.status(403).json({ error: 'Accès interdit à cette conversation' });
    }

    const senderType = isProfessional ? 'professional' : 'client';

    // Envoyer le message
    const result = await anonymousMessagingService.sendMessage({
      content: content.trim(),
      senderType,
      senderId: currentUserId as string,
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
});
