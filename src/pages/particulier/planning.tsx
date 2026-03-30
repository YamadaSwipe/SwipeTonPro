import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Video,
  Building2,
  Star,
  MessageSquare,
  ArrowRight
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { planningService } from "@/services/planningService";
import { authService } from "@/services/authService";
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

export default function ParticulierPlanningPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [user, setUser] = useState<any>(null);

  // Formulaire de RDV
  const [formData, setFormData] = useState({
    date: "",
    time: "09:00",
    duration: 60,
    location: "",
    notes: "",
    type: "phone" as "phone" | "video" | "inperson"
  });

  useEffect(() => {
    checkAuth();
    loadEvents();
  }, [selectedDate]);

  const checkAuth = async () => {
    const session = await authService.getCurrentSession();
    if (!session?.user) {
      router.push("/auth/login");
      return;
    }
    setUser(session.user);
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      const { data } = await (planningService as any).getEventsForDate(selectedDate, user?.id);
      if (data) {
        setEvents(data);
      }
    } catch (error) {
      console.error("Erreur chargement événements:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleCall = async (project: Project, professional: Professional) => {
    setSelectedProject(project);
    setSelectedProfessional(professional);
    setFormData({
      ...formData,
      date: selectedDate,
      location: project.city || "À définir"
    });
    setShowScheduleDialog(true);
  };

  const handleSubmitSchedule = async () => {
    if (!selectedProject || !selectedProfessional) return;

    try {
      const result = await (planningService as any).createEvent({
        projectId: selectedProject.id,
        professionalId: selectedProfessional.id,
        clientId: user.id,
        title: `Appel qualification - ${selectedProject.title}`,
        description: formData.notes,
        date: formData.date,
        time: formData.time,
        duration: formData.duration,
        location: formData.location,
        type: formData.type
      });

      if (result.success) {
        setShowScheduleDialog(false);
        loadEvents();
        
        // Envoyer les notifications
        await sendScheduleNotifications(result.event);
      }
    } catch (error) {
      console.error("Erreur planification:", error);
    }
  };

  const sendScheduleNotifications = async (event: any) => {
    try {
      // Notifier le professionnel
      await supabase.from("notifications").insert({
        user_id: selectedProfessional?.user_id,
        title: "📅 Nouveau RDV planifié",
        message: `Un client a planifié un RDV pour le projet "${selectedProject?.title}"`,
        type: "call_scheduled",
        data: {
          event_id: event.id,
          project_id: selectedProject?.id
        }
      });

      // Notifier le client
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "✅ RDV planifié avec succès",
        message: `Votre RDV avec le professionnel est confirmé`,
        type: "call_scheduled",
        data: {
          event_id: event.id,
          project_id: selectedProject?.id
        }
      });
    } catch (error) {
      console.error("Erreur notifications:", error);
    }
  };

  const handleConfirmEvent = async (eventId: string) => {
    try {
      await planningService.updateEventStatus(eventId, "confirmed");
      loadEvents();
    } catch (error) {
      console.error("Erreur confirmation:", error);
    }
  };

  const handleCompleteEvent = async (eventId: string) => {
    try {
      await planningService.updateEventStatus(eventId, "completed");
      loadEvents();
      
      // Rediriger vers la fiche de qualification
      router.push(`/particulier/qualify-lead?event=${eventId}`);
    } catch (error) {
      console.error("Erreur complétion:", error);
    }
  };

  const handleCancelEvent = async (eventId: string) => {
    try {
      await planningService.updateEventStatus(eventId, "cancelled");
      loadEvents();
    } catch (error) {
      console.error("Erreur annulation:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled": return <Badge variant="outline">Planifié</Badge>;
      case "confirmed": return <Badge className="bg-blue-100 text-blue-800">Confirmé</Badge>;
      case "completed": return <Badge className="bg-green-100 text-green-800">Terminé</Badge>;
      case "cancelled": return <Badge variant="destructive">Annulé</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "phone": return <Phone className="w-4 h-4" />;
      case "video": return <Video className="w-4 h-4" />;
      case "inperson": return <MapPin className="w-4 h-4" />;
      default: return <Phone className="w-4 h-4" />;
    }
  };

  return (
    <>
      <SEO title="Planning - SwipeTonPro" />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Mon Planning</h1>
              <p className="text-muted-foreground">Gérez vos rendez-vous de qualification</p>
            </div>
            <Button onClick={() => router.push("/particulier/dashboard")}>
              Retour au dashboard
            </Button>
          </div>

          {/* Sélecteur de date */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Label htmlFor="date">Date:</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-auto"
                />
              </div>
            </CardContent>
          </Card>

          {/* Liste des événements */}
          {loading ? (
            <div className="text-center py-8">
              <p>Chargement...</p>
            </div>
          ) : events.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Aucun rendez-vous</h3>
                <p className="text-muted-foreground mb-4">
                  Vous n'avez pas de rendez-vous planifié pour cette date
                </p>
                <Button onClick={() => router.push("/particulier/projects")}>
                  Voir mes projets
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <Card key={event.id} className="hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <h3 className="text-lg font-semibold">{event.title}</h3>
                          {getStatusBadge(event.status)}
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            {getTypeIcon(event.type || "phone")}
                            <span>{event.type === "phone" ? "Téléphone" : event.type === "video" ? "Visio" : "Présentiel"}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(event.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>{event.time} ({event.duration}min)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{event.location}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4" />
                              <span>{event.project?.title}</span>
                            </div>
                            {event.professional?.profile && (
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                <span>{event.professional.profile.full_name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {event.description && (
                          <div className="mt-4 p-3 bg-muted rounded-lg">
                            <p className="text-sm">{event.description}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {event.status === "scheduled" && (
                          <>
                            <Button 
                              onClick={() => handleConfirmEvent(event.id)}
                              size="sm"
                              variant="outline"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Confirmer
                            </Button>
                            <Button 
                              onClick={() => handleCancelEvent(event.id)}
                              size="sm"
                              variant="destructive"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Annuler
                            </Button>
                          </>
                        )}
                        
                        {event.status === "confirmed" && (
                          <Button 
                            onClick={() => handleCompleteEvent(event.id)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Terminer
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialog de planification */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Planifier un appel de qualification</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedProject && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-semibold">{selectedProject.title}</p>
                <p className="text-sm text-muted-foreground">{selectedProject.category}</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="time">Heure</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="duration">Durée (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                min="15"
                max="120"
              />
            </div>
            
            <div>
              <Label htmlFor="location">Lieu</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="Téléphone, Visio, ou adresse"
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Points à aborder pendant l'appel..."
                rows={3}
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleSubmitSchedule}
                className="flex-1"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Planifier
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowScheduleDialog(false)}
              >
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
