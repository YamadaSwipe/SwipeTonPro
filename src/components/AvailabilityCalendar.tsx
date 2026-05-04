'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  MapPin,
  Check,
  X,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  format,
  addDays,
  startOfWeek,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  setHours,
  setMinutes,
} from 'date-fns';
import { fr } from 'date-fns/locale';

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  date: string;
  is_available: boolean;
  appointment_id?: string;
}

interface Appointment {
  id: string;
  professional_id: string;
  client_id: string;
  project_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  client?: {
    full_name: string;
    avatar_url?: string;
  };
  project?: {
    title: string;
    category: string;
  };
}

interface AvailabilityCalendarProps {
  professionalId: string;
  isOwnCalendar?: boolean;
  onAppointmentSelect?: (appointment: Appointment) => void;
}

export default function AvailabilityCalendar({
  professionalId,
  isOwnCalendar = false,
  onAppointmentSelect,
}: AvailabilityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);
  const [syncingGoogle, setSyncingGoogle] = useState(false);
  const { toast } = useToast();

  // Charger les disponibilités et rendez-vous
  useEffect(() => {
    loadAvailabilityAndAppointments();
  }, [currentDate, professionalId]);

  const loadAvailabilityAndAppointments = async () => {
    setLoading(true);
    try {
      const monthStart = format(
        startOfWeek(currentDate, { weekStartsOn: 1 }),
        'yyyy-MM-dd'
      );
      const monthEnd = format(
        addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), 42),
        'yyyy-MM-dd'
      );

      // Charger les time slots
      const { data: slotsData } = await (supabase as any)
        .from('time_slots')
        .select('*')
        .eq('professional_id', professionalId)
        .gte('date', monthStart)
        .lte('date', monthEnd)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      // Charger les rendez-vous
      const { data: appointmentsData } = await (supabase as any)
        .from('appointments')
        .select(
          `
          *,
          client:profiles!appointments_client_id_fkey(full_name, avatar_url),
          project:projects!appointments_project_id_fkey(title, category)
        `
        )
        .eq('professional_id', professionalId)
        .gte('date', monthStart)
        .lte('date', monthEnd)
        .neq('status', 'cancelled')
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      setTimeSlots(slotsData || []);
      setAppointments(appointmentsData || []);
    } catch (error) {
      console.error('Erreur chargement disponibilités:', error);
    } finally {
      setLoading(false);
    }
  };

  // Synchroniser avec Google Calendar
  const syncWithGoogleCalendar = async () => {
    setSyncingGoogle(true);
    try {
      const response = await fetch('/api/calendar/sync-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ professionalId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: '✅ Synchronisation réussie',
          description: `${data.synced} événements synchronisés depuis Google Calendar`,
        });
        loadAvailabilityAndAppointments();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'Erreur de synchronisation',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSyncingGoogle(false);
    }
  };

  // Génération des jours du calendrier
  const generateCalendarDays = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const days = [];

    for (let i = 0; i < 42; i++) {
      const day = addDays(start, i);
      days.push(day);
    }

    return days;
  };

  // Obtenir les time slots pour un jour donné
  const getTimeSlotsForDay = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return timeSlots.filter((slot) => slot.date === dayStr);
  };

  // Obtenir les rendez-vous pour un jour donné
  const getAppointmentsForDay = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return appointments.filter((apt) => apt.date === dayStr);
  };

  // Vérifier si un jour a des disponibilités
  const hasAvailability = (day: Date) => {
    const slots = getTimeSlotsForDay(day);
    return slots.some((slot) => slot.is_available);
  };

  // Vérifier si un jour a des rendez-vous
  const hasAppointments = (day: Date) => {
    const appointments = getAppointmentsForDay(day);
    return appointments.length > 0;
  };

  // Créer des time slots par défaut pour une journée
  const createDefaultTimeSlots = async (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const defaultSlots = [];

    // Créer des créneaux de 9h à 18h par heure
    for (let hour = 9; hour <= 18; hour++) {
      defaultSlots.push({
        professional_id: professionalId,
        date: dateStr,
        start_time: `${hour.toString().padStart(2, '0')}:00`,
        end_time: `${(hour + 1).toString().padStart(2, '0')}:00`,
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    try {
      const { error } = await (supabase as any)
        .from('time_slots')
        .insert(defaultSlots);

      if (error) throw error;

      toast({
        title: '✅ Créneaux créés',
        description: 'Les créneaux par défaut ont été créés pour cette journée',
      });

      loadAvailabilityAndAppointments();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Prendre un rendez-vous
  const bookAppointment = async (timeSlot: TimeSlot, notes?: string) => {
    try {
      const {
        data: { user },
      } = await (supabase as any).auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await (supabase as any)
        .from('appointments')
        .insert({
          professional_id: professionalId,
          client_id: user.id,
          date: timeSlot.date,
          start_time: timeSlot.start_time,
          end_time: timeSlot.end_time,
          status: 'pending',
          notes: notes || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Marquer le time slot comme non disponible
      await (supabase as any)
        .from('time_slots')
        .update({
          is_available: false,
          appointment_id: data.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', timeSlot.id);

      toast({
        title: '✅ Demande envoyée',
        description:
          'Votre demande de rendez-vous a été envoyée au professionnel',
      });

      loadAvailabilityAndAppointments();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Disponibilités
            </CardTitle>

            <div className="flex items-center gap-2">
              {isOwnCalendar && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={syncWithGoogleCalendar}
                  disabled={syncingGoogle}
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${syncingGoogle ? 'animate-spin' : ''}`}
                  />
                  {syncingGoogle ? 'Synchronisation...' : 'Sync Google'}
                </Button>
              )}

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                >
                  ←
                </Button>
                <span className="px-3 py-1 text-sm font-medium">
                  {format(currentDate, 'MMMM yyyy', { locale: fr })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                >
                  →
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Calendrier */}
      <Card>
        <CardContent className="p-6">
          {/* Jours de la semaine */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-600"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Jours du mois */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isDaySelected =
                selectedDate && isSameDay(day, selectedDate);
              const isDayToday = isToday(day);
              const hasAvail = hasAvailability(day);
              const hasApts = hasAppointments(day);

              return (
                <div
                  key={index}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    relative p-2 border rounded-lg cursor-pointer transition-all
                    ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
                    ${isDaySelected ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}
                    ${isDayToday ? 'ring-2 ring-orange-200' : ''}
                    hover:border-orange-300 hover:bg-orange-50/50
                  `}
                >
                  <div className="text-center">
                    <div
                      className={`text-sm font-medium ${isDayToday ? 'text-orange-600' : ''}`}
                    >
                      {format(day, 'd')}
                    </div>

                    {/* Indicateurs */}
                    <div className="flex justify-center gap-1 mt-1">
                      {hasAvail && (
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                      )}
                      {hasApts && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Détails du jour sélectionné */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
              </CardTitle>

              {isOwnCalendar &&
                getTimeSlotsForDay(selectedDate).length === 0 && (
                  <Button
                    size="sm"
                    onClick={() => createDefaultTimeSlots(selectedDate)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter créneaux
                  </Button>
                )}
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">
              {/* Time slots */}
              {getTimeSlotsForDay(selectedDate).map((slot) => {
                const appointment = appointments.find(
                  (apt) => apt.id === slot.appointment_id
                );

                return (
                  <div
                    key={slot.id}
                    className={`
                      flex items-center justify-between p-3 border rounded-lg
                      ${slot.is_available ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}
                      ${appointment ? 'border-blue-200 bg-blue-50' : ''}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4" />
                      <div>
                        <div className="font-medium">
                          {slot.start_time} - {slot.end_time}
                        </div>
                        {appointment && (
                          <div className="text-sm text-gray-600">
                            {appointment.client?.full_name} -{' '}
                            {appointment.project?.title}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {appointment && (
                        <>
                          <Badge
                            variant={
                              appointment.status === 'confirmed'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {appointment.status === 'confirmed'
                              ? 'Confirmé'
                              : 'En attente'}
                          </Badge>
                          {onAppointmentSelect && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onAppointmentSelect(appointment)}
                            >
                              Voir
                            </Button>
                          )}
                        </>
                      )}

                      {slot.is_available && !isOwnCalendar && (
                        <Button size="sm" onClick={() => bookAppointment(slot)}>
                          <Check className="w-4 h-4 mr-1" />
                          Réserver
                        </Button>
                      )}

                      {isOwnCalendar && !appointment && (
                        <Button
                          size="sm"
                          variant={
                            slot.is_available ? 'destructive' : 'default'
                          }
                          onClick={async () => {
                            await (supabase as any)
                              .from('time_slots')
                              .update({
                                is_available: !slot.is_available,
                                updated_at: new Date().toISOString(),
                              })
                              .eq('id', slot.id);
                            loadAvailabilityAndAppointments();
                          }}
                        >
                          {slot.is_available ? (
                            <X className="w-4 h-4" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}

              {getTimeSlotsForDay(selectedDate).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun créneau disponible pour cette date</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
