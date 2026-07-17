import { NextApiRequest, NextApiResponse } from 'next';
import { anonymousMessagingService } from '@/services/anonymousMessagingService';
import { withAuth, AuthenticatedRequest } from '@/middleware/withAuth';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default withAuth(async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Uniquement GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { matchId } = req.query;

    if (!matchId) {
      return res.status(400).json({ 
        error: 'matchId requis' 
      });
    }

    if (typeof matchId !== 'string') {
      return res.status(400).json({ 
        error: 'matchId doit être une chaîne de caractères' 
      });
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(matchId)) {
      return res.status(400).json({ error: 'matchId invalide' });
    }

    // Vérifier l'appartenance au match et dériver le userType côté serveur
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

    const userType = (isProfessional ? 'professional' : 'client') as
      | 'professional'
      | 'client';

    // Récupérer les messages
    const result = await anonymousMessagingService.getMatchMessages(
      matchId,
      currentUserId as string,
      userType
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
});
