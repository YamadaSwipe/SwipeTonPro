import { supabase } from '@/integrations/supabase/client';

// Patterns pour détecter les coordonnées
const CONTACT_PATTERNS = {
  phone: [
    /\b(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}\b/g, // Français
    /\b\d{2,4}[-.\s]?\d{2,4}[-.\s]?\d{2,4}[-.\s]?\d{2,4}\b/g, // International
    /\b(?:06|07)\s*?\d{2}\s*?\d{2}\s*?\d{2}\s*?\d{2}\b/g // Mobile FR
  ],
  email: [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Standard
    /\b[A-Za-z0-9._%+-]+\s*@\s*[A-Za-z0-9.-]+\s*\.\s*[A-Z|a-z]{2,}\b/g // Avec espaces
  ],
  website: [
    /\b(?:https?:\/\/)?(?:www\.)?[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}(?:\/[^\s]*)?\b/g, // URLs
    /\b[A-Za-z0-9.-]+\.(?:com|fr|org|net|io|co|app|dev)\b/g // Domaines
  ],
  external_messaging: [
    /\b(?:whatsapp|telegram|signal|viber|messenger|instagram|facebook)\b/gi,
    /\b@[\w.-]+/g // Noms d'utilisateur
  ]
};

interface MessageContent {
  content: string;
  senderType: 'professional' | 'client';
  senderId: string;
  matchId: string;
}

interface ModerationResult {
  isBlocked: boolean;
  containsContactInfo: boolean;
  blockedPatterns: string[];
  detectedContent: string[];
  confidence: number;
  reason?: string;
}

interface MessageLimitResult {
  canSend: boolean;
  messageNumber: number;
  remainingMessages: number;
  isRevealed: boolean;
}

export const anonymousMessagingService = {
  /**
   * Modère le contenu d'un message pour détecter les coordonnées
   */
  async moderateMessage(content: string): Promise<ModerationResult> {
    const detectedPatterns: string[] = [];
    const detectedContent: string[] = [];
    let confidence = 0;

    // Vérifier chaque type de pattern
    for (const [type, patterns] of Object.entries(CONTACT_PATTERNS)) {
      for (const pattern of patterns) {
        const matches = content.match(pattern);
        if (matches) {
          detectedPatterns.push(type);
          detectedContent.push(...matches);
          confidence += 0.3; // Chaque détection augmente la confiance
        }
      }
    }

    // Normaliser la confiance entre 0 et 1
    confidence = Math.min(confidence, 1);

    const isBlocked = confidence > 0.7; // Seuil de blocage
    const containsContactInfo = detectedPatterns.length > 0;

    // Logger la détection
    if (isBlocked || containsContactInfo) {
      await this.logModeration(content, detectedPatterns, detectedContent, confidence);
    }

    return {
      isBlocked,
      containsContactInfo,
      blockedPatterns: detectedPatterns,
      detectedContent,
      confidence,
      reason: isBlocked ? 'Coordonnées détectées' : undefined
    };
  },

  /**
   * Vérifie si l'utilisateur peut envoyer un message (limite de 3 messages anonymes)
   */
  async checkMessageLimit(
    senderType: 'professional' | 'client',
    senderId: string,
    matchId: string
  ): Promise<MessageLimitResult> {
    try {
      // Compter les messages existants
      const { data: existingMessages, error } = await supabase
        .from('anonymous_messages')
        .select('message_number, is_anonymous, revealed_at')
        .eq('match_id', matchId)
        .eq('sender_type', senderType)
        .eq('sender_id', senderId)
        .order('message_number', { ascending: false });

      if (error) {
        console.error('❌ Erreur vérification limite messages:', error);
        return {
          canSend: false,
          messageNumber: 0,
          remainingMessages: 0,
          isRevealed: false
        };
      }

      const messageCount = existingMessages?.length || 0;
      const maxMessages = 3; // Récupérer depuis app_settings si besoin
      const canSend = messageCount < maxMessages;
      const remainingMessages = Math.max(0, maxMessages - messageCount);
      const nextMessageNumber = messageCount + 1;

      // Vérifier si les coordonnées sont déjà révélées
      const isRevealed = existingMessages?.some(msg => !msg.is_anonymous || msg.revealed_at);

      return {
        canSend: canSend || isRevealed, // Si révélé, pas de limite
        messageNumber: nextMessageNumber,
        remainingMessages: isRevealed ? 999 : remainingMessages,
        isRevealed: isRevealed || false
      };

    } catch (error) {
      console.error('❌ Erreur service checkMessageLimit:', error);
      return {
        canSend: false,
        messageNumber: 0,
        remainingMessages: 0,
        isRevealed: false
      };
    }
  },

  /**
   * Envoie un message avec modération automatique
   */
  async sendMessage(messageData: MessageContent): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
    moderationResult?: ModerationResult;
  }> {
    try {
      // 1. Vérifier la limite de messages
      const limitCheck = await this.checkMessageLimit(
        messageData.senderType,
        messageData.senderId,
        messageData.matchId
      );

      if (!limitCheck.canSend) {
        return {
          success: false,
          error: limitCheck.isRevealed 
            ? 'Messages illimités après révélation des coordonnées'
            : `Limite de ${limitCheck.remainingMessages} messages anonymes atteinte`
        };
      }

      // 2. Modérer le contenu
      const moderationResult = await this.moderateMessage(messageData.content);

      if (moderationResult.isBlocked) {
        return {
          success: false,
          error: 'Message bloqué : coordonnées détectées',
          moderationResult
        };
      }

      // 3. Insérer le message
      const { data: message, error } = await supabase
        .from('anonymous_messages')
        .insert({
          match_id: messageData.matchId,
          sender_type: messageData.senderType,
          sender_id: messageData.senderId,
          content: messageData.content,
          message_number: limitCheck.messageNumber,
          moderation_status: moderationResult.containsContactInfo ? 'flagged' : 'approved',
          contains_contact_info: moderationResult.containsContactInfo,
          blocked_patterns: moderationResult.blockedPatterns,
          is_anonymous: !limitCheck.isRevealed
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur insertion message:', error);
        return {
          success: false,
          error: 'Erreur lors de l\'envoi du message'
        };
      }

      // 4. Mettre à jour le statut du match si nécessaire
      if (moderationResult.containsContactInfo) {
        await this.flagMatchForReview(messageData.matchId);
      }

      return {
        success: true,
        messageId: message.id,
        moderationResult
      };

    } catch (error) {
      console.error('❌ Erreur service sendMessage:', error);
      return {
        success: false,
        error: 'Erreur serveur lors de l\'envoi du message'
      };
    }
  },

  /**
   * Révèle les coordonnées des deux parties (après paiement ou accord)
   */
  async revealContactInfo(matchId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Mettre à jour tous les messages du match
      const { error } = await supabase
        .from('anonymous_messages')
        .update({
          is_anonymous: false,
          revealed_at: new Date().toISOString()
        })
        .eq('match_id', matchId);

      if (error) {
        console.error('❌ Erreur révélation coordonnées:', error);
        return {
          success: false,
          error: 'Erreur lors de la révélation des coordonnées'
        };
      }

      // Notifier les deux parties
      await this.notifyContactReveal(matchId);

      return { success: true };

    } catch (error) {
      console.error('❌ Erreur service revealContactInfo:', error);
      return {
        success: false,
        error: 'Erreur serveur lors de la révélation'
      };
    }
  },

  /**
   * Récupère les messages d'un match
   */
  async getMatchMessages(
    matchId: string,
    userId: string,
    userType: 'professional' | 'client'
  ): Promise<{
    success: boolean;
    messages?: any[];
    error?: string;
  }> {
    try {
      const { data: messages, error } = await supabase
        .from('anonymous_messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Erreur récupération messages:', error);
        return {
          success: false,
          error: 'Erreur lors de la récupération des messages'
        };
      }

      // Filtrer les messages selon le statut
      const filteredMessages = messages?.map(msg => ({
        ...msg,
        content: msg.is_anonymous && msg.sender_type !== userType ? '[Message anonyme]' : msg.content,
        senderType: msg.is_anonymous && msg.sender_type !== userType ? 'anonymous' : msg.sender_type
      }));

      return {
        success: true,
        messages: filteredMessages
      };

    } catch (error) {
      console.error('❌ Erreur service getMatchMessages:', error);
      return {
        success: false,
        error: 'Erreur serveur lors de la récupération'
      };
    }
  },

  /**
   * Logger la modération pour analyse
   */
  private async logModeration(
    content: string,
    patterns: string[],
    detectedContent: string[],
    confidence: number
  ): Promise<void> {
    try {
      // Pour l'instant, juste console.log
      // À implémenter : insertion dans moderation_logs
      console.log('🚨 MODÉRATION DÉTECTÉE:', {
        patterns,
        detectedContent,
        confidence,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Erreur log modération:', error);
    }
  },

  /**
   * Marquer un match pour révision admin
   */
  private async flagMatchForReview(matchId: string): Promise<void> {
    try {
      // Mettre à jour le statut du match
      await supabase
        .from('match_payments')
        .update({
          status: 'flagged',
          updated_at: new Date().toISOString()
        })
        .eq('id', matchId);
    } catch (error) {
      console.error('❌ Erreur flag match:', error);
    }
  },

  /**
   * Notifier les utilisateurs de la révélation des coordonnées
   */
  private async notifyContactReveal(matchId: string): Promise<void> {
    try {
      // Récupérer les informations du match
      const { data: match } = await supabase
        .from('match_payments')
        .select(`
          *,
          projects!inner(
            client_id,
            title
          ),
          professionals!inner(
            user_id,
            company_name
          )
        `)
        .eq('id', matchId)
        .single();

      if (match) {
        // Envoyer des notifications
        // À implémenter avec votre service de notification
        console.log('📧 NOTIFICATION RÉVÉLATION COORDONNÉES:', {
          matchId,
          client: match.projects.client_id,
          professional: match.professionals.user_id
        });
      }
    } catch (error) {
      console.error('❌ Erreur notification révélation:', error);
    }
  }
};

export type { MessageContent, ModerationResult, MessageLimitResult };
