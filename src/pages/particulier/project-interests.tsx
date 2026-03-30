import { SEO } from "@/components/SEO";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MessageSquare, CheckCircle, Star, Clock, Handshake } from "lucide-react";
import { matchingService } from "@/services/matchingService";
import { chatService } from "@/services/chatService";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import type { Database } from "@/integrations/supabase/types";

type ProjectInterest = Database["public"]["Tables"]["project_interests"]["Row"];

interface ProfessionalInfo {
  id: string;
  company_name: string;
  average_rating: number | null;
  specialties?: string[] | null;
  profile: { full_name: string; avatar_url?: string };
}

interface InterestWithPro extends ProjectInterest {
  professional: ProfessionalInfo;
}

export default function ProjectInterestsPage() {
  const router = useRouter();
  const { projectId } = router.query;
  const [interests, setInterests] = useState<InterestWithPro[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPro, setSelectedPro] = useState<InterestWithPro | null>(null);
  const [message, setMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [matchingId, setMatchingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (projectId && typeof projectId === "string") loadInterests();
  }, [projectId]);

  const loadInterests = async () => {
    setLoading(true);
    try {
      const { data, error } = await matchingService.getProjectInterests(projectId as string);
      if (error) throw error;
      setInterests(data || []);
    } catch {
      toast({ title: "Erreur", description: "Impossible de charger les professionnels.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Mini-échange anonyme : crée la conversation et redirige vers le chat
  const handleStartChat = async (interest: InterestWithPro) => {
    try {
      const { data: conversation, error } = await chatService.getOrCreateConversation(
        projectId as string,
        interest.professional.id
      );
      if (error || !conversation) throw error || new Error("Conversation impossible");
      router.push(`/chat/${conversation.id}`);
    } catch {
      toast({ title: "Erreur", description: "Impossible de démarrer l'échange.", variant: "destructive" });
    }
  };

  // Match direct : particulier accepte → pro reçoit notification pour payer
  const handleMatch = async (interest: InterestWithPro) => {
    setMatchingId(interest.id);
    try {
      const { error } = await matchingService.acceptProfessional(interest.id);
      if (error) throw error;
      toast({
        title: "✅ Match envoyé !",
        description: `${interest.professional.company_name} a 24h pour valider le paiement et accéder à vos coordonnées.`,
      });
      loadInterests();
    } catch {
      toast({ title: "Erreur", description: "Impossible de confirmer le match.", variant: "destructive" });
    } finally {
      setMatchingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      interested:       { label: "Intéressé",              color: "bg-blue-50 text-blue-600 border-blue-200" },
      client_interested:{ label: "Échange en cours",        color: "bg-purple-50 text-purple-600 border-purple-200" },
      payment_pending:  { label: "En attente de paiement",  color: "bg-yellow-50 text-yellow-600 border-yellow-200" },
      paid:             { label: "✅ Match validé",          color: "bg-green-50 text-green-600 border-green-200" },
      rejected:         { label: "Refusé",                  color: "bg-red-50 text-red-500 border-red-200" },
    };
    const cfg = map[status] || map.interested;
    return <Badge variant="outline" className={cfg.color}>{cfg.label}</Badge>;
  };

  // Nom affiché : anonyme jusqu'au paiement
  const displayName = (interest: InterestWithPro) => {
    if (interest.status === "paid") return interest.professional.company_name;
    // Anonymiser : "Entreprise BTP #4A2"
    return `Professionnel #${interest.professional.id.substring(0, 4).toUpperCase()}`;
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-20">
        <SEO title="Professionnels intéressés | SwipeTonPro" />
        <main className="container mx-auto px-4 py-8 max-w-5xl">
          <Link href="/particulier/projects">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" /> Mes projets
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-1">Professionnels intéressés</h1>
          <p className="text-muted-foreground mb-8">
            Choisissez un mini-échange anonyme (3 messages) ou matchez directement.
          </p>

          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner /></div>
          ) : interests.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucun professionnel pour l'instant</h3>
                <p className="text-muted-foreground">Revenez bientôt, votre projet est visible par les pros.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {interests.map((interest) => (
                <Card key={interest.id} className="hover:shadow-md transition-shadow flex flex-col">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-orange-100 text-orange-600 font-bold">
                          {interest.status === "paid"
                            ? interest.professional.company_name.substring(0, 2).toUpperCase()
                            : "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">{displayName(interest)}</CardTitle>
                        {interest.professional.average_rating && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {interest.professional.average_rating.toFixed(1)}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      {getStatusBadge(interest.status)}
                    </div>

                    {/* Coordonnées révélées après paiement */}
                    {interest.status === "paid" && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800 space-y-1">
                        <p className="font-semibold">✅ Coordonnées disponibles</p>
                        <p>{interest.professional.profile.full_name}</p>
                      </div>
                    )}

                    {/* Deadline paiement */}
                    {interest.status === "payment_pending" && interest.payment_deadline && (
                      <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                        <Clock className="w-4 h-4" />
                        <span>
                          Expiration dans {Math.max(0, Math.floor(
                            (new Date(interest.payment_deadline).getTime() - Date.now()) / 60000
                          ))} min
                        </span>
                      </div>
                    )}

                    {/* Actions selon statut */}
                    <div className="flex flex-col gap-2 pt-2">
                      {interest.status === "interested" && (
                        <>
                          {/* Mini-échange anonyme */}
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => handleStartChat(interest)}
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Mini-échange anonyme
                            <Badge variant="secondary" className="ml-2 text-xs">3 msgs</Badge>
                          </Button>

                          {/* Match direct */}
                          <Button
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                            onClick={() => handleMatch(interest)}
                            disabled={matchingId === interest.id}
                          >
                            <Handshake className="mr-2 h-4 w-4" />
                            {matchingId === interest.id ? "Envoi..." : "Matcher directement"}
                          </Button>
                        </>
                      )}

                      {interest.status === "client_interested" && (
                        <Button
                          className="w-full"
                          onClick={() => handleStartChat(interest)}
                        >
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Continuer l'échange
                        </Button>
                      )}

                      {interest.status === "payment_pending" && (
                        <div className="w-full text-center p-3 bg-yellow-50 rounded text-sm text-yellow-700 border border-yellow-200">
                          ⏳ En attente du paiement du professionnel
                        </div>
                      )}

                      {interest.status === "paid" && (
                        <Button
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleStartChat(interest)}
                        >
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Contacter le professionnel
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
