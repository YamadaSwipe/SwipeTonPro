import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Euro, 
  Clock, 
  User, 
  Building2,
  CheckCircle,
  AlertCircle,
  Star,
  TrendingUp,
  FileText,
  MessageSquare,
  ArrowRight
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { leadQualificationService } from "@/services/leadQualificationService";
import { planningService } from "@/services/planningService";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type PlanningEvent = any;
type Project = Database["public"]["Tables"]["projects"]["Row"];
type Professional = Database["public"]["Tables"]["professionals"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface EventWithDetails extends PlanningEvent {
  project?: Project;
  professional?: Professional & { profile?: Profile };
  client?: Profile;
}

export default function QualifyLeadPage() {
  const router = useRouter();
  const { eventId } = router.query;
  
  const [event, setEvent] = useState<EventWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lead, setLead] = useState<any>(null);

  // Formulaire de qualification
  const [qualificationData, setQualificationData] = useState({
    status: 'new' as 'new' | 'contacted' | 'qualified' | 'hot' | 'cold' | 'converted' | 'lost',
    urgency: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    budget: 0,
    timeline: '',
    notes: '',
    nextAction: '',
    nextActionDate: '',
    decisionMaker: true,
    hasPermit: false,
    hasFinancing: false,
    competitors: '',
    painPoints: '',
    motivation: ''
  });

  useEffect(() => {
    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  const loadEvent = async () => {
    setLoading(true);
    try {
      const { data } = await (planningService as any).getEventById(eventId as string);
      if (data) {
        setEvent(data);
        
        // Créer ou récupérer le lead
        await createOrUpdateLead(data);
      }
    } catch (error) {
      console.error("Erreur chargement événement:", error);
    } finally {
      setLoading(false);
    }
  };

  const createOrUpdateLead = async (event: EventWithDetails) => {
    try {
      if (!event.project_id || !event.client_id) return;

      // Créer le lead s'il n'existe pas
      const { data: newLead } = await leadQualificationService.createLeadFromProject(
        event.project_id,
        event.client_id
      );

      if (newLead) {
        setLead(newLead);
        
        // Pré-remplir les données de qualification
        setQualificationData((prev: any) => ({
          ...prev,
          budget: (newLead as any).budget || 0,
          timeline: newLead.timeline || '',
          urgency: newLead.urgency || 'medium',
          status: newLead.status || 'new'
        }));
      }
    } catch (error) {
      console.error("Erreur création lead:", error);
    }
  };

  const calculateQualificationScore = () => {
    let score = 0;
    
    // Budget (30 points)
    if (qualificationData.budget > 5000) score += 30;
    else if (qualificationData.budget > 2000) score += 20;
    else if (qualificationData.budget > 1000) score += 10;
    
    // Urgency (20 points)
    if (qualificationData.urgency === 'urgent') score += 20;
    else if (qualificationData.urgency === 'high') score += 15;
    else if (qualificationData.urgency === 'medium') score += 10;
    
    // Timeline (15 points)
    if (qualificationData.timeline && qualificationData.timeline !== '') score += 15;
    
    // Decision maker (10 points)
    if (qualificationData.decisionMaker) score += 10;
    
    // Permit (10 points)
    if (qualificationData.hasPermit) score += 10;
    
    // Financing (10 points)
    if (qualificationData.hasFinancing) score += 10;
    
    // Motivation (5 points)
    if (qualificationData.motivation && qualificationData.motivation.length > 50) score += 5;
    
    return score;
  };

  const getQualificationLevel = (score: number) => {
    if (score >= 70) return { level: 'hot', color: 'bg-red-100 text-red-800', label: 'Lead Chaud' };
    if (score >= 40) return { level: 'warm', color: 'bg-orange-100 text-orange-800', label: 'Lead Tiède' };
    return { level: 'cold', color: 'bg-blue-100 text-blue-800', label: 'Lead Froid' };
  };

  const handleSaveQualification = async () => {
    if (!lead) return;

    setSaving(true);
    try {
      const score = calculateQualificationScore();
      const level = getQualificationLevel(score);

      // Mettre à jour le lead
      await leadQualificationService.updateLeadStatus(
        lead.id,
        qualificationData.status as 'hot' | 'warm' | 'cold',
        qualificationData.notes
      );

      // Mettre à jour le score de qualification
      await (supabase as any)
        .from("leads")
        .update({
          qualification_score: score,
          urgency: qualificationData.urgency,
          budget: qualificationData.budget,
          timeline: qualificationData.timeline,
          notes: qualificationData.notes,
          next_action: qualificationData.nextAction,
          next_action_date: qualificationData.nextActionDate,
          updated_at: new Date().toISOString()
        })
        .eq("id", lead.id);

      // Marquer l'événement comme terminé
      await planningService.updateEventStatus(event!.id, "completed");

      // Rediriger vers le CRM
      router.push("/admin/crm");
    } catch (error) {
      console.error("Erreur sauvegarde qualification:", error);
    } finally {
      setSaving(false);
    }
  };

  const score = calculateQualificationScore();
  const qualificationLevel = getQualificationLevel(score);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Événement non trouvé</h2>
          <Button onClick={() => router.push("/particulier/planning")}>
            Retour au planning
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO title="Qualification Lead - SwipeTonPro" />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Qualification Lead</h1>
              <p className="text-muted-foreground">Évaluez et qualifiez ce lead potentiel</p>
            </div>
            <Button onClick={() => router.push("/particulier/planning")}>
              Retour au planning
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Informations du projet */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Informations du Projet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{event.project?.title}</h3>
                      <p className="text-muted-foreground">{event.project?.category}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{event.project?.city}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Euro className="w-4 h-4" />
                        <span>{event.project?.budget_max?.toLocaleString()} €</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{(event.project as any)?.deadline}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{event.time} ({event.duration}min)</span>
                      </div>
                    </div>
                    
                    {event.project?.description && (
                      <div>
                        <h4 className="font-semibold mb-2">Description</h4>
                        <p className="text-sm text-muted-foreground">{event.project.description}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Formulaire de qualification */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Évaluation de Qualification
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Score de qualification */}
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">Score de qualification</span>
                        <Badge className={qualificationLevel.color}>
                          {qualificationLevel.label}
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {score}/100 points
                      </p>
                    </div>

                    {/* Formulaire */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="status">Statut du Lead</Label>
                        <Select value={qualificationData.status} onValueChange={(value: any) => setQualificationData({...qualificationData, status: value})}>
                          <SelectTrigger>
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
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="urgency">Urgence</Label>
                        <Select value={qualificationData.urgency} onValueChange={(value: any) => setQualificationData({...qualificationData, urgency: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Faible</SelectItem>
                            <SelectItem value="medium">Moyenne</SelectItem>
                            <SelectItem value="high">Élevée</SelectItem>
                            <SelectItem value="urgent">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="budget">Budget estimé (€)</Label>
                        <Input
                          id="budget"
                          type="number"
                          value={qualificationData.budget}
                          onChange={(e) => setQualificationData({...qualificationData, budget: parseInt(e.target.value)})}
                        />
                      </div>

                      <div>
                        <Label htmlFor="timeline">Délai souhaité</Label>
                        <Input
                          id="timeline"
                          value={qualificationData.timeline}
                          onChange={(e) => setQualificationData({...qualificationData, timeline: e.target.value})}
                          placeholder="Ex: 1 mois, 2 semaines, etc."
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="notes">Notes de qualification</Label>
                        <Textarea
                          id="notes"
                          value={qualificationData.notes}
                          onChange={(e) => setQualificationData({...qualificationData, notes: e.target.value})}
                          placeholder="Points clés de la conversation, intérêts, objections..."
                          rows={4}
                        />
                      </div>

                      <div>
                        <Label htmlFor="motivation">Motivation du client</Label>
                        <Textarea
                          id="motivation"
                          value={qualificationData.motivation}
                          onChange={(e) => setQualificationData({...qualificationData, motivation: e.target.value})}
                          placeholder="Pourquoi le client veut réaliser ce projet maintenant ?"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="painPoints">Points de douleur</Label>
                        <Textarea
                          id="painPoints"
                          value={qualificationData.painPoints}
                          onChange={(e) => setQualificationData({...qualificationData, painPoints: e.target.value})}
                          placeholder="Quels problèmes le client cherche à résoudre ?"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="nextAction">Prochaine action</Label>
                        <Input
                          id="nextAction"
                          value={qualificationData.nextAction}
                          onChange={(e) => setQualificationData({...qualificationData, nextAction: e.target.value})}
                          placeholder="Ex: Envoyer un devis, Planifier une visite, etc."
                        />
                      </div>

                      <div>
                        <Label htmlFor="nextActionDate">Date de la prochaine action</Label>
                        <Input
                          id="nextActionDate"
                          type="date"
                          value={qualificationData.nextActionDate}
                          onChange={(e) => setQualificationData({...qualificationData, nextActionDate: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* Cases à cocher */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="decisionMaker"
                          checked={qualificationData.decisionMaker}
                          onChange={(e) => setQualificationData({...qualificationData, decisionMaker: e.target.checked})}
                        />
                        <Label htmlFor="decisionMaker">Le client est le décideur</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="hasPermit"
                          checked={qualificationData.hasPermit}
                          onChange={(e) => setQualificationData({...qualificationData, hasPermit: e.target.checked})}
                        />
                        <Label htmlFor="hasPermit">Le client a le permis nécessaire</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="hasFinancing"
                          checked={qualificationData.hasFinancing}
                          onChange={(e) => setQualificationData({...qualificationData, hasFinancing: e.target.checked})}
                        />
                        <Label htmlFor="hasFinancing">Le client a le financement</Label>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={handleSaveQualification}
                        disabled={saving}
                        className="flex-1"
                      >
                        {saving ? "Sauvegarde..." : "Sauvegarder la qualification"}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => router.push("/particulier/planning")}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact client */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Contact Client
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">{event.client?.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">{event.client?.phone || "Non renseigné"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Informations professionnel */}
              {event.professional && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Professionnel
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="font-semibold">{event.professional.profile?.full_name}</p>
                        <p className="text-sm text-muted-foreground">{event.professional.company_name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">{event.professional.profile?.email}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions rapides */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Actions Rapides
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full">
                      <Phone className="w-4 h-4 mr-2" />
                      Appeler le client
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      <Mail className="w-4 h-4 mr-2" />
                      Envoyer un email
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      <FileText className="w-4 h-4 mr-2" />
                      Générer un devis
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
