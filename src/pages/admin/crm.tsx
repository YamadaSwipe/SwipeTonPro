import { SEO } from "@/components/SEO";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  TrendingUp, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Euro, 
  Clock, 
  Star,
  AlertCircle,
  CheckCircle,
  XCircle,
  Download,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Target,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";
import { useState, useEffect } from "react";
import { leadQualificationService } from "@/services/leadQualificationService";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

interface Lead {
  id: string;
  project_id: string;
  client_id: string;
  professional_id?: string;
  qualification_score: number;
  status: 'new' | 'contacted' | 'qualified' | 'hot' | 'cold' | 'converted' | 'lost' | 'paused' | 'suspended' | 'archived';
  budget: number;
  timeline: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  notes: string;
  contact_attempts: number;
  last_contact_date?: string;
  next_action_date?: string;
  assigned_to?: string;
  source: 'organic' | 'paid' | 'referral' | 'direct';
  created_at: string;
  updated_at: string;
  project?: any;
  client?: any;
  professional?: any;
}

export default function AdminCRMPage() {
  const [agents, setAgents] = useState<Array<{id: string, name: string}>>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [filters, setFilters] = useState({
    status: "all",
    urgency: "all",
    assignedTo: "all",
    dateRange: "all"
  });

  useEffect(() => {
    loadLeads();
    loadStats();
  }, [activeTab, filters]);

  const loadLeads = async () => {
    setLoading(true);
    try {
      // Récupérer les vrais projets depuis la base de données
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select(`
          id,
          title,
          category,
          city,
          estimated_budget_min,
          estimated_budget_max,
          status,
          created_at,
          client_id,
          client:profiles!projects_client_id_fkey(
            id,
            full_name,
            email,
            phone
          )
        `)
        .in('status', ['pending', 'published'])
        .order('created_at', { ascending: false });

      if (projectsError) {
        console.error("Erreur chargement projets:", projectsError);
        setLeads([]);
        return;
      }

      // Transformer les projets en leads pour le CRM
      const leads: Lead[] = projects.map(project => {
        // Calcul du score de qualification intelligent
        let qualification_score = 50; // Score de base
        
        // Facteur budget (40 points max)
        if (project.estimated_budget_max) {
          if (project.estimated_budget_max >= 20000) qualification_score += 40;
          else if (project.estimated_budget_max >= 10000) qualification_score += 30;
          else if (project.estimated_budget_max >= 5000) qualification_score += 20;
          else qualification_score += 10;
        }
        
        // Facteur statut (30 points max)
        if (project.status === 'published') qualification_score += 30;
        else if (project.status === 'pending') qualification_score += 15;
        
        // Facteur catégorie (15 points max)
        const highValueCategories = ['Climatisation', 'Plomberie', 'Électricité', 'Maçonnerie'];
        if (highValueCategories.includes(project.category)) qualification_score += 15;
        
        // Facteur complétude profil (15 points max)
        if (project.client?.full_name && project.client?.email && project.client?.phone) {
          qualification_score += 15;
        } else if (project.client?.full_name && (project.client?.email || project.client?.phone)) {
          qualification_score += 10;
        } else if (project.client?.full_name) {
          qualification_score += 5;
        }
        
        qualification_score = Math.min(100, qualification_score); // Maximum 100

        return {
          id: project.id,
          project_id: project.id,
          client_id: project.client_id,
          qualification_score: qualification_score,
          status: project.status === 'published' ? 'qualified' : 'new',
          budget: project.estimated_budget_max || 0,
          timeline: "1-3 mois",
          urgency: project.estimated_budget_max && project.estimated_budget_max > 10000 ? 'high' : 'medium',
          notes: `Projet ${project.status === 'published' ? 'validé et publié' : 'en attente de validation'}`,
          contact_attempts: 0,
          last_contact_date: project.created_at,
          next_action_date: project.created_at,
          assigned_to: "",
          source: "organic",
          created_at: project.created_at,
          updated_at: project.created_at,
          project: {
            title: project.title,
            category: project.category,
            city: project.city
          },
          client: {
            full_name: project.client?.full_name || 'Client à contacter',
            email: project.client?.email || '',
            phone: project.client?.phone || ''
          }
        };
      });

      setLeads(leads);
    } catch (error) {
      console.error("Erreur chargement leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const stats = await leadQualificationService.getLeadStats();
      setStats(stats);
    } catch (error) {
      console.error("Erreur statistiques:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new": return <Badge variant="outline">Nouveau</Badge>;
      case "contacted": return <Badge className="bg-blue-100 text-blue-800">Contacté</Badge>;
      case "qualified": return <Badge className="bg-purple-100 text-purple-800">Qualifié</Badge>;
      case "hot": return <Badge className="bg-red-100 text-red-800">Chaud</Badge>;
      case "cold": return <Badge className="bg-gray-100 text-gray-800">Froid</Badge>;
      case "converted": return <Badge className="bg-green-100 text-green-800">Converti</Badge>;
      case "lost": return <Badge variant="destructive">Perdu</Badge>;
      case "paused": return <Badge className="bg-yellow-100 text-yellow-800">En pause</Badge>;
      case "suspended": return <Badge className="bg-orange-100 text-orange-800">Suspendu</Badge>;
      case "archived": return <Badge className="bg-gray-200 text-gray-600">Archivé</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "urgent": return <Badge className="bg-red-100 text-red-800">Urgent</Badge>;
      case "high": return <Badge className="bg-orange-100 text-orange-800">Élevée</Badge>;
      case "medium": return <Badge className="bg-yellow-100 text-yellow-800">Moyenne</Badge>;
      case "low": return <Badge className="bg-gray-100 text-gray-800">Faible</Badge>;
      default: return <Badge variant="outline">{urgency}</Badge>;
    }
  };

  const getQualificationColor = (score: number) => {
    if (score >= 70) return "text-red-600";
    if (score >= 40) return "text-orange-600";
    return "text-blue-600";
  };

  const handleExportCSV = async () => {
    try {
      const { data } = await leadQualificationService.exportLeadsToCSV();
      if (data) {
        const blob = new Blob([data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Erreur export:", error);
    }
  };

  const handleAssignLead = async (leadId: string, assignedTo: string) => {
    try {
      // Mettre à jour l'assignation dans la base de données
      const { error } = await supabase
        .from('projects')
        .update({ 
          assigned_to: assignedTo,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) {
        console.error("Erreur assignation:", error);
        alert("Erreur lors de l'assignation");
        return;
      }

      console.log(`✅ Projet ${leadId} assigné à: ${assignedTo}`);
      loadLeads(); // Recharger la liste
    } catch (error) {
      console.error("Erreur assignation:", error);
      alert("Erreur lors de l'assignation");
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce lead ?")) {
      return;
    }
    
    try {
      // Supprimer le projet associé
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', leadId);

      if (error) {
        console.error("Erreur suppression projet:", error);
        alert("Erreur lors de la suppression du projet");
        return;
      }

      console.log("✅ Projet et lead supprimés avec succès");
      loadLeads(); // Recharger la liste
    } catch (error) {
      console.error("Erreur suppression:", error);
      alert("Erreur lors de la suppression");
    }
  };

  const handleUpdateStatus = async (leadId: string, status: string) => {
    try {
      // Mettre à jour le statut du projet dans la base de données
      const { error } = await supabase
        .from('projects')
        .update({ 
          updated_at: new Date().toISOString(),
          // Ajouter un champ status_lead si nécessaire dans la table projects
          status_lead: status 
        })
        .eq('id', leadId);

      if (error) {
        console.error("Erreur mise à jour statut:", error);
        alert("Erreur lors de la mise à jour du statut");
        return;
      }

      console.log(`✅ Statut du projet ${leadId} mis à jour: ${status}`);
      loadLeads(); // Recharger la liste
    } catch (error) {
      console.error("Erreur mise à jour:", error);
      alert("Erreur lors de la mise à jour");
    }
  };

  const filteredLeads = leads.filter(lead => {
    if (filters.status && filters.status !== "all" && lead.status !== filters.status) return false;
    if (filters.urgency && filters.urgency !== "all" && lead.urgency !== filters.urgency) return false;
    if (filters.assignedTo && filters.assignedTo !== "all" && lead.assigned_to !== filters.assignedTo) return false;
    return true;
  });

  return (
    <>
      <SEO title="CRM - Admin" />
      <AdminLayout title="CRM - Gestion Leads">
        <div className="space-y-6">
          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
                      <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Leads Chauds</p>
                      <p className="text-2xl font-bold text-red-600">{stats.hot}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Taux Conversion</p>
                      <p className="text-2xl font-bold text-green-600">{stats.conversionRate.toFixed(1)}%</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Convertis</p>
                      <p className="text-2xl font-bold">{stats.converted}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filtres et actions */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="new">Nouveau</SelectItem>
                      <SelectItem value="contacted">Contacté</SelectItem>
                      <SelectItem value="qualified">Qualifié</SelectItem>
                      <SelectItem value="hot">Chaud</SelectItem>
                      <SelectItem value="cold">Froid</SelectItem>
                      <SelectItem value="converted">Converti</SelectItem>
                      <SelectItem value="lost">Perdu</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.urgency} onValueChange={(value) => setFilters({...filters, urgency: value})}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Urgence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les urgences</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">Élevée</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="low">Faible</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.assignedTo} onValueChange={(value) => setFilters({...filters, assignedTo: value})}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Assigné à" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Non assigné</SelectItem>
                      <SelectItem value="all">Tous</SelectItem>
                      {agents.map(agent => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleExportCSV} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Exporter CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tableau des leads */}
          <Card>
            <CardHeader>
              <CardTitle>Liste des Leads</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p>Chargement...</p>
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Aucun lead trouvé</h3>
                  <p className="text-muted-foreground">
                    Aucun lead ne correspond à vos filtres
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Projet</th>
                        <th className="text-left p-2">Client</th>
                        <th className="text-left p-2">Statut</th>
                        <th className="text-left p-2">Score</th>
                        <th className="text-left p-2">Budget</th>
                        <th className="text-left p-2">Urgence</th>
                        <th className="text-left p-2">Assigné à</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map((lead) => (
                        <tr key={lead.id} className="border-b hover:bg-muted/50">
                          <td className="p-2">
                            <div>
                              <p className="font-semibold">{lead.project?.title}</p>
                              <p className="text-sm text-muted-foreground">{lead.project?.category}</p>
                            </div>
                          </td>
                          <td className="p-2">
                            <div>
                              <p className="font-semibold">{lead.client?.full_name}</p>
                              <p className="text-sm text-muted-foreground">{lead.client?.email}</p>
                            </div>
                          </td>
                          <td className="p-2">{getStatusBadge(lead.status)}</td>
                          <td className="p-2">
                            <span className={`font-bold ${getQualificationColor(lead.qualification_score)}`}>
                              {lead.qualification_score}/100
                            </span>
                          </td>
                          <td className="p-2">{lead.budget.toLocaleString()} €</td>
                          <td className="p-2">{getUrgencyBadge(lead.urgency)}</td>
                          <td className="p-2">
                            <span className="text-sm">
                              {agents.find(agent => agent.id === lead.assigned_to)?.name || 
                               lead.assigned_to === "unassigned" ? "Non assigné" : 
                               "Agent inconnu"}
                            </span>
                          </td>
                          <td className="p-2">
                            <div className="flex gap-1">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleDeleteLead(lead.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>

                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Détails du Lead</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <h4 className="font-semibold">Informations projet</h4>
                                      <p><strong>Titre:</strong> {lead.project?.title}</p>
                                      <p><strong>Catégorie:</strong> {lead.project?.category}</p>
                                      <p><strong>Ville:</strong> {lead.project?.city}</p>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold">Contact client</h4>
                                      <p><strong>Nom:</strong> {lead.client?.full_name}</p>
                                      <p><strong>Email:</strong> {lead.client?.email}</p>
                                      <p><strong>Téléphone:</strong> {lead.client?.phone}</p>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold">Qualification</h4>
                                      <p><strong>Score:</strong> {lead.qualification_score}/100</p>
                                      <p><strong>Statut:</strong> {getStatusBadge(lead.status)}</p>
                                      <p><strong>Urgence:</strong> {getUrgencyBadge(lead.urgency)}</p>
                                      <p><strong>Budget:</strong> {lead.budget.toLocaleString()} €</p>
                                      <p><strong>Délai:</strong> {lead.timeline}</p>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold">Notes</h4>
                                      <p className="text-sm">{lead.notes}</p>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              <Select value={lead.status} onValueChange={(value) => handleUpdateStatus(lead.id, value)}>
                                <SelectTrigger className="w-[120px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="new">Nouveau</SelectItem>
                                  <SelectItem value="contacted">Contacté</SelectItem>
                                  <SelectItem value="qualified">Qualifié</SelectItem>
                                  <SelectItem value="hot">Chaud</SelectItem>
                                  <SelectItem value="cold">Froid</SelectItem>
                                  <SelectItem value="converted">Converti</SelectItem>
                                  <SelectItem value="lost">Perdu</SelectItem>
                                  <SelectItem value="paused">En pause</SelectItem>
                                  <SelectItem value="suspended">Suspendu</SelectItem>
                                  <SelectItem value="archived">Archivé</SelectItem>
                                </SelectContent>
                              </Select>

                              <Select value={lead.assigned_to || "unassigned"} onValueChange={(value) => handleAssignLead(lead.id, value)}>
                                <SelectTrigger className="w-[120px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="unassigned">Non assigné</SelectItem>
                                  {agents.map(agent => (
                                    <SelectItem key={agent.id} value={agent.id}>
                                      {agent.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </>
  );
}
