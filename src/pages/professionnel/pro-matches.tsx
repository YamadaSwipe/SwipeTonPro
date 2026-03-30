import { SEO } from "@/components/SEO";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Euro, Clock, MessageSquare, CreditCard, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";

const MISE_EN_RELATION_AMOUNT = 35; // €

export default function ProMatchesPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPayingId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Feedback retour Stripe
  useEffect(() => {
    if (router.query.payment === "success") {
      toast({ title: "✅ Paiement confirmé", description: "Vous avez accès aux coordonnées du client." });
    }
  }, [router.query]);

  useEffect(() => { loadMatches(); }, []);

  const loadMatches = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const { data: pro } = await supabase
        .from("professionals")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!pro) return;

      const { data } = await supabase
        .from("project_interests")
        .select(`
          *,
          project:projects!project_interests_project_id_fkey(
            id, title, city, category,
            estimated_budget_min, estimated_budget_max,
            description
          ),
          conversation:conversations(id, phase, client_id,
            client:profiles!conversations_client_id_fkey(full_name, email, phone)
          )
        `)
        .eq("professional_id", pro.id)
        .in("status", ["payment_pending", "paid", "interested", "client_interested"])
        .order("updated_at", { ascending: false });

      setMatches(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayMiseEnRelation = async (match: any) => {
    setPayingId(match.id);
    try {
      const res = await fetch("/api/create-match-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interestId: match.id,
          projectId: match.project_id,
          projectTitle: match.project?.title,
        }),
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
      setPayingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      interested:        { label: "Candidature envoyée", color: "bg-blue-50 text-blue-600 border-blue-200" },
      client_interested: { label: "Échange en cours",     color: "bg-purple-50 text-purple-600 border-purple-200" },
      payment_pending:   { label: "🎉 Match ! Payez pour accéder", color: "bg-yellow-50 text-yellow-700 border-yellow-300" },
      paid:              { label: "✅ Accès débloqué",    color: "bg-green-50 text-green-700 border-green-200" },
    };
    const cfg = map[status] || map.interested;
    return <Badge variant="outline" className={cfg.color}>{cfg.label}</Badge>;
  };

  return (
    <ProtectedRoute allowedRoles={["professional"]}>
      <SEO title="Mes Matchs | SwipeTonPro" />
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link href="/professionnel/dashboard">
              <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Mes Matchs & Candidatures</h1>
              <p className="text-sm text-muted-foreground">Gérez vos candidatures et débloquez vos matchs</p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
            </div>
          ) : matches.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucune candidature pour l'instant</h3>
                <Link href="/professionnel/browse-projects">
                  <Button className="mt-2 bg-orange-500 hover:bg-orange-600 text-white">
                    Parcourir les projets
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            matches.map((match) => {
              const conv = Array.isArray(match.conversation) ? match.conversation[0] : match.conversation;
              const clientRevealed = match.status === "paid";
              const client = conv?.client;

              return (
                <Card key={match.id} className={`transition-shadow hover:shadow-md ${match.status === "payment_pending" ? "border-yellow-300 bg-yellow-50/30" : ""}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div>
                        <CardTitle className="text-lg">{match.project?.title}</CardTitle>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{match.project?.city}
                          </span>
                          <span className="flex items-center gap-1">
                            <Euro className="w-3 h-3" />
                            {match.project?.estimated_budget_min?.toLocaleString("fr-FR")}€ –{" "}
                            {match.project?.estimated_budget_max?.toLocaleString("fr-FR")}€
                          </span>
                        </div>
                      </div>
                      {getStatusBadge(match.status)}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">{match.project?.description}</p>

                    {/* Délai paiement */}
                    {match.status === "payment_pending" && match.payment_deadline && (
                      <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-100 p-2 rounded-lg">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span>
                          Expiration dans{" "}
                          {Math.max(0, Math.floor((new Date(match.payment_deadline).getTime() - Date.now()) / 3600000))}h{" "}
                          {Math.max(0, Math.floor(((new Date(match.payment_deadline).getTime() - Date.now()) % 3600000) / 60000))}min
                        </span>
                      </div>
                    )}

                    {/* Coordonnées client (après paiement) */}
                    {clientRevealed && client && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-1">
                        <p className="font-semibold text-green-800 text-sm">✅ Coordonnées du client</p>
                        <p className="text-sm text-green-700">{client.full_name}</p>
                        <p className="text-sm text-green-700">{client.email}</p>
                        {client.phone && <p className="text-sm text-green-700">{client.phone}</p>}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      {match.status === "payment_pending" && (
                        <Button
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                          onClick={() => handlePayMiseEnRelation(match)}
                          disabled={paying === match.id}
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          {paying === match.id ? "Redirection..." : `Payer ${MISE_EN_RELATION_AMOUNT}€ de mise en relation`}
                        </Button>
                      )}

                      {(match.status === "paid" || match.status === "client_interested") && conv?.id && (
                        <Link href={`/chat/${conv.id}`} className="flex-1">
                          <Button className="w-full" variant={match.status === "paid" ? "default" : "outline"}>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            {match.status === "paid" ? "Ouvrir le chat" : "Continuer l'échange"}
                          </Button>
                        </Link>
                      )}

                      {match.status === "interested" && conv?.id && (
                        <Link href={`/chat/${conv.id}`} className="flex-1">
                          <Button variant="outline" className="w-full">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Mini-échange anonyme
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
