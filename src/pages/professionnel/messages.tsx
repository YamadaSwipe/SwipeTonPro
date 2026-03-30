import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { authService } from "@/services/authService";
import type { Database } from "@/integrations/supabase/types";
import Link from "next/link";

type Conversation = Database["public"]["Tables"]["conversations"]["Row"] & {
  project: { title: string };
  client: { full_name: string };
  professional: { company_name: string };
};

export default function MessagesPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  const loadUser = async () => {
    const session = await authService.getCurrentSession();
    if (session?.user) {
      setCurrentUserId(session.user.id);
    }
  };

  useEffect(() => {
    loadUser();
  }, [loadUser]); // Added missing dependency

  return (
    <ProtectedRoute allowedRoles={["professional"]}>
      <SEO title="Messagerie - SwipeTonPro" />
      <div className="min-h-screen bg-gray-50">
        <header className="border-b border-border bg-surface-elevated/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/professionnel/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour au tableau de bord
              </Button>
            </Link>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Messagerie</h1>
            <p className="text-text-secondary">
              Communiquez en temps réel avec vos clients
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <ConversationList
                onSelectConversation={setSelectedConversationId}
                selectedId={selectedConversationId || undefined}
              />
            </div>

            <div className="lg:col-span-2">
              {selectedConversationId ? (
                <ChatWindow
                  conversationId={selectedConversationId}
                />
              ) : (
                <div className="h-[600px] flex items-center justify-center border-2 border-dashed border-border rounded-lg">
                  <p className="text-text-secondary">
                    Sélectionnez une conversation pour commencer
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}