import { supabase } from '@/integrations/supabase/client';
import { emailService } from './emailService';

interface EmailSequence {
  id: string;
  name: string;
  description: string;
  triggers: string[];
  delays: number[];
  templates: string[];
  active: boolean;
}

interface SequenceStep {
  delay: number; // en heures
  template: string;
  subject: string;
  variables?: Record<string, any>;
}

interface LeadData {
  id: string;
  email: string;
  name: string;
  project_type: string;
  budget: string;
  timeline: string;
  urgency: string;
  qualification_score: number;
  status: string;
}

export const emailSequenceService = {
  // Séquences prédéfinies
  sequences: {
    welcomeNewLead: {
      id: 'welcome-new-lead',
      name: 'Bienvenue Nouveau Lead',
      description: 'Séquence pour les nouveaux leads qualifiés',
      triggers: ['lead_created', 'lead_qualified'],
      steps: [
        {
          delay: 0, // Immédiat
          template: 'welcome-lead',
          subject: 'Bienvenue sur EDSwipe - Votre projet de travaux',
        },
        {
          delay: 24, // 24h après
          template: 'followup-1',
          subject: 'Comment se passe votre projet de travaux ?',
        },
        {
          delay: 72, // 3 jours après
          template: 'followup-2',
          subject: 'Des professionnels sont prêts pour votre projet',
        },
        {
          delay: 168, // 7 jours après
          template: 'followup-3',
          subject: 'Dernière relance - Votre projet EDSwipe',
        },
      ],
    },
    hotLeadUrgent: {
      id: 'hot-lead-urgent',
      name: 'Lead Chaud Urgent',
      description: 'Séquence pour les leads chauds avec urgence élevée',
      triggers: ['lead_hot', 'urgency_high'],
      steps: [
        {
          delay: 0,
          template: 'urgent-lead',
          subject: 'URGENT - Des professionnels disponibles immédiatement',
        },
        {
          delay: 2, // 2h après
          template: 'urgent-followup',
          subject: 'Confirmation urgence - Professionnels en attente',
        },
        {
          delay: 6, // 6h après
          template: 'urgent-final',
          subject: 'Dernière chance - Intervention aujourd\'hui possible',
        },
      ],
    },
    conversionReminder: {
      id: 'conversion-reminder',
      name: 'Rappel Conversion',
      description: 'Rappel pour les leads proches de la conversion',
      triggers: ['lead_warm', 'high_score'],
      steps: [
        {
          delay: 0,
          template: 'conversion-ready',
          subject: 'Votre projet est prêt pour la réalisation !',
        },
        {
          delay: 48,
          template: 'conversion-incentive',
          subject: 'Offre spéciale pour votre projet de travaux',
        },
      ],
    },
    reEngagement: {
      id: 're-engagement',
      name: 'Réengagement',
      description: 'Séquence pour réengager les leads froids',
      triggers: ['lead_cold', 'no_activity_30d'],
      steps: [
        {
          delay: 0,
          template: 'we-miss-you',
          subject: 'On pense à votre projet de travaux !',
        },
        {
          delay: 168, // 7 jours
          template: 'new-opportunities',
          subject: 'Nouvelles opportunités pour vos travaux',
        },
      ],
    },
  },

  /**
   * Démarrer une séquence email pour un lead
   */
  async startSequence(
    leadId: string, 
    sequenceKey: keyof typeof emailSequenceService.sequences,
    customData?: Partial<LeadData>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const sequence = emailSequenceService.sequences[sequenceKey];
      if (!sequence) {
        return { success: false, error: 'Séquence non trouvée' };
      }

      // Récupérer les données du lead
      const { data: lead, error: leadError } = await (supabase as any)
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (leadError || !lead) {
        return { success: false, error: 'Lead non trouvé' };
      }

      // Fusionner avec les données personnalisées
      const leadData = { ...lead, ...customData };

      // Programmer chaque étape de la séquence
      for (const step of sequence.steps) {
        await emailSequenceService.scheduleEmailStep(leadData, step, sequence.id);
      }

      // Marquer la séquence comme démarrée
      await (supabase as any)
        .from('email_sequences')
        .insert({
          lead_id: leadId,
          sequence_id: sequence.id,
          started_at: new Date().toISOString(),
          status: 'active',
        });

      return { success: true };
    } catch (error) {
      console.error('Erreur démarrage séquence:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Programmer une étape d'email
   */
  async scheduleEmailStep(
    leadData: LeadData,
    step: SequenceStep,
    sequenceId: string
  ): Promise<void> {
    const scheduledTime = new Date();
    scheduledTime.setHours(scheduledTime.getHours() + step.delay);

    // Préparer les variables pour le template
    const variables = {
      leadName: leadData.name,
      leadEmail: leadData.email,
      projectType: leadData.project_type,
      budget: leadData.budget,
      timeline: leadData.timeline,
      urgency: leadData.urgency,
      qualificationScore: leadData.qualification_score,
      leadId: leadData.id,
      ...step.variables,
    };

    // Sauvegarder l'email programmé
    await (supabase as any)
      .from('scheduled_emails')
      .insert({
        lead_id: leadData.id,
        sequence_id: sequenceId,
        template: step.template,
        subject: step.subject,
        variables,
        scheduled_for: scheduledTime.toISOString(),
        status: 'scheduled',
      });
  },

  /**
   * Traiter les emails programmés
   */
  async processScheduledEmails(): Promise<{ processed: number; errors: number }> {
    try {
      const now = new Date().toISOString();

      // Récupérer les emails à envoyer
      const { data: scheduledEmails, error } = await (supabase as any)
        .from('scheduled_emails')
        .select('*')
        .eq('status', 'scheduled')
        .lte('scheduled_for', now);

      if (error) throw error;

      let processed = 0;
      let errors = 0;

      for (const email of scheduledEmails || []) {
        try {
          // Envoyer l'email
          await emailService.sendGeneralNotification({
            to: email.lead_email,
            subject: email.subject || 'Notification SwipeTonPro',
            message: email.template || 'Message automatique'
          });

          // Marquer comme envoyé
          await (supabase as any)
            .from('scheduled_emails')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
            })
            .eq('id', email.id);

          processed++;
        } catch (emailError) {
          console.error('Erreur envoi email programmé:', emailError);
          
          // Marquer comme erreur
          await (supabase as any)
            .from('scheduled_emails')
            .update({
              status: 'error',
              error_message: (emailError as Error).message,
              attempted_at: new Date().toISOString(),
            })
            .eq('id', email.id);

          errors++;
        }
      }

      return { processed, errors };
    } catch (error) {
      console.error('Erreur traitement emails programmés:', error);
      return { processed: 0, errors: 1 };
    }
  },

  /**
   * Arrêter une séquence pour un lead
   */
  async stopSequence(leadId: string, sequenceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Marquer les emails non envoyés comme annulés
      await (supabase as any)
        .from('scheduled_emails')
        .update({ status: 'cancelled' })
        .eq('lead_id', leadId)
        .eq('sequence_id', sequenceId)
        .eq('status', 'scheduled');

      // Marquer la séquence comme arrêtée
      await (supabase as any)
        .from('email_sequences')
        .update({
          status: 'stopped',
          stopped_at: new Date().toISOString(),
        })
        .eq('lead_id', leadId)
        .eq('sequence_id', sequenceId);

      return { success: true };
    } catch (error) {
      console.error('Erreur arrêt séquence:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Obtenir les statistiques des séquences
   */
  async getSequenceStats(): Promise<any> {
    try {
      const { data, error } = await (supabase as any)
        .from('email_sequences')
        .select(`
          *,
          scheduled_emails(count),
          leads(name, email)
        `);

      if (error) throw error;

      const stats = {
        totalSequences: data?.length || 0,
        activeSequences: data?.filter(s => s.status === 'active').length || 0,
        completedSequences: data?.filter(s => s.status === 'completed').length || 0,
        totalEmails: data?.reduce((acc, s) => acc + (s.scheduled_emails?.[0]?.count || 0), 0) || 0,
        sentEmails: 0, // À calculer depuis scheduled_emails
        openRate: 0, // À calculer depuis tracking
        clickRate: 0, // À calculer depuis tracking
      };

      return stats;
    } catch (error) {
      console.error('Erreur stats séquences:', error);
      return null;
    }
  },

  /**
   * Démarrer automatiquement les séquences basées sur les triggers
   */
  async triggerSequences(
    trigger: string, 
    leadData: LeadData
  ): Promise<void> {
    // Trouver les séquences qui correspondent au trigger
    const matchingSequences = Object.entries(emailSequenceService.sequences)
      .filter(([_, sequence]) => (sequence as any).triggers.includes(trigger));

    for (const [sequenceKey, sequence] of matchingSequences) {
      await emailSequenceService.startSequence(leadData.id, sequenceKey as keyof typeof emailSequenceService.sequences);
    }
  },

  /**
   * Créer des séquences personnalisées
   */
  async createCustomSequence(sequence: Partial<EmailSequence>): Promise<{ success: boolean; error?: string; id?: string }> {
    try {
      const { data, error } = await (supabase as any)
        .from('custom_email_sequences')
        .insert({
          name: sequence.name,
          description: sequence.description,
          triggers: sequence.triggers,
          steps: (sequence as any).steps || [],
          active: sequence.active ?? true,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, id: data.id };
    } catch (error) {
      console.error('Erreur création séquence personnalisée:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Tester une séquence avant envoi
   */
  async testSequence(
    sequenceKey: keyof typeof emailSequenceService.sequences,
    testData: Partial<LeadData>
  ): Promise<{ success: boolean; preview?: any; error?: string }> {
    try {
      const sequence = emailSequenceService.sequences[sequenceKey];
      if (!sequence) {
        return { success: false, error: 'Séquence non trouvée' };
      }

      // Générer un aperçu des emails
      const preview = sequence.steps.map(step => ({
        delay: step.delay,
        subject: step.subject,
        template: step.template,
        variables: {
          leadName: testData.name || 'Test User',
          leadEmail: testData.email || 'test@example.com',
          projectType: testData.project_type || 'Test Project',
          ...step.variables,
        },
      }));

      return { success: true, preview };
    } catch (error) {
      console.error('Erreur test séquence:', error);
      return { success: false, error: (error as Error).message };
    }
  },
};

// Export pour utilisation dans les composants
export default emailSequenceService;
