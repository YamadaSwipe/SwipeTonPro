import { useState, useEffect } from "react";

import { SEO } from "@/components/SEO";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Card } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function MessagesPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  return (
    <ProtectedRoute allowedRoles={["client"]}>
      <SEO title="Messagerie | SwipeTonPro" />
      
      <div className="container mx-auto py-8 max-w-6xl">
        <h1 className="text-3xl font-bold mb-6">Messagerie</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[600px]">
          {/* Liste des conversations */}
          <Card className="md:col-span-4 overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b bg-muted/30">
              <h2 className="font-semibold">Conversations</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <ConversationList 
                onSelectConversation={setSelectedConversationId} 
                selectedId={selectedConversationId || undefined}
              />
            </div>
          </Card>
          
          {/* Fenêtre de chat */}
          <div className="md:col-span-8 h-full">
            {selectedConversationId ? (
              <ChatWindow conversationId={selectedConversationId} />
            ) : (
              <Card className="h-full flex items-center justify-center p-8 text-center text-muted-foreground">
                <div>
                  <h3 className="text-lg font-medium mb-2">Sélectionnez une conversation</h3>
                  <p>Choisissez un échange dans la liste pour voir les messages</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}