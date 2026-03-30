import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
type Message = Database["public"]["Tables"]["messages"]["Row"];
type ConversationInsert = Database["public"]["Tables"]["conversations"]["Insert"];
type MessageInsert = Database["public"]["Tables"]["messages"]["Insert"];

export const chatService = {
  /**
   * Get or create a conversation between client and professional
   */
  async getOrCreateConversation(
    projectId: string,
    professionalId: string
  ): Promise<{ data: Conversation | null; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: new Error("Non authentifié") };
      }

      // Check if conversation exists
      const { data: existing, error: fetchError } = await supabase
        .from("conversations")
        .select("*")
        .eq("project_id", projectId)
        .eq("professional_id", professionalId)
        .single();

      if (existing) {
        return { data: existing, error: fetchError };
      }

      // Get project owner (client)
      const { data: project } = await supabase
        .from("projects")
        .select("client_id")
        .eq("id", projectId)
        .single();

      if (!project) {
        return { data: null, error: new Error("Projet non trouvé") };
      }

      // Create new conversation — phase anonymous for mini-chat limité
      const newConversation: ConversationInsert = {
        project_id: projectId,
        client_id: project.client_id,
        professional_id: professionalId,
        status: "anonymous",
        phase: "anonymous",
        client_message_count: 0,
        pro_message_count: 0,
      } as any;

      const { data, error } = await supabase
        .from("conversations")
        .insert(newConversation)
        .select()
        .single();

      return { data, error };
    } catch (err) {
      console.error("Error in getOrCreateConversation:", err);
      return { data: null, error: err as Error };
    }
  },

  /**
   * Get all conversations for current user
   */
  async getUserConversations(): Promise<{
    data: (Conversation & {
      project: { title: string };
      client: { full_name: string };
      professional: { company_name: string };
    })[] | null;
    error: Error | null;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: new Error("Non authentifié") };
      }

      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          project:projects!conversations_project_id_fkey(title),
          client:profiles!conversations_client_id_fkey(full_name),
          professional:profiles!conversations_professional_id_fkey(
            full_name,
            professionals(company_name)
          )
        `)
        .or(`client_id.eq.${user.id},professional_id.eq.${user.id}`)
        .order("last_message_at", { ascending: false });

      // Transform data to flatten professional info
      const transformedData = data?.map(conv => ({
        ...conv,
        professional: {
          company_name: (conv.professional as any)?.professionals?.company_name || "Professionnel"
        }
      }));

      return { data: transformedData as any, error };
    } catch (err) {
      console.error("Error in getUserConversations:", err);
      return { data: null, error: err as Error };
    }
  },

  /**
   * Get messages for a conversation
   */
  async getConversationMessages(
    conversationId: string
  ): Promise<{
    data: (Message & { sender: { full_name: string } })[] | null;
    error: Error | null;
  }> {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(full_name)
        `)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      return { data: data as any, error };
    } catch (err) {
      console.error("Error in getConversationMessages:", err);
      return { data: null, error: err as Error };
    }
  },

  /**
   * Send a message
   */
  async sendMessage(
    conversationId: string,
    content: string,
    attachments?: any[]
  ): Promise<{ data: Message | null; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: new Error("Non authentifié") };
      }

      const newMessage: MessageInsert = {
        conversation_id: conversationId,
        sender_id: user.id,
        content,
        attachments: attachments || []
      };

      const { data, error } = await supabase
        .from("messages")
        .insert(newMessage)
        .select()
        .single();

      return { data, error };
    } catch (err) {
      console.error("Error in sendMessage:", err);
      return { data: null, error: err as Error };
    }
  },

  /**
   * Mark messages as read
   */
  async markAsRead(conversationId: string): Promise<{ error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { error: new Error("Non authentifié") };
      }

      // Get conversation to determine which side user is on
      const { data: conversation } = await supabase
        .from("conversations")
        .select("client_id, professional_id")
        .eq("id", conversationId)
        .single();

      if (!conversation) {
        return { error: new Error("Conversation non trouvée") };
      }

      // Mark unread messages as read (where user is NOT the sender)
      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .eq("is_read", false)
        .neq("sender_id", user.id);

      return { error };
    } catch (err) {
      console.error("Error in markAsRead:", err);
      return { error: err as Error };
    }
  },

  /**
   * Subscribe to new messages in a conversation (Realtime)
   */
  subscribeToConversation(
    conversationId: string,
    callback: (message: Message) => void
  ) {
    return supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          callback(payload.new as Message);
        }
      )
      .subscribe();
  },

  /**
   * Subscribe to conversation updates (Realtime)
   */
  subscribeToUserConversations(callback: () => void) {
    return supabase
      .channel("user-conversations")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations"
        },
        () => {
          callback();
        }
      )
      .subscribe();
  },

  /**
   * Passer une conversation en mode actif après match payé
   */
  async activateConversation(conversationId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from("conversations")
        .update({ 
          phase: "active",
          status: "active",
          matched_at: new Date().toISOString()
        })
        .eq("id", conversationId);
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  },

  /**
   * Vérifier si un utilisateur peut envoyer un message (limite anonyme)
   */
  async canSendMessage(conversationId: string, userId: string): Promise<{ canSend: boolean; reason?: string }> {
    try {
      const { data: conv } = await supabase
        .from("conversations")
        .select("phase, client_id, client_message_count, pro_message_count")
        .eq("id", conversationId)
        .single();

      if (!conv) return { canSend: false, reason: "Conversation introuvable" };
      if ((conv as any)?.phase !== "anonymous") return { canSend: true };

      const MAX = 3;
      const isClient = (conv as any)?.client_id === userId;
      const messageCount = isClient ? (conv as any)?.client_message_count : (conv as any)?.pro_message_count;
      
      if (messageCount >= MAX) {
        return { canSend: false, reason: "Limite de messages anonymes atteinte" };
      }

      return { canSend: true };
    } catch (error) {
      console.error("Error in canSendMessage:", error);
      return { canSend: false, reason: "Erreur technique" };
    }
  }
};
