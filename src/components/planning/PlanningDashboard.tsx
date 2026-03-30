import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, CheckCircle, AlertCircle, Plus, Edit2, Trash2 } from 'lucide-react';
import { planningService, PlanningEvent } from '@/services/planningService';
import { emailService } from '@/services/emailService';

interface PlanningDashboardProps {
  userId: string;
  userType: 'professional' | 'client';
}

export function PlanningDashboard({ userId, userType }: PlanningDashboardProps) {
  const [events, setEvents] = useState<PlanningEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<PlanningEvent | null>(null);

  useEffect(() => {
    loadEvents();
  }, [userId, userType, selectedDate]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const eventsData = await planningService.getUserEvents(userId, userType);
      setEvents(eventsData);
    } catch (error) {
      console.error('Erreur chargement événements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (eventId: string, status: PlanningEvent['status']) => {
    try {
      await planningService.updateEventStatus(eventId, status);
      await loadEvents(); // Recharger les événements
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      try {
        await planningService.deleteEvent(eventId);
        await loadEvents();
      } catch (error) {
        console.error('Erreur suppression événement:', error);
      }
    }
  };

  const getStatusColor = (status: PlanningEvent['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusLabel = (status: PlanningEvent['status']) => {
    switch (status) {
      case 'scheduled': return 'Planifié';
      case 'confirmed': return 'Confirmé';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      default: return 'En attente';
    }
  };

  const getStatusIcon = (status: PlanningEvent['status']) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Filtrer les événements par date sélectionnée
  const filteredEvents = events.filter(event => event.date === selectedDate);

  // Grouper les événements par date
  const eventsByDate = events.reduce((acc, event) => {
    if (!acc[event.date]) {
      acc[event.date] = [];
    }
    acc[event.date].push(event);
    return acc;
  }, {} as Record<string, PlanningEvent[]>);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement du planning...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec sélecteur de date */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Planning
            </CardTitle>
            <div className="flex items-center space-x-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <Button onClick={() => setShowCreateModal(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau rendez-vous
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Événements du jour sélectionné */}
      <Card>
        <CardHeader>
          <CardTitle>
            {new Date(selectedDate).toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun événement prévu ce jour</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <div key={event.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold">{event.title}</h3>
                        <Badge className={getStatusColor(event.status)}>
                          {getStatusIcon(event.status)}
                          <span className="ml-1">{getStatusLabel(event.status)}</span>
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          {event.time} ({event.duration || 60} min)
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          {event.location}
                        </div>
                        {event.notes && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-gray-700">
                            {event.notes}
                          </div>
                        )}
                      </div>

                      {event.project && (
                        <div className="mt-3 p-3 bg-orange-50 rounded-lg">
                          <p className="text-sm font-medium text-orange-800">
                            Projet: {event.project.title}
                          </p>
                          <p className="text-xs text-orange-600 mt-1">
                            {event.project.category}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {event.status === 'scheduled' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(event.id, 'confirmed')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(event.id, 'cancelled')}
                            className="text-red-600"
                          >
                            <AlertCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {event.status === 'confirmed' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(event.id, 'completed')}
                          className="bg-gray-600 hover:bg-gray-700"
                        >
                          Terminer
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteEvent(event.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vue calendrier mensuel */}
      <Card>
        <CardHeader>
          <CardTitle>Vue mensuelle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 text-center">
            {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
              <div key={day} className="font-semibold text-sm text-gray-600 py-2">
                {day}
              </div>
            ))}
            
            {/* Générer le calendrier */}
            {Array.from({ length: 35 }, (_, index) => {
              const date = new Date(selectedDate);
              date.setDate(1);
              const firstDay = date.getDay();
              const currentDate = index - firstDay + 1;
              date.setDate(currentDate);
              
              const dateStr = date.toISOString().split('T')[0];
              const dayEvents = eventsByDate[dateStr] || [];
              
              if (currentDate < 1 || currentDate > 31) {
                return <div key={index} className="p-2"></div>;
              }
              
              return (
                <div
                  key={index}
                  className={`border rounded-lg p-2 min-h-[80px] cursor-pointer hover:bg-gray-50 ${
                    dateStr === selectedDate ? 'bg-orange-50 border-orange-500' : ''
                  }`}
                  onClick={() => setSelectedDate(dateStr)}
                >
                  <div className="font-semibold text-sm">{currentDate}</div>
                  {dayEvents.length > 0 && (
                    <div className="mt-1">
                      <div className="text-xs bg-orange-100 text-orange-800 rounded px-1">
                        {dayEvents.length} événement{dayEvents.length > 1 ? 's' : ''}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {events.filter(e => e.status === 'scheduled').length}
              </div>
              <p className="text-sm text-gray-600">Planifiés</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {events.filter(e => e.status === 'confirmed').length}
              </div>
              <p className="text-sm text-gray-600">Confirmés</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {events.filter(e => e.status === 'completed').length}
              </div>
              <p className="text-sm text-gray-600">Terminés</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {events.filter(e => e.status === 'cancelled').length}
              </div>
              <p className="text-sm text-gray-600">Annulés</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
