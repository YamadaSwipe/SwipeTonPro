import { SEO } from "@/components/SEO";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, MessageSquare, AlertTriangle, Users, Shield, Eye
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function LiveMonitor() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("matches");
  const [matches, setMatches] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [stats, setStats] = useState({ matches: 0, messages: 0, flagged: 0 });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [activeTab]);

  async function loadData() {
    try {
      if (activeTab === "matches" || activeTab === "overview") {
        const { data } = await supabase
          .from("match_payments")
          .select("*, profiles:professional_id(full_name), projects:title")
          .order("created_at", { ascending: false })
          .limit(20);
        setMatches(data || []);
      }
      if (activeTab === "moderation" || activeTab === "overview") {
        const { data } = await supabase
          .from("anonymous_messages")
          .select("*, matches(match_id), moderation_logs(*)")
          .order("created_at", { ascending: false })
          .limit(20);
        setMessages(data || []);
      }
    } catch (error) {
      console.error("Error loading monitor data:", error);
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: any = { pending: "bg-yellow-100 text-yellow-800", active: "bg-green-100 text-green-800", completed: "bg-blue-100 text-blue-800", disputed: "bg-red-100 text-red-800" };
    return <Badge className={colors[status] || "bg-gray-100"}>{status}</Badge>;
  };

  return (
    <>
      <SEO title="Live Monitor - Admin" />
      <AdminLayout title="Live Monitor">
        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Matches Actifs</p><p className="text-2xl font-bold">{stats.matches}</p></div><Activity className="w-8 h-8 text-blue-600" /></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Messages (24h)</p><p className="text-2xl font-bold">{stats.messages}</p></div><MessageSquare className="w-8 h-8 text-green-600" /></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Flaggés</p><p className="text-2xl font-bold text-red-600">{stats.flagged}</p></div><AlertTriangle className="w-8 h-8 text-red-600" /></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Pros Actifs</p><p className="text-2xl font-bold">{stats.matches}</p></div><Users className="w-8 h-8 text-purple-600" /></div></CardContent></Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="matches"><Activity className="w-4 h-4 mr-2" />Matches</TabsTrigger>
            <TabsTrigger value="moderation"><Shield className="w-4 h-4 mr-2" />Modération</TabsTrigger>
          </TabsList>

          <TabsContent value="matches">
            <Card>
              <CardHeader><CardTitle>Matches Récents</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {matches.map((match) => (
                    <div key={match.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{match.profiles?.full_name} → {match.projects?.title}</p>
                        <p className="text-sm text-muted-foreground">{new Date(match.created_at).toLocaleString()}</p>
                      </div>
                      {getStatusBadge(match.status)}
                    </div>
                  ))}
                  {matches.length === 0 && <p className="text-center text-muted-foreground py-8">Aucun match récent</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="moderation">
            <Card>
              <CardHeader><CardTitle>Messages à Surveiller</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {messages.filter(m => m.contains_contact_info).map((msg) => (
                    <div key={msg.id} className="p-3 border border-red-200 bg-red-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" /> Coordonnées détectées</Badge>
                        <span className="text-sm text-muted-foreground">{new Date(msg.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-sm line-clamp-2">{msg.content}</p>
                    </div>
                  ))}
                  {messages.filter(m => m.contains_contact_info).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground"><Shield className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>Aucun message problématique détecté</p></div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </AdminLayout>
    </>
  );
}
