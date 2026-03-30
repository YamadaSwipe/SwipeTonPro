'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Paperclip, Send, Phone, Video, MoreVertical, Check, CheckCheck } from 'lucide-react';
import { useRealtimeMessaging } from '@/hooks/useRealtimeMessaging';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface EnhancedChatProps {
  conversationId: string;
  currentUserId: string;
  otherUser: {
    id: string;
    full_name: string;
    avatar_url?: string;
    role: string;
  };
}

export default function EnhancedChat({ conversationId, currentUserId, otherUser }: EnhancedChatProps) {
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    typingUsers,
    onlineUsers,
    isConnected,
    sendMessage,
    handleTyping
  } = useRealtimeMessaging(conversationId, currentUserId);

  const isUserOnline = onlineUsers.some(user => user.user_id === otherUser.id);
  const isTyping = typingUsers.some(user => user.user_id === otherUser.id);

  // Auto-scroll vers le dernier message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() && attachedFiles.length === 0) return;

    try {
      // Upload des fichiers si nécessaire
      const fileAttachments = [];
      for (const file of attachedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/upload/chat-file', {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          const data = await response.json();
          fileAttachments.push(data);
        }
      }

      await sendMessage(message, fileAttachments);
      
      setMessage('');
      setAttachedFiles([]);
      
    } catch (error) {
      console.error('Erreur envoi message:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles(prev => [...prev, ...files].slice(0, 5)); // Max 5 fichiers
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isMessageRead = (msg: any) => {
    return msg.read_at && msg.sender_id === currentUserId;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={otherUser.avatar_url} />
                <AvatarFallback>
                  {otherUser.full_name?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                isUserOnline ? 'bg-green-500' : 'bg-gray-400'
              }`} />
            </div>
            <div>
              <h3 className="font-semibold">{otherUser.full_name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{isUserOnline ? 'En ligne' : 'Hors ligne'}</span>
                {isTyping && (
                  <span className="text-blue-500">est en train d'écrire...</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Video className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Status de connexion */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>{isConnected ? 'Connecté' : 'Reconnexion...'}</span>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 p-0">
        <ScrollArea ref={scrollAreaRef} className="h-full px-4">
          <div className="space-y-4 py-4">
            {messages.map((msg) => {
              const isOwn = msg.sender_id === currentUserId;
              
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        isOwn 
                          ? 'bg-orange-500 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {/* Fichiers attachés */}
                      {msg.file_attachments && msg.file_attachments.length > 0 && (
                        <div className="space-y-2 mb-2">
                          {msg.file_attachments.map((file: any, index: number) => (
                            <div key={index} className="flex items-center gap-2 bg-white/20 rounded p-2">
                              <Paperclip className="w-4 h-4" />
                              <span className="text-sm truncate">{file.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Contenu du message */}
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                      
                      {/* Timestamp et statut de lecture */}
                      <div className={`flex items-center gap-1 mt-1 text-xs ${
                        isOwn ? 'text-orange-100' : 'text-gray-500'
                      }`}>
                        <span>
                          {formatDistanceToNow(new Date(msg.created_at), {
                            addSuffix: true,
                            locale: fr
                          })}
                        </span>
                        {isOwn && (
                          <span className="ml-1">
                            {isMessageRead(msg) ? (
                              <CheckCheck className="w-3 h-3" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Indicateur de typing */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>

      {/* Zone de saisie */}
      <div className="p-4 border-t">
        {/* Fichiers attachés */}
        {attachedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                <Paperclip className="w-4 h-4" />
                <span className="text-sm truncate max-w-xs">{file.name}</span>
                <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTyping();
              }}
              placeholder="Tapez votre message..."
              className="resize-none"
              disabled={!isConnected}
            />
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
          />
          
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={!isConnected}
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          
          <Button
            type="submit"
            size="icon"
            disabled={!isConnected || (!message.trim() && attachedFiles.length === 0)}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
