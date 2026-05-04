import { useState, useCallback } from 'react';
import { anonymousMessagingService } from '@/services/anonymousMessagingService';

interface UseMessagingReturn {
  messages: any[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  sendMessage: (content: string, senderType: 'professional' | 'client') => Promise<boolean>;
  loadMessages: () => Promise<void>;
  revealContacts: () => Promise<boolean>;
  remainingMessages: number;
  isRevealed: boolean;
}

/**
 * Hook pour gérer la messagerie anonyme
 */
export function useAnonymousMessaging(
  matchId: string | null,
  userId: string | null,
  userType: 'professional' | 'client'
): UseMessagingReturn {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingMessages, setRemainingMessages] = useState(3);
  const [isRevealed, setIsRevealed] = useState(false);

  const loadMessages = useCallback(async () => {
    if (!matchId || !userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await anonymousMessagingService.getMatchMessages(
        matchId,
        userId,
        userType
      );

      if (result.success && result.messages) {
        setMessages(result.messages);
        
        // Vérifier si les coordonnées sont révélées
        const revealed = result.messages.some(m => !m.is_anonymous || m.revealed_at);
        setIsRevealed(revealed);

        // Calculer les messages restants
        const userMessages = result.messages.filter(m => m.sender_type === userType);
        setRemainingMessages(Math.max(0, 3 - userMessages.length));
      } else {
        setError(result.error || 'Erreur lors du chargement des messages');
      }
    } catch (err) {
      setError('Erreur lors du chargement des messages');
    } finally {
      setIsLoading(false);
    }
  }, [matchId, userId, userType]);

  const sendMessage = useCallback(async (
    content: string,
    senderType: 'professional' | 'client'
  ): Promise<boolean> => {
    if (!matchId || !userId || !content.trim()) return false;

    setIsSending(true);
    setError(null);

    try {
      const result = await anonymousMessagingService.sendMessage({
        content: content.trim(),
        senderType,
        senderId: userId,
        matchId
      });

      if (result.success) {
        // Recharger les messages
        await loadMessages();
        return true;
      } else {
        setError(result.error || 'Erreur lors de l\'envoi');
        return false;
      }
    } catch (err) {
      setError('Erreur lors de l\'envoi du message');
      return false;
    } finally {
      setIsSending(false);
    }
  }, [matchId, userId, loadMessages]);

  const revealContacts = useCallback(async (): Promise<boolean> => {
    if (!matchId) return false;

    setIsLoading(true);
    setError(null);

    try {
      const result = await anonymousMessagingService.revealContactInfo(matchId);

      if (result.success) {
        setIsRevealed(true);
        await loadMessages();
        return true;
      } else {
        setError(result.error || 'Erreur lors de la révélation');
        return false;
      }
    } catch (err) {
      setError('Erreur lors de la révélation des coordonnées');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [matchId, loadMessages]);

  return {
    messages,
    isLoading,
    isSending,
    error,
    sendMessage,
    loadMessages,
    revealContacts,
    remainingMessages,
    isRevealed
  };
}

export type { UseMessagingReturn };
