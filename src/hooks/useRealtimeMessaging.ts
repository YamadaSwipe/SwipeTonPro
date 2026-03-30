'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  file_attachments?: any[];
  read_at?: string;
  sender?: {
    full_name: string;
    avatar_url?: string;
    role: string;
  };
}

interface TypingUser {
  user_id: string;
  conversation_id: string;
  is_typing: boolean;
  timestamp: number;
}

interface OnlineUser {
  user_id: string;
  last_seen: string;
  is_online: boolean;
}

export function useRealtimeMessaging(conversationId: string, currentUserId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const channelRef = useRef<any>(null);

  // Marquer les messages comme lus
  const markAsRead = useCallback(async (messageIds: string[]) => {
    try {
      await (supabase as any)
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', messageIds)
        .eq('conversation_id', conversationId)
        .neq('sender_id', currentUserId);
    } catch (error) {
      console.error('Erreur marquage messages lus:', error);
    }
  }, [conversationId, currentUserId]);

  // Envoyer un message
  const sendMessage = useCallback(async (content: string, fileAttachments?: any[]) => {
    try {
      const { data, error } = await (supabase as any)
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: content.trim(),
          file_attachments: fileAttachments || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(full_name, avatar_url, role)
        `)
        .single();

      if (error) throw error;

      // Notifier le destinataire
      if (data) {
        await (supabase as any)
          .from('notifications')
          .insert({
            user_id: data.conversation_id !== currentUserId ? data.conversation_id : currentUserId,
            type: 'new_message',
            title: 'Nouveau message',
            message: `Vous avez reçu un message de ${data.sender?.full_name}`,
            data: {
              conversation_id: conversationId,
              message_id: data.id
            },
            created_at: new Date().toISOString(),
            read: false
          });
      }

      return data;
    } catch (error) {
      console.error('Erreur envoi message:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive"
      });
      throw error;
    }
  }, [conversationId, currentUserId, toast]);

  // Indiquer que l'utilisateur est en train d'écrire
  const setTyping = useCallback((isTyping: boolean) => {
    // Envoyer l'indicateur de typing via Supabase Realtime
    const channel = supabase.channel(`typing_${conversationId}`);
    
    if (isTyping) {
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: currentUserId,
          conversation_id: conversationId,
          is_typing: true,
          timestamp: Date.now()
        }
      });
    } else {
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: currentUserId,
          conversation_id: conversationId,
          is_typing: false,
          timestamp: Date.now()
        }
      });
    }
  }, [conversationId, currentUserId]);

  // Gérer le typing avec timeout
  const handleTyping = useCallback(() => {
    setTyping(true);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 3000);
  }, [setTyping]);

  // Charger les messages initiaux
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('messages')
          .select(`
            *,
            sender:profiles!messages_sender_id_fkey(full_name, avatar_url, role)
          `)
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        setMessages(data || []);
        
        // Marquer les messages non lus comme lus
        const unreadMessages = data?.filter((msg: Message) => 
          !msg.read_at && msg.sender_id !== currentUserId
        );
        
        if (unreadMessages && unreadMessages.length > 0) {
          markAsRead(unreadMessages.map((msg: Message) => msg.id));
        }
      } catch (error) {
        console.error('Erreur chargement messages:', error);
      }
    };

    if (conversationId) {
      loadMessages();
    }
  }, [conversationId, currentUserId, markAsRead]);

  // Configuration du channel Supabase Realtime
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase.channel(`conversation_${conversationId}`);

    // Écouter les nouveaux messages
    channel
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        }, 
        async (payload) => {
          const newMessage = payload.new as Message;
          
          // Charger les infos du sender
          const { data: senderData } = await (supabase as any)
            .from('profiles')
            .select('full_name, avatar_url, role')
            .eq('id', newMessage.sender_id)
            .single();

          const messageWithSender = {
            ...newMessage,
            sender: senderData
          };

          setMessages(prev => [...prev, messageWithSender]);

          // Marquer comme lu si ce n'est pas notre message
          if (newMessage.sender_id !== currentUserId) {
            markAsRead([newMessage.id]);
            
            // Notification sonore (optionnel)
            if (typeof window !== 'undefined' && 'Audio' in window) {
              const audio = new Audio('/notification.mp3');
              audio.volume = 0.3;
              audio.play().catch(() => {}); // Ignorer les erreurs de lecture
            }
          }
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          setMessages(prev => 
            prev.map(msg => 
              msg.id === updatedMessage.id ? updatedMessage : msg
            )
          );
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Écouter les indicateurs de typing
    const typingChannel = supabase.channel(`typing_${conversationId}`);
    
    typingChannel.on('broadcast', { event: 'typing' }, (payload) => {
      const typingData = payload.payload as TypingUser;
      
      if (typingData.user_id !== currentUserId) {
        setTypingUsers(prev => {
          const filtered = prev.filter(u => u.user_id !== typingData.user_id);
          
          if (typingData.is_typing) {
            return [...filtered, typingData];
          } else {
            return filtered;
          }
        });

        // Auto-remove typing indicator after 5 seconds
        if (typingData.is_typing) {
          setTimeout(() => {
            setTypingUsers(prev => 
              prev.filter(u => u.user_id !== typingData.user_id)
            );
          }, 5000);
        }
      }
    }).subscribe();

    // Écouter le statut online/offline
    const presenceChannel = supabase.channel('online_users');
    
    presenceChannel.on('presence', { event: 'sync' }, () => {
      const newState = presenceChannel.presenceState();
      const onlineUsersList: OnlineUser[] = [];
      
      Object.keys(newState).forEach(userId => {
        const presences = newState[userId];
        if (presences && presences.length > 0) {
          onlineUsersList.push({
            user_id: userId,
            last_seen: new Date().toISOString(),
            is_online: true
          });
        }
      });
      
      setOnlineUsers(onlineUsersList);
    }).subscribe();

    // S'inscrire comme online
    presenceChannel.track({
      user_id: currentUserId,
      online_at: new Date().toISOString()
    });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      typingChannel.unsubscribe();
      presenceChannel.unsubscribe();
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId, currentUserId, markAsRead]);

  return {
    messages,
    typingUsers,
    onlineUsers,
    isConnected,
    sendMessage,
    handleTyping,
    markAsRead
  };
}
