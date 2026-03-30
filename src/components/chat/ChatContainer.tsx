import React, { useState, useEffect } from 'react';
import { chatService } from '@/services/chatService';
import { supabase } from '@/integrations/supabase/client';
import ChatLimited from './ChatLimited';
import ChatFull from './ChatFull';
import PaymentRequired from './PaymentRequired';

interface ChatContainerProps {
  projectId: string;
  userId: string;
  clientId: string;
  professionalId: string;
  estimation: number;
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

const ChatContainer: React.FC<ChatContainerProps> = ({
  projectId,
  userId,
  clientId,
  professionalId,
  estimation,
  otherUserInfo
}) => {
  const [conversation, setConversation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    loadConversation();
  }, [projectId, clientId, professionalId]);

  const loadConversation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Vérifier si le paiement a été effectué
      const { data: payment } = await supabase
        .from('match_payments')
        .select('status')
        .eq('project_id', projectId)
        .eq('professional_id', professionalId)
        .maybeSingle();
      
      const paiementEffectue = payment?.status === 'paid';
      
      if (paiementEffectue) {
        // Chat complet
        const result = await chatService.getOrCreateConversation(projectId, professionalId);
        if (result.data) {
          setConversation(result.data);
        }
      } else {
        // Chat limité
        const result = await chatService.getOrCreateConversation(projectId, professionalId);
        if (result.data) {
          setConversation(result.data);
        }
      }
    } catch (err) {
      console.error('Erreur chargement conversation:', err);
      setError('Impossible de charger la conversation');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    loadConversation(); // Recharger avec le chat complet
  };

  const handlePaymentRequired = () => {
    setShowPayment(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-red-600 mb-2">Erreur de chargement</div>
          <div className="text-sm text-gray-600">{error}</div>
          <button 
            onClick={loadConversation}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (showPayment) {
    return (
      <PaymentRequired
        clientId={clientId}
        professionalId={professionalId}
        projectId={projectId}
        estimation={estimation}
        onPaymentSuccess={handlePaymentSuccess}
      />
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-gray-600 mb-2">Aucune conversation active</div>
          <div className="text-sm text-gray-500">
            La conversation sera disponible une fois le professionnel sélectionné
          </div>
        </div>
      </div>
    );
  }

  // Si la conversation est en phase active, utiliser le chat complet
  if (conversation.phase === 'active') {
    return (
      <ChatFull
        conversationId={conversation.id}
        userId={userId}
        clientId={clientId}
        professionalId={professionalId}
        otherUserInfo={otherUserInfo}
      />
    );
  }

  // Sinon, utiliser le chat limité
  return (
    <ChatLimited
      conversationId={conversation.id}
      userId={userId}
      projectId={projectId}
      estimation={estimation}
      clientId={clientId}
      professionalId={professionalId}
      onPaymentRequired={handlePaymentRequired}
    />
  );
};

export default ChatContainer;
