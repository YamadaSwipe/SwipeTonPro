import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * API pour envoyer un mini-message pré-match
 * POST /api/mini-messages/send
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { projectId, professionalId, content, senderType } = req.body;

    // Validation des paramètres
    if (!projectId || !professionalId || !content || !senderType) {
      return res.status(400).json({
        error: 'Paramètres manquants',
        required: ['projectId', 'professionalId', 'content', 'senderType'],
      });
    }

    if (senderType !== 'client' && senderType !== 'professional') {
      return res.status(400).json({
        error: 'senderType doit être "client" ou "professional"',
      });
    }

    // Validation de la longueur
    if (content.length > 100) {
      return res.status(400).json({
        error: `Message trop long (${content.length}/100 caractères)`,
      });
    }

    if (!content.trim()) {
      return res.status(400).json({
        error: 'Le message ne peut pas être vide',
      });
    }

    // Récupérer l'utilisateur authentifié
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Token invalide' });
    }

    // Vérifier que l'utilisateur a le droit d'envoyer ce message
    if (senderType === 'client') {
      const { data: project } = await supabase
        .from('projects')
        .select('client_id')
        .eq('id', projectId)
        .single();

      if (!project || project.client_id !== user.id) {
        return res.status(403).json({
          error: 'Vous n\'êtes pas autorisé à envoyer ce message',
        });
      }
    } else {
      const { data: professional } = await supabase
        .from('professionals')
        .select('user_id')
        .eq('id', professionalId)
        .single();

      if (!professional || professional.user_id !== user.id) {
        return res.status(403).json({
          error: 'Vous n\'êtes pas autorisé à envoyer ce message',
        });
      }
    }

    // Insérer le message (la validation SQL se fera automatiquement)
    const { data: message, error: insertError } = await supabase
      .from('mini_messages')
      .insert({
        project_id: projectId,
        professional_id: professionalId,
        sender_id: user.id,
        content: content,
        sender_type: senderType,
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erreur insertion mini-message:', insertError);

      // Messages d'erreur personnalisés
      if (insertError.message.includes('100 caractères')) {
        return res.status(400).json({
          error: 'Message trop long (100 caractères maximum)',
        });
      }

      if (insertError.message.includes('Limite de 3 messages')) {
        return res.status(400).json({
          error: 'Limite de 3 messages atteinte. Procédez au matching pour continuer.',
        });
      }

      if (
        insertError.message.includes('Coordonnées détectées') ||
        insertError.message.includes('Message bloqué')
      ) {
        return res.status(400).json({
          error:
            '⚠️ Message bloqué: Les échanges de coordonnées sont interdits avant le matching pour votre sécurité.',
          blocked: true,
        });
      }

      return res.status(400).json({
        error: insertError.message,
      });
    }

    // Créer une notification pour le destinataire
    const recipientId =
      senderType === 'client'
        ? (await supabase
            .from('professionals')
            .select('user_id')
            .eq('id', professionalId)
            .single()
          ).data?.user_id
        : (await supabase
            .from('projects')
            .select('client_id')
            .eq('id', projectId)
            .single()
          ).data?.client_id;

    if (recipientId) {
      await supabase.from('notifications').insert({
        user_id: recipientId,
        type: 'mini_message',
        title: 'Nouveau mini-message',
        message: `Vous avez reçu un nouveau message (${message.message_number}/3)`,
        data: {
          project_id: projectId,
          professional_id: professionalId,
          message_id: message.id,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: message,
    });
  } catch (error: any) {
    console.error('❌ Erreur API send mini-message:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      details: error.message,
    });
  }
}
