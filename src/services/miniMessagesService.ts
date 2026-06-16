import { supabase } from '@/integrations/supabase/client';

/**
 * Service pour gérer les mini-messages pré-match
 * - Limite stricte: 3 messages par utilisateur
 * - 100 caractères maximum AU TOTAL pour les 3 messages
 * - Détection et blocage des coordonnées
 */

export interface MiniMessage {
  id: string;
  project_id: string;
  professional_id: string;
  sender_id: string;
  content: string;
  sender_type: 'client' | 'professional';
  message_number: number;
  contains_digits: boolean;
  moderation_status: 'pending' | 'approved' | 'flagged' | 'blocked';
  blocked_reason?: string;
  is_pre_match: boolean;
  revealed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SendMiniMessageParams {
  projectId: string;
  professionalId: string;
  content: string;
  senderType: 'client' | 'professional';
}

export interface MiniMessageStats {
  remainingMessages: number;
  totalSent: number;
  canSend: boolean;
  isRevealed: boolean;
  totalCharsUsed: number;
  remainingChars: number;
}

export const miniMessagesService = {
  /**
   * Envoyer un mini-message avec validation stricte
   * IMPORTANT: 100 caractères maximum AU TOTAL pour les 3 messages
   */
  async sendMiniMessage(params: SendMiniMessageParams): Promise<{
    success: boolean;
    message?: MiniMessage;
    error?: string;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Non authentifié' };
      }

      // Validation: pas de contenu vide
      if (!params.content.trim()) {
        return { success: false, error: 'Le message ne peut pas être vide' };
      }

      // Vérifier le nombre de messages restants et le total de caractères
      const stats = await this.getMessageStats(
        params.projectId,
        params.professionalId,
        params.senderType
      );

      if (!stats.canSend) {
        return {
          success: false,
          error: stats.isRevealed
            ? 'Utilisez la messagerie complète après le matching'
            : 'Limite de 3 messages atteinte. Procédez au matching pour continuer.',
        };
      }

      // Validation: vérifier que le nouveau message ne dépasse pas le total de 100 caractères
      if (params.content.length > stats.remainingChars) {
        return {
          success: false,
          error: `Limite totale dépassée: ${stats.totalCharsUsed} caractères utilisés, ${stats.remainingChars} restants. Votre message fait ${params.content.length} caractères.`,
        };
      }

      // Insérer le message (la validation SQL se fera automatiquement)
      const { data, error } = await supabase
        .from('mini_messages')
        .insert({
          project_id: params.projectId,
          professional_id: params.professionalId,
          sender_id: user.id,
          content: params.content,
          sender_type: params.senderType,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur envoi mini-message:', error);
        
        // Messages d'erreur personnalisés
        if (error.message.includes('Limite totale')) {
          return { success: false, error: error.message };
        }
        if (error.message.includes('Limite de 3 messages')) {
          return { success: false, error: 'Limite de 3 messages atteinte' };
        }
        if (error.message.includes('Coordonnées détectées') || error.message.includes('Message bloqué')) {
          return {
            success: false,
            error: '⚠️ Message bloqué: Les échanges de coordonnées sont interdits avant le matching pour votre sécurité.',
          };
        }
        
        return { success: false, error: error.message };
      }

      return { success: true, message: data as MiniMessage };
    } catch (error: any) {
      console.error('❌ Erreur service sendMiniMessage:', error);
      return { success: false, error: error.message || 'Erreur lors de l\'envoi' };
    }
  },

  /**
   * Récupérer les mini-messages d'une conversation
   */
  async getMiniMessages(
    projectId: string,
    professionalId: string
  ): Promise<{
    success: boolean;
    messages?: MiniMessage[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('mini_messages')
        .select('*')
        .eq('project_id', projectId)
        .eq('professional_id', professionalId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Erreur récupération mini-messages:', error);
        return { success: false, error: error.message };
      }

      return { success: true, messages: data as MiniMessage[] };
    } catch (error: any) {
      console.error('❌ Erreur service getMiniMessages:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Obtenir les statistiques des messages (nombre restant, caractères utilisés, etc.)
   */
  async getMessageStats(
    projectId: string,
    professionalId: string,
    senderType: 'client' | 'professional'
  ): Promise<MiniMessageStats> {
    try {
      const { data, error } = await supabase
        .from('mini_messages')
        .select('*')
        .eq('project_id', projectId)
        .eq('professional_id', professionalId)
        .eq('sender_type', senderType)
        .eq('is_pre_match', true);

      if (error) {
        console.error('❌ Erreur stats mini-messages:', error);
        return {
          remainingMessages: 0,
          totalSent: 0,
          canSend: false,
          isRevealed: false,
          totalCharsUsed: 0,
          remainingChars: 100,
        };
      }

      const totalSent = data?.length || 0;
      const isRevealed = data?.some((msg) => !msg.is_pre_match || msg.revealed_at) || false;
      const totalCharsUsed = data?.reduce((sum, msg) => sum + msg.content.length, 0) || 0;
      const remainingChars = Math.max(0, 100 - totalCharsUsed);
      const remainingMessages = isRevealed ? 999 : Math.max(0, 3 - totalSent);
      const canSend = isRevealed || (totalSent < 3 && remainingChars > 0);

      return {
        remainingMessages,
        totalSent,
        canSend,
        isRevealed,
        totalCharsUsed,
        remainingChars,
      };
    } catch (error) {
      console.error('❌ Erreur service getMessageStats:', error);
      return {
        remainingMessages: 0,
        totalSent: 0,
        canSend: false,
        isRevealed: false,
        totalCharsUsed: 0,
        remainingChars: 100,
      };
    }
  },

  /**
   * Révéler les messages après un matching réussi
   */
  async revealMessages(
    projectId: string,
    professionalId: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase.rpc('reveal_mini_messages', {
        p_project_id: projectId,
        p_professional_id: professionalId,
      });

      if (error) {
        console.error('❌ Erreur révélation messages:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('❌ Erreur service revealMessages:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Obtenir le nombre de messages restants via RPC
   */
  async getRemainingMessagesCount(
    projectId: string,
    professionalId: string,
    senderType: 'client' | 'professional'
  ): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('get_remaining_mini_messages', {
        p_project_id: projectId,
        p_professional_id: professionalId,
        p_sender_type: senderType,
      });

      if (error) {
        console.error('❌ Erreur RPC remaining messages:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('❌ Erreur service getRemainingMessagesCount:', error);
      return 0;
    }
  },

  /**
   * Valider le contenu d'un message avant envoi (côté client)
   * Note: La validation du total de 100 caractères se fait dans sendMiniMessage
   */
  validateMessageContent(content: string): {
    isValid: boolean;
    error?: string;
    warnings?: string[];
  } {
    const warnings: string[] = [];

    // Vérifier la longueur
    if (content.length === 0) {
      return { isValid: false, error: 'Le message ne peut pas être vide' };
    }

    // Détecter les patterns suspects
    const phonePatterns = [
      /0[1-9][\s\.\-]?\d{2}[\s\.\-]?\d{2}[\s\.\-]?\d{2}[\s\.\-]?\d{2}/,
      /\+33[\s\.\-]?[1-9][\s\.\-]?\d{2}[\s\.\-]?\d{2}[\s\.\-]?\d{2}[\s\.\-]?\d{2}/,
      /\d{10,}/,
    ];

    const emailPattern = /@/;
    const externalMessagingPattern = /whatsapp|telegram|signal|viber|messenger/i;

    for (const pattern of phonePatterns) {
      if (pattern.test(content)) {
        return {
          isValid: false,
          error: '⚠️ Les numéros de téléphone sont interdits avant le matching',
        };
      }
    }

    if (emailPattern.test(content)) {
      return {
        isValid: false,
        error: '⚠️ Les adresses email sont interdites avant le matching',
      };
    }

    if (externalMessagingPattern.test(content)) {
      return {
        isValid: false,
        error: '⚠️ Les références à des messageries externes sont interdites',
      };
    }

    // Avertissements (pas bloquants)
    if (/\d{2,}/.test(content)) {
      warnings.push('Attention: votre message contient des chiffres');
    }

    return { isValid: true, warnings: warnings.length > 0 ? warnings : undefined };
  },

  /**
   * S'abonner aux nouveaux messages en temps réel
   */
  subscribeToMiniMessages(
    projectId: string,
    professionalId: string,
    callback: (message: MiniMessage) => void
  ) {
    return supabase
      .channel(`mini_messages:${projectId}:${professionalId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mini_messages',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const message = payload.new as MiniMessage;
          if (message.professional_id === professionalId) {
            callback(message);
          }
        }
      )
      .subscribe();
  },
};

export default miniMessagesService;
