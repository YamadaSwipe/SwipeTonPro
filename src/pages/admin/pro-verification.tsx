import { SEO } from "@/components/SEO";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Search, CheckCircle, XCircle, Clock, Building2, MapPin, Briefcase, Shield
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { proVerificationService, ProfessionalProfile } from "@/services/proVerificationService";

export default function ProVerification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [professionals, setProfessionals] = useState<ProfessionalProfile[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, verified: 0, rejected: 0 });
  const [selectedPro, setSelectedPro] = useState<ProfessionalProfile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState("");

  useEffect(() => { loadStats(); loadProfessionals(); }, [activeTab, searchQuery]);

  async function loadStats() {
    const data = await proVerificationService.getVerificationStats();
    setStats(data);
  }

  async function loadProfessionals() {
    setLoading(true);
    const status = activeTab === "all" ? "all" : activeTab as any;
    const { professionals } = await proVerificationService.getProfessionals({
      status, search: searchQuery || undefined, limit: 50
    });
    setProfessionals(professionals);
    setLoading(false);
  }

  async function handleVerification(status: "verified" | "rejected") {
    if (!selectedPro || !user) return;
    try {
      setLoading(true);
      const result = await proVerificationService.updateVerificationStatus(
        selectedPro.id, status, verificationNotes, user.id
      );
      if (result.success) {
        toast({ title: status === "verified" ? "✅ Pro vérifié" : "❌ Pro rejeté" });
        setIsDialogOpen(false);
        loadProfessionals(); loadStats();
      } else {
        toast({ title: "❌ Erreur", description: result.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "❌ Erreur", description: "Une erreur est survenue", variant: "destructive" });
    } finally { setLoading(false); }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified": return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Vérifié</Badge>;
      case "rejected": return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejeté</Badge>;
      default: return <Badge variant="outline" className="text-amber-600 border-amber-600"><Clock className="w-3 h-3 mr-1" /> En attente</Badge>;
    }
  };

  return (
    <>
      <SEO title="Vérification Pros - Admin" />
      <AdminLayout title="Centre de Vérification">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold">{stats.total}</p></div><Building2 className="w-8 h-8 text-blue-600" /></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">En attente</p><p className="text-2xl font-bold text-amber-600">{stats.pending}</p></div><Clock className="w-8 h-8 text-amber-600" /></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Vérifiés</p><p className="text-2xl font-bold text-green-600">{stats.verified}</p></div><CheckCircle className="w-8 h-8 text-green-600" /></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Rejetés</p><p className="text-2xl font-bold text-red-600">{stats.rejected}</p></div><XCircle className="w-8 h-8 text-red-600" /></div></CardContent></Card>
        </div>

        {/* Liste */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Professionnels</CardTitle>
                <CardDescription>Gérez la vérification des comptes professionnels.</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher..." className="pl-10 w-64" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="pending">En attente ({stats.pending})</TabsTrigger>
                <TabsTrigger value="verified">Vérifiés ({stats.verified})</TabsTrigger>
                <TabsTrigger value="rejected">Rejetés ({stats.rejected})</TabsTrigger>
                <TabsTrigger value="all">Tous ({stats.total})</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-0">
                <div className="space-y-2">
                  {professionals.map((pro) => (
                    <div key={pro.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedPro(pro); setVerificationNotes(pro.verification_notes || ""); setIsDialogOpen(true); }}>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12"><AvatarFallback className="bg-blue-100 text-blue-600">{pro.company_name?.substring(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{pro.company_name}</h3>
                            {getStatusBadge(pro.verification_status)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span>SIRET: {pro.siret}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{(pro.service_areas || []).length} zones</span>
                            <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{(pro.trades || []).length} métiers</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">Voir</Button>
                    </div>
                  ))}
                  {professionals.length === 0 && !loading && (
                    <div className="text-center py-12 text-muted-foreground"><Shield className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>Aucun professionnel trouvé</p></div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" />{selectedPro?.company_name}</DialogTitle>
            </DialogHeader>
            {selectedPro && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>SIRET</Label><p className="font-mono text-sm">{selectedPro.siret}</p></div>
                  <div><Label>TVA</Label><p className="text-sm">{selectedPro.vat_number || "N/A"}</p></div>
                  <div><Label>Métiers</Label><div className="flex flex-wrap gap-1 mt-1">{(selectedPro.trades || []).map((t) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}</div></div>
                  <div><Label>Zones</Label><div className="flex flex-wrap gap-1 mt-1">{(selectedPro.service_areas || []).slice(0, 5).map((a) => <Badge key={a} variant="outline" className="text-xs">{a}</Badge>)}</div></div>
                </div>
                <Separator />
                <div><Label>Notes de vérification</Label><Textarea className="mt-2" value={verificationNotes} onChange={(e) => setVerificationNotes(e.target.value)} placeholder="Ajoutez des notes..." /></div>
                {selectedPro.verification_status === "pending" && (
                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                    <Button variant="destructive" onClick={() => handleVerification("rejected")} disabled={loading}><XCircle className="w-4 h-4 mr-2" />Rejeter</Button>
                    <Button onClick={() => handleVerification("verified")} disabled={loading} className="bg-green-600 hover:bg-green-700"><CheckCircle className="w-4 h-4 mr-2" />Vérifier</Button>
                  </DialogFooter>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </>
  );
}
