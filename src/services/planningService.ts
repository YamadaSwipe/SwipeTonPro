import { emailService, EmailTemplate } from './emailService';
import { supabase } from '@/integrations/supabase/client';

export interface PlanningEvent {
  id: string;
  projectId: string;
  professionalId: string;
  clientId: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  duration: number; // en minutes
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  location: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  project?: {
    title: string;
    description: string;
    category: string;
  };
  professional?: {
    name: string;
    email: string;
    phone: string;
  };
  client?: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface PlanningSlot {
  date: string;
  time: string;
  available: boolean;
  reason?: string;
}

class PlanningService {
  // Créer un événement de planning
  async createPlanningEvent(data: {
    projectId: string;
    professionalId: string;
    clientId: string;
    date: string;
    time: string;
    duration?: number;
    location: string;
    notes?: string;
  }): Promise<{ success: boolean; error?: string; event?: PlanningEvent }> {
    try {
      // Vérifier que le créneau est disponible
      const isAvailable = await this.checkSlotAvailability(
        data.professionalId, 
        data.date, 
        data.time, 
        data.duration || 60
      );

      if (!isAvailable) {
        return { success: false, error: 'Ce créneau n\'est pas disponible' };
      }

      // Récupérer les informations du projet et des utilisateurs
      const { data: projectData } = await supabase
        .from('projects')
        .select('title, description, category, city, postal_code')
        .eq('id', data.projectId)
        .single();

      const { data: professionalData } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', data.professionalId)
        .single();

      const { data: clientData } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', data.clientId)
        .single();

      // Créer l'événement
      const { data: event, error } = await (supabase as any)
        .from('planning_events')
        .insert({
          project_id: data.projectId,
          professional_id: data.professionalId,
          client_id: data.clientId,
          title: `Rendez-vous - ${projectData?.title}`,
          date: data.date,
          time: data.time,
          duration: data.duration || 60,
          location: data.location,
          notes: data.notes,
          status: 'scheduled'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Envoyer les emails de notification
      if (projectData && professionalData && clientData) {
        const emailTemplate: EmailTemplate = {
          projectName: projectData.title,
          clientName: clientData.full_name,
          professionalName: professionalData.full_name,
          clientEmail: clientData.email,
          professionalEmail: professionalData.email,
          projectDescription: projectData.description,
          budget: '',
          location: `${projectData.city} ${projectData.postal_code}`,
          planningDate: new Date(data.date).toLocaleDateString('fr-FR'),
          planningTime: data.time
        };

        await emailService.notifyPlanningScheduled(emailTemplate);
      }

      return { success: true, event: event as PlanningEvent };
    } catch (error) {
      console.error('Erreur création planning:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      };
    }
  }

  // Mettre à jour le statut d'un événement
  async updateEventStatus(
    eventId: string, 
    status: PlanningEvent['status'],
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase as any)
        .from('planning_events')
        .update({ 
          status, 
          notes: notes || undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId);

      if (error) {
        throw error;
      }

      // Récupérer les détails pour envoyer les notifications
      const { data: event } = await (supabase as any)
        .from('planning_events')
        .select(`
          *,
          projects:project_id (title, description),
          professional:professional_id (full_name, email),
          client:client_id (full_name, email)
        `)
        .eq('id', eventId)
        .single();

      if (event && status === 'confirmed') {
        const emailTemplate: EmailTemplate = {
          projectName: event.projects.title,
          clientName: event.client.full_name,
          professionalName: event.professional.full_name,
          clientEmail: event.client.email,
          professionalEmail: event.professional.email,
          projectDescription: event.projects.description,
          budget: '',
          location: event.location,
          planningDate: new Date(event.date).toLocaleDateString('fr-FR'),
          planningTime: event.time
        };

        await emailService.notifyPlanningScheduled(emailTemplate);
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur mise à jour planning:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      };
    }
  }

  // Récupérer les événements d'un utilisateur
  async getUserEvents(
    userId: string, 
    userType: 'professional' | 'client',
    startDate?: string,
    endDate?: string
  ): Promise<PlanningEvent[]> {
    try {
      let query = (supabase as any)
        .from('planning_events')
        .select(`
          *,
          projects:project_id (title, description, category),
          professional:professional_id (full_name, email, phone),
          client:client_id (full_name, email, phone)
        `);

      // Filtrer par utilisateur
      if (userType === 'professional') {
        query = query.eq('professional_id', userId);
      } else {
        query = query.eq('client_id', userId);
      }

      // Filtrer par dates si spécifiées
      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      // Trier par date et heure
      query = query.order('date', { ascending: true }).order('time', { ascending: true });

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data as PlanningEvent[];
    } catch (error) {
      console.error('Erreur récupération événements:', error);
      return [];
    }
  }

  // Vérifier la disponibilité d'un créneau
  async checkSlotAvailability(
    professionalId: string,
    date: string,
    time: string,
    duration: number
  ): Promise<boolean> {
    try {
      // Récupérer tous les événements du professionnel pour cette date
      const { data: events, error } = await (supabase as any)
        .from('planning_events')
        .select('time, duration, status')
        .eq('professional_id', professionalId)
        .eq('date', date)
        .in('status', ['scheduled', 'confirmed']);

      if (error) {
        throw error;
      }

      // Convertir les heures en minutes pour faciliter la comparaison
      const [hours, minutes] = time.split(':').map(Number);
      const startTime = hours * 60 + minutes;
      const endTime = startTime + duration;

      // Vérifier s'il y a un conflit
      for (const event of events || []) {
        const [eventHours, eventMinutes] = event.time.split(':').map(Number);
        const eventStartTime = eventHours * 60 + eventMinutes;
        const eventEndTime = eventStartTime + (event.duration || 60);

        // Vérifier le chevauchement
        if (
          (startTime < eventEndTime && endTime > eventStartTime) ||
          (eventStartTime < endTime && eventEndTime > startTime)
        ) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Erreur vérification disponibilité:', error);
      return false;
    }
  }

  // Obtenir les créneaux disponibles pour un professionnel
  async getAvailableSlots(
    professionalId: string,
    date: string,
    duration: number = 60
  ): Promise<PlanningSlot[]> {
    try {
      const slots: PlanningSlot[] = [];
      
      // Générer les créneaux de 8h à 19h (avec des créneaux d'une heure)
      for (let hour = 8; hour <= 18; hour++) {
        const time = `${hour.toString().padStart(2, '0')}:00`;
        
        const isAvailable = await this.checkSlotAvailability(
          professionalId,
          date,
          time,
          duration
        );

        slots.push({
          date,
          time,
          available: isAvailable,
          reason: isAvailable ? undefined : 'Déjà occupé'
        });
      }

      return slots;
    } catch (error) {
      console.error('Erreur récupération créneaux:', error);
      return [];
    }
  }

  // Supprimer un événement
  async deleteEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase as any)
        .from('planning_events')
        .delete()
        .eq('id', eventId);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur suppression événement:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      };
    }
  }

  // Envoyer des rappels automatiques
  async sendReminders(): Promise<void> {
    try {
      // Récupérer les événements de demain
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const { data: events, error } = await (supabase as any)
        .from('planning_events')
        .select(`
          *,
          projects:project_id (title, description),
          professional:professional_id (full_name, email),
          client:client_id (full_name, email)
        `)
        .eq('date', tomorrowStr)
        .in('status', ['scheduled', 'confirmed']);

      if (error) {
        throw error;
      }

      // Envoyer les rappels
      for (const event of events || []) {
        const emailTemplate: EmailTemplate = {
          projectName: event.projects.title,
          clientName: event.client.full_name,
          professionalName: event.professional.full_name,
          clientEmail: event.client.email,
          professionalEmail: event.professional.email,
          projectDescription: event.projects.description,
          budget: '',
          location: event.location,
          planningDate: new Date(event.date).toLocaleDateString('fr-FR'),
          planningTime: event.time
        };

        await emailService.sendPlanningReminder(emailTemplate);
      }
    } catch (error) {
      console.error('Erreur envoi rappels:', error);
    }
  }

  // Obtenir le calendrier mensuel
  async getMonthlyCalendar(
    userId: string,
    userType: 'professional' | 'client',
    year: number,
    month: number
  ): Promise<{ [date: string]: PlanningEvent[] }> {
    try {
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;

      const events = await this.getUserEvents(userId, userType, startDate, endDate);
      
      // Grouper par date
      const calendar: { [date: string]: PlanningEvent[] } = {};
      
      for (const event of events) {
        if (!calendar[event.date]) {
          calendar[event.date] = [];
        }
        calendar[event.date].push(event);
      }

      return calendar;
    } catch (error) {
      console.error('Erreur calendrier mensuel:', error);
      return {};
    }
  }
}

export const planningService = new PlanningService();
