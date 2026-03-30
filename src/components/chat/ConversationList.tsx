import { useEffect, useState } from "react";
import { chatService } from "@/services/chatService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface ConversationListProps {
  onSelectConversation: (conversationId: string) => void;
  selectedId?: string;
}

export function ConversationList({ onSelectConversation, selectedId }: ConversationListProps) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = async () => {
    const { data } = await chatService.getUserConversations();
    if (data) setConversations(data);
    setLoading(false);
  };

  useEffect(() => {
    loadConversations();
    
    // Subscribe to updates
    const subscription = chatService.subscribeToUserConversations(() => {
      loadConversations();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Aucune conversation</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conv) => {
        const otherUser = conv.professional || conv.client; // Fallback logic depending on view, handled by service mostly
        const displayName = conv.professional?.company_name || conv.client?.full_name || "Utilisateur";
        
        return (
          <Button
            key={conv.id}
            variant={selectedId === conv.id ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start h-auto py-3 px-4",
              selectedId === conv.id ? "bg-accent" : ""
            )}
            onClick={() => onSelectConversation(conv.id)}
          >
            <div className="flex items-start gap-3 w-full">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-semibold truncate text-sm">{displayName}</span>
                  {conv.last_message_at && (
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                      {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true, locale: fr })}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {conv.project?.title || "Projet sans titre"}
                </p>
              </div>
            </div>
          </Button>
        );
      })}
    </div>
  );
}