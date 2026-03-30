import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageSquare, 
  Send, 
  Lock, 
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Shield
} from 'lucide-react';
import { chatService } from '@/services/chatService';

interface ChatLimitedProps {
  conversationId: string;
  userId: string;
  projectId: string;
  estimation: number;
  clientId: string;
  professionalId: string;
  onPaymentRequired?: () => void;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name?: string;
  created_at: string;
  is_read: boolean;
}

const ChatLimited: React.FC<ChatLimitedProps> = ({
  conversationId,
  userId,
  projectId,
  estimation,
  clientId,
  professionalId,
  onPaymentRequired
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [canSend, setCanSend] = useState(true);
  const [sendReason, setSendReason] = useState('');
  const [messagesRestants, setMessagesRestants] = useState(3);

  useEffect(() => {
    if (conversationId) {
      loadMessages();
      checkCanSend();
    }
  }, [conversationId, userId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const result = await chatService.getConversationMessages(conversationId);
      if (result.data) {
        const formattedMessages: Message[] = result.data.map(msg => ({
          id: msg.id,
          content: msg.content,
          sender_id: msg.sender_id,
          sender_name: msg.sender?.full_name || undefined,
          created_at: msg.created_at,
          is_read: msg.is_read
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCanSend = async () => {
    try {
      const result = await chatService.canSendMessage(conversationId, userId);
      setCanSend(result.canSend);
      setSendReason(result.reason || '');
      setMessagesRestants(result.canSend ? 3 - messages.filter(m => m.sender_id === userId).length : 0);
    } catch (error) {
      console.error('Erreur vérification envoi:', error);
      setCanSend(false);
      setSendReason('Erreur lors de la vérification');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !canSend) return;

    try {
      setSending(true);
      
      // Envoyer le message avec vérification des limites
      const result = await chatService.sendMessage(conversationId, newMessage.trim());

      if (result.data) {
        const newMsg: Message = {
          id: result.data.id,
          content: result.data.content,
          sender_id: result.data.sender_id,
          sender_name: 'Moi',
          created_at: result.data.created_at,
          is_read: result.data.is_read
        };
        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
        await checkCanSend(); // Mettre à jour le statut
      } else {
        console.error('Erreur envoi message:', result.error);
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isMyMessage = (message: Message) => message.sender_id === userId;

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border">
      {/* En-tête du chat */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold">Chat limité</h3>
            <Badge variant="secondary" className="text-xs">
              {messagesRestants} message{messagesRestants > 1 ? 's' : ''} restant{messagesRestants > 1 ? 's' : ''}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Lock className="w-4 h-4" />
            <span>3 messages max</span>
          </div>
        </div>
      </div>

      {/* Alertes de statut */}
      {!canSend && (
        <Alert className="mx-4 mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {sendReason}
          </AlertDescription>
        </Alert>
      )}

      {messagesRestants === 1 && (
        <Alert className="mx-4 mt-4 border-yellow-200 bg-yellow-50">
          <Clock className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-700">
            Dernier message gratuit ! Débloquez le chat complet pour continuer la conversation.
          </AlertDescription>
        </Alert>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Aucun message pour le moment</p>
            <p className="text-sm">Commencez la conversation avec 3 messages gratuits</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${isMyMessage(message) ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  isMyMessage(message)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {!isMyMessage(message) && (
                  <div className="text-xs font-medium mb-1 opacity-75">
                    {message.sender_name}
                  </div>
                )}
                <div className="text-sm break-words">{message.content}</div>
                <div
                  className={`text-xs mt-1 ${
                    isMyMessage(message) ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {formatTime(message.created_at)}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Message de limitation atteinte */}
        {!canSend && messagesRestants === 0 && (
          <div className="text-center py-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <Lock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <h4 className="font-semibold text-orange-800 mb-2">
                Limite de messages atteinte
              </h4>
              <p className="text-sm text-orange-700 mb-3">
                Vous avez utilisé vos 3 messages gratuits. Débloquez le chat complet pour continuer la conversation.
              </p>
              <Button 
                onClick={onPaymentRequired}
                className="bg-orange-600 hover:bg-orange-700 text-white"
                size="sm"
              >
                <Shield className="w-4 h-4 mr-2" />
                Débloquer le chat complet
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Zone de saisie */}
      {canSend && (
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tapez votre message..."
              disabled={sending || !canSend}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending || !canSend}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sending ? (
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          {/* Indicateur de messages restants */}
          <div className="mt-2 text-xs text-gray-500 text-center">
            {messagesRestants} message{messagesRestants > 1 ? 's' : ''} gratuit{messagesRestants > 1 ? 's' : ''} restant{messagesRestants > 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Footer avec options */}
      <div className="p-3 border-t bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3" />
            <span>Chat sécurisé</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-3 h-3" />
            <span>Mode limité</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatLimited;
