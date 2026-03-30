import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  Send, 
  CheckCircle,
  Phone,
  Mail,
  MapPin,
  Building,
  Shield,
  Paperclip,
  Smile
} from 'lucide-react';
import { chatService } from '@/services/chatService';

interface ChatFullProps {
  conversationId: string;
  userId: string;
  clientId: string;
  professionalId: string;
  otherUserInfo: {
    id: string;
    full_name: string;
    email: string;
    company_name?: string;
    phone?: string;
    address?: string;
    siret?: string;
  };
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name?: string;
  created_at: string;
  is_read: boolean;
  attachments?: Array<{
    id: string;
    filename: string;
    url: string;
    type: string;
  }>;
}

const ChatFull: React.FC<ChatFullProps> = ({
  conversationId,
  userId,
  clientId,
  professionalId,
  otherUserInfo
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (conversationId) {
      loadMessages();
      markAsRead();
      
      // S'abonner aux nouveaux messages
      const subscription = chatService.subscribeToConversation(
        conversationId,
        (newMessage) => {
          const messageWithSender: Message = {
            id: newMessage.id,
            content: newMessage.content,
            sender_id: newMessage.sender_id,
            sender_name: newMessage.sender_id === userId ? 'Moi' : otherUserInfo.full_name,
            created_at: newMessage.created_at,
            is_read: newMessage.is_read,
            attachments: newMessage.attachments ? [] : undefined
          };
          setMessages(prev => [...prev, messageWithSender]);
          if (newMessage.sender_id !== userId) {
            markAsRead();
          }
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [conversationId, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const result = await chatService.getConversationMessages(conversationId);
      if (result.data) {
        const formattedMessages: Message[] = result.data.map(msg => ({
          id: msg.id,
          content: msg.content,
          sender_id: msg.sender_id,
          sender_name: msg.sender?.full_name || (msg.sender_id === userId ? 'Moi' : otherUserInfo.full_name),
          created_at: msg.created_at,
          is_read: msg.is_read,
          attachments: undefined
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await chatService.markAsRead(conversationId);
    } catch (error) {
      console.error('Erreur marquer comme lu:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      
      const result = await chatService.sendMessage(conversationId, newMessage.trim());
      
      if (result.data) {
        const newMsg: Message = {
          id: result.data.id,
          content: result.data.content,
          sender_id: result.data.sender_id,
          sender_name: 'Moi',
          created_at: result.data.created_at,
          is_read: result.data.is_read,
          attachments: undefined
        };
        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
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

  const handleFileAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Implémenter l'envoi de fichiers
      console.log('Fichier à attacher:', files[0]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui';
    }
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  };

  const isMyMessage = (message: Message) => message.sender_id === userId;
  const isProfessional = userId === professionalId;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      const date = formatDate(message.created_at);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border">
      {/* En-tête du chat */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={`/avatars/${otherUserInfo.id}.jpg`} />
              <AvatarFallback className="bg-blue-600 text-white">
                {getInitials(otherUserInfo.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900">{otherUserInfo.full_name}</h3>
              <p className="text-sm text-gray-600">
                {otherUserInfo.company_name || 'Professionnel'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600">Chat complet</span>
                <Shield className="w-3 h-3 text-blue-600" />
                <span className="text-xs text-blue-600">Vérifié</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Informations complètes */}
      <div className="px-4 py-3 bg-gray-50 border-b">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">
                {otherUserInfo.company_name || 'Indépendant'}
              </span>
            </div>
            {otherUserInfo.siret && (
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">SIRET: {otherUserInfo.siret}</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            {otherUserInfo.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">{otherUserInfo.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">{otherUserInfo.email}</span>
            </div>
          </div>
        </div>
        {otherUserInfo.address && (
          <div className="mt-2 pt-2 border-t flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">{otherUserInfo.address}</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {Object.entries(messageGroups).map(([date, dateMessages]) => (
          <div key={date} className="mb-4">
            <div className="text-center text-xs text-gray-500 mb-3">
              <span className="bg-gray-100 px-3 py-1 rounded-full">{date}</span>
            </div>
            <div className="space-y-3">
              {dateMessages.map((message, index) => (
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
                    
                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center gap-2 p-2 bg-white/10 rounded"
                          >
                            <Paperclip className="w-3 h-3" />
                            <span className="text-xs truncate">{attachment.filename}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div
                      className={`text-xs mt-1 flex items-center gap-1 ${
                        isMyMessage(message) ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      <span>{formatTime(message.created_at)}</span>
                      {isMyMessage(message) && (
                        <CheckCircle className="w-3 h-3" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {/* Indicateur d'écriture */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Zone de saisie */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFileAttach}
            className="text-gray-500 hover:text-gray-700"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tapez votre message..."
            disabled={sending}
            className="flex-1"
          />
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700"
          >
            <Smile className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
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
        
        {/* Input caché pour les fichiers */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
        />
      </div>

      {/* Footer */}
      <div className="p-3 border-t bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3" />
            <span>Chat sécurisé et complet</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3" />
            <span>Messages lus</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatFull;
