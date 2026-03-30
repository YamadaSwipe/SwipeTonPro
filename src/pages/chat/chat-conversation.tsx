import { SEO } from "@/components/SEO";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { chatService } from "@/services/chatService";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Send, Lock, Unlock, FileText, CheckCircle,
  XCircle, AlertCircle, Wrench, Euro, Clock
} from "lucide-react";
import Link from "next/link";

const MAX_ANONYMOUS_MESSAGES = 3;

export default function ChatPage() {
  const router = useRouter();
  const { conversationId } = router.query;
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<"client" | "professional" | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<any>(null);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteForm, setQuoteForm] = useState({ amount: "", description: "", items: "" });
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (conversationId && typeof conversationId === "string") {
      init();
    }
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const init = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      setCurrentUser(user);

      // Charger la conversation
      const { data: conv, error: convErr } = await supabase
        .from("conversations")
        .select(`
          *,
          project:projects!conversations_project_id_fkey(id, title, category, city, estimated_budget_min, estimated_budget_max),
          client:profiles!conversations_client_id_fkey(id, full_name, email, phone),
          professional_profile:profiles!conversations_professional_id_fkey(id, full_name, email, phone)
        `)
        .eq("id", conversationId as string)
        .single();

      if (convErr || !conv) {
        toast({ title: "Conversation introuvable", variant: "destructive" });
        router.push("/particulier/dashboard");
        return;
      }
      setConversation(conv);

      // Déterminer le rôle
      const role = conv.client_id === user.id ? "client" : "professional";
      setUserRole(role);

      // Charger messages
      const { data: msgs } = await chatService.getConversationMessages(conversationId as string);
      setMessages(msgs || []);

      // Charger devis si existant
      if ((conv as any).quote_id) {
        const { data: q } = await (supabase as any).from("quotes").select("*").eq("id", (conv as any).quote_id).single();
        if (q) setQuote(q);
      }

      // Marquer comme lu
      await chatService.markAsRead(conversationId as string);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Realtime
  useEffect(() => {
    if (!conversationId) return;
    const channel = chatService.subscribeToConversation(conversationId as string, (msg) => {
      setMessages(prev => [...prev, msg]);
      chatService.markAsRead(conversationId as string);
    });
    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  // Comptage messages pour la limite anonyme
  const myMessageCount = userRole === "client"
    ? (conversation?.client_message_count || 0)
    : (conversation?.pro_message_count || 0);
  const isAnonymous = conversation?.phase === "anonymous";
  const limitReached = isAnonymous && myMessageCount >= MAX_ANONYMOUS_MESSAGES;
  const canSend = !limitReached && newMessage.trim().length > 0 && !sending;

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      await chatService.sendMessage(conversationId as string, newMessage.trim());
      setNewMessage("");
      // Recharger conversation pour compteurs
      const { data: conv } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId as string)
        .single();
      if (conv) setConversation(conv);
    } catch {
      toast({ title: "Erreur", description: "Message non envoyé.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  // Pro envoie un devis
  const handleSubmitQuote = async () => {
    if (!quoteForm.amount || isNaN(Number(quoteForm.amount))) return;
    setSubmittingQuote(true);
    try {
      const amount = parseFloat(quoteForm.amount);
      const { data: q, error } = await (supabase as any).from("quotes").insert({
        conversation_id: conversationId as string,
        project_id: conversation.project_id,
        professional_id: conversation.professional_id,
        client_id: conversation.client_id,
        amount,
        description: quoteForm.description,
        caution_percent: 30,
        status: "pending",
      }).select().single();

      if (error) throw error;

      // Lier le devis à la conversation
      await (supabase as any).from("conversations")
        .update({ quote_id: q.id, phase: "with_quote" })
        .eq("id", conversationId as string);

      // Message automatique dans le chat
      await chatService.sendMessage(
        conversationId as string,
        `📄 Devis envoyé : ${amount.toLocaleString("fr-FR")}€ — ${quoteForm.description}`
      );

      setQuote(q);
      setConversation((prev: any) => ({ ...prev, phase: "with_quote", quote_id: q.id }));
      setShowQuoteForm(false);

      // Notification au client
      await supabase.from("notifications").insert({
        user_id: conversation.client_id,
        title: "📄 Nouveau devis reçu",
        message: `Un devis de ${amount.toLocaleString("fr-FR")}€ vous a été envoyé pour votre projet.`,
        type: "new_quote",
        is_read: false,
        data: { conversation_id: conversationId, project_id: conversation.project_id },
      });

      toast({ title: "✅ Devis envoyé", description: "Le client a été notifié." });
    } catch (err) {
      toast({ title: "Erreur", description: "Impossible d'envoyer le devis.", variant: "destructive" });
    } finally {
      setSubmittingQuote(false);
    }
  };

  // Client accepte le devis → paiement caution Stripe
  const handleAcceptQuote = async () => {
    setProcessingPayment(true);
    try {
      const res = await fetch("/api/create-caution-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId: quote.id, conversationId }),
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      // Redirection vers Stripe Checkout
      window.location.href = url;
    } catch (err: any) {
      toast({ title: "Erreur paiement", description: err.message, variant: "destructive" });
      setProcessingPayment(false);
    }
  };

  // Client rejette le devis
  const handleRejectQuote = async () => {
    try {
      await (supabase as any).from("quotes").update({ status: "rejected" }).eq("id", quote.id);
      await chatService.sendMessage(conversationId as string, "❌ Le devis a été refusé.");
      setQuote((q: any) => ({ ...q, status: "rejected" }));
      toast({ title: "Devis refusé", description: "Le professionnel en sera informé." });
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  // Client confirme fin des travaux → libérer la caution au pro
  const handleReleasePayment = async () => {
    setProcessingPayment(true);
    try {
      const res = await fetch("/api/confirm-caution-release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId: quote.id, conversationId }),
      });
      const { success, error } = await res.json();
      if (error) throw new Error(error);

      await (supabase as any).from("conversations")
        .update({ phase: "completed", work_status: "completed" })
        .eq("id", conversationId as string);

      setConversation((prev: any) => ({ ...prev, phase: "completed", work_status: "completed" }));
      setQuote((q: any) => ({ ...q, status: "released" }));

      await chatService.sendMessage(conversationId as string, "✅ Travaux validés ! La caution a été versée au professionnel.");
      toast({ title: "✅ Travaux validés", description: "La caution a été versée au professionnel." });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setProcessingPayment(false);
    }
  };

  const getPhaseBadge = () => {
    const map: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      anonymous:  { label: "Échange anonyme", color: "bg-gray-100 text-gray-600", icon: <Lock className="w-3 h-3" /> },
      active:     { label: "Chat ouvert",      color: "bg-blue-50 text-blue-600",  icon: <Unlock className="w-3 h-3" /> },
      with_quote: { label: "Devis en attente", color: "bg-yellow-50 text-yellow-600", icon: <FileText className="w-3 h-3" /> },
      in_progress:{ label: "Travaux en cours", color: "bg-orange-50 text-orange-600", icon: <Wrench className="w-3 h-3" /> },
      completed:  { label: "Terminé",          color: "bg-green-50 text-green-600",  icon: <CheckCircle className="w-3 h-3" /> },
    };
    const phase = conversation?.phase || "anonymous";
    const cfg = map[phase] || map.anonymous;
    return (
      <Badge variant="outline" className={`flex items-center gap-1 ${cfg.color}`}>
        {cfg.icon} {cfg.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <SEO title="Chat | SwipeTonPro" />
      <div className="min-h-screen bg-gray-50 flex flex-col">

        {/* Header */}
        <div className="bg-white border-b shadow-sm sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
            <Link href={userRole === "client" ? "/particulier/dashboard" : "/professionnel/dashboard"}>
              <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">
                {isAnonymous
                  ? (userRole === "client" ? "Professionnel anonyme" : "Particulier anonyme")
                  : (userRole === "client"
                      ? conversation?.professional_profile?.full_name
                      : conversation?.client?.full_name)
                }
              </p>
              <p className="text-xs text-muted-foreground truncate">{conversation?.project?.title}</p>
            </div>
            <div className="flex items-center gap-2">
              {getPhaseBadge()}
              {isAnonymous && (
                <span className="text-xs text-muted-foreground">
                  {myMessageCount}/{MAX_ANONYMOUS_MESSAGES} msgs
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Banner anonyme */}
        {isAnonymous && (
          <div className="bg-gray-800 text-white text-center py-2 px-4 text-sm flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" />
            Échange anonyme — {MAX_ANONYMOUS_MESSAGES} messages max par partie. Matchez pour continuer librement.
          </div>
        )}

        {/* Devis Banner */}
        {quote && quote.status === "pending" && userRole === "client" && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-semibold text-yellow-800">
                    Devis reçu : {Number(quote.amount).toLocaleString("fr-FR")}€
                  </p>
                  <p className="text-xs text-yellow-700">
                    Caution sécurisée (30%) : {(quote.amount * 0.3).toLocaleString("fr-FR")}€
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50" onClick={handleRejectQuote}>
                  <XCircle className="w-4 h-4 mr-1" /> Refuser
                </Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleAcceptQuote} disabled={processingPayment}>
                  <Euro className="w-4 h-4 mr-1" />
                  {processingPayment ? "Redirection..." : "Payer la caution (30%)"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Travaux en cours — bouton validation */}
        {conversation?.phase === "in_progress" && userRole === "client" && (
          <div className="bg-orange-50 border-b border-orange-200 px-4 py-3">
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-orange-600" />
                <p className="text-sm font-medium text-orange-800">Travaux en cours — Validez quand c'est terminé</p>
              </div>
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleReleasePayment} disabled={processingPayment}>
                <CheckCircle className="w-4 h-4 mr-1" />
                {processingPayment ? "Traitement..." : "Valider la fin des travaux"}
              </Button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto max-w-3xl w-full mx-auto px-4 py-4 space-y-3">
          {messages.map((msg) => {
            const isMe = msg.sender_id === currentUser?.id;
            const isSystem = msg.sender_id === null || msg.content.startsWith("📄") || msg.content.startsWith("✅") || msg.content.startsWith("❌");

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center">
                  <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">{msg.content}</span>
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                  isMe ? "bg-orange-500 text-white rounded-br-sm" : "bg-white border rounded-bl-sm shadow-sm"
                }`}>
                  <p>{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? "text-orange-100" : "text-muted-foreground"}`}>
                    {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Zone de saisie */}
        <div className="bg-white border-t shadow-sm sticky bottom-0">
          <div className="max-w-3xl mx-auto px-4 py-3">

            {/* Bouton envoyer devis (pro seulement, phase active) */}
            {userRole === "professional" && !isAnonymous && !quote && conversation?.phase !== "completed" && (
              <div className="mb-3">
                {showQuoteForm ? (
                  <Card className="border-orange-200">
                    <CardContent className="p-4 space-y-3">
                      <p className="font-semibold text-sm">📄 Envoyer un devis</p>
                      <input
                        type="number"
                        placeholder="Montant total (€)"
                        value={quoteForm.amount}
                        onChange={e => setQuoteForm(f => ({ ...f, amount: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                      <Textarea
                        placeholder="Description des travaux..."
                        value={quoteForm.description}
                        onChange={e => setQuoteForm(f => ({ ...f, description: e.target.value }))}
                        rows={2}
                      />
                      <p className="text-xs text-muted-foreground">
                        Caution sécurisée (30%) que le client paiera : {quoteForm.amount ? (parseFloat(quoteForm.amount) * 0.3).toLocaleString("fr-FR") : "—"}€
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowQuoteForm(false)}>Annuler</Button>
                        <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white"
                          onClick={handleSubmitQuote} disabled={submittingQuote || !quoteForm.amount}>
                          {submittingQuote ? "Envoi..." : "Envoyer le devis"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => setShowQuoteForm(true)}>
                    <FileText className="w-4 h-4 mr-2" /> Envoyer un devis
                  </Button>
                )}
              </div>
            )}

            {limitReached ? (
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                <Lock className="w-5 h-5 mx-auto mb-2 text-gray-500" />
                <p className="text-sm font-medium text-gray-700">Limite de {MAX_ANONYMOUS_MESSAGES} messages atteinte</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {userRole === "client"
                    ? "Matchez avec ce professionnel pour continuer l'échange."
                    : "En attente que le particulier confirme le match."}
                </p>
                {userRole === "client" && (
                  <Button className="mt-3 bg-orange-500 hover:bg-orange-600 text-white" size="sm"
                    onClick={() => router.push(`/particulier/projects/${conversation?.project_id}/interests`)}>
                    Voir les professionnels →
                  </Button>
                )}
              </div>
            ) : conversation?.phase === "completed" ? (
              <p className="text-center text-sm text-muted-foreground py-2">✅ Projet terminé</p>
            ) : (
              <div className="flex gap-2 items-end">
                <Textarea
                  placeholder="Votre message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  rows={1}
                  className="flex-1 resize-none"
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                />
                <Button className="bg-orange-500 hover:bg-orange-600 text-white flex-shrink-0"
                  onClick={handleSend} disabled={!canSend}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
