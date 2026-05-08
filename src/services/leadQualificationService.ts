import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { Lead, LeadInsert, LeadUpdate } from '@/integrations/supabase/types';

export interface LeadQualification {
  id: string;
  projectId: string;
  clientId: string;
  professionalId?: string;
  qualificationScore: number;
  status:
    | 'new'
    | 'contacted'
    | 'qualified'
    | 'hot'
    | 'cold'
    | 'converted'
    | 'lost';
  budget: number;
  timeline: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  notes: string;
  contactAttempts: number;
  lastContactDate?: string;
  nextActionDate?: string;
  assignedTo?: string;
  source: 'organic' | 'paid' | 'referral' | 'direct';
  createdAt: string;
  updatedAt: string;
}

export interface QualificationCriteria {
  // Critères de qualification
  hasValidBudget: boolean;
  hasClearTimeline: boolean;
  hasUrgency: boolean;
  hasContactInfo: boolean;
  hasProjectDetails: boolean;
  isDecisionMaker: boolean;
  hasPermit: boolean;
  hasFinancing: boolean;

  // Score calculé
  totalScore: number;
  qualificationLevel: 'cold' | 'warm' | 'hot';
}

export const leadQualificationService = {
  /**
   * Créer un nouveau lead à partir d'un projet
   */
  async createLeadFromProject(
    projectId: string,
    clientId: string
  ): Promise<{ data: Lead | null; error: Error | null }> {
    try {
      // Récupérer les détails du projet
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError || !project) {
        throw new Error('Projet non trouvé');
      }

      // Calculer le score de qualification
      const qualification = await this.calculateQualificationScore(project);

      // Créer le lead
      const leadData: any = {
        project_id: projectId,
        client_id: clientId,
        qualification_score: qualification.totalScore,
        status: this.getLeadStatusFromScore(qualification.totalScore),
        budget: project.budget_max || 0,
        timeline: (project as any).timeline || 'Non défini',
        urgency: this.getUrgencyFromTimeline((project as any).timeline),
        notes: `Lead généré depuis le projet: ${project.title}`,
        contact_attempts: 0,
        source: 'organic',
        qualification_data: qualification,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await (supabase as any)
        .from('leads')
        .insert(leadData)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erreur création lead:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Calculer le score de qualification d'un projet
   */
  async calculateQualificationScore(
    project: any
  ): Promise<QualificationCriteria> {
    let score = 0;
    const criteria: QualificationCriteria = {
      hasValidBudget: false,
      hasClearTimeline: false,
      hasUrgency: false,
      hasContactInfo: false,
      hasProjectDetails: false,
      isDecisionMaker: true, // Par défaut, à vérifier
      hasPermit: false,
      hasFinancing: false,
      totalScore: 0,
      qualificationLevel: 'cold',
    };

    // Budget (30 points)
    if (project.budget_max && project.budget_max > 1000) {
      criteria.hasValidBudget = true;
      score += 30;
    }

    // Timeline (20 points)
    if (project.deadline && project.deadline !== '') {
      criteria.hasClearTimeline = true;
      score += 20;
    }

    // Urgency (15 points)
    const urgency = this.getUrgencyFromTimeline(project.deadline);
    if (urgency === 'urgent' || urgency === 'high') {
      criteria.hasUrgency = true;
      score += 15;
    }

    // Détails du projet (15 points)
    if (project.description && project.description.length > 100) {
      criteria.hasProjectDetails = true;
      score += 15;
    }

    // Contact info (10 points)
    if (project.client_email || project.client_phone) {
      criteria.hasContactInfo = true;
      score += 10;
    }

    // Permis (5 points)
    const workTypesStr = Array.isArray(project.work_type)
      ? project.work_type.join(' ')
      : project.work_type || '';
    if (
      project.work_type &&
      !workTypesStr.toLowerCase().includes('démolition')
    ) {
      criteria.hasPermit = true;
      score += 5;
    }

    // Financement (5 points)
    if (project.budget_max && project.budget_max > 5000) {
      criteria.hasFinancing = true;
      score += 5;
    }

    criteria.totalScore = score;
    criteria.qualificationLevel = this.getQualificationLevel(score);

    return criteria;
  },

  /**
   * Déterminer le niveau de qualification
   */
  getQualificationLevel(score: number): 'cold' | 'warm' | 'hot' {
    if (score >= 70) return 'hot';
    if (score >= 40) return 'warm';
    return 'cold';
  },

  /**
   * Déterminer le statut du lead selon le score
   */
  getLeadStatusFromScore(score: number): 'hot' | 'warm' | 'cold' {
    if (score >= 70) return 'hot';
    if (score >= 40) return 'warm';
    return 'cold';
  },

  /**
   * Déterminer l'urgence selon le délai
   */
  getUrgencyFromTimeline(timeline?: string): Lead['urgency'] {
    if (!timeline) return 'medium';

    const timelineLower = timeline.toLowerCase();
    if (
      timelineLower.includes('urgent') ||
      timelineLower.includes('immédiat')
    ) {
      return 'urgent';
    }
    if (
      timelineLower.includes('1 semaine') ||
      timelineLower.includes('2 semaines')
    ) {
      return 'high';
    }
    if (timelineLower.includes('1 mois') || timelineLower.includes('2 mois')) {
      return 'medium';
    }
    return 'low';
  },

  /**
   * Mettre à jour le statut d'un lead
   */
  async updateLeadStatus(
    leadId: string,
    status: Lead['status'],
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (notes) {
        updateData.notes = notes;
      }

      if (status === 'warm') {
        updateData.contact_attempts = 1;
        updateData.last_contact_date = new Date().toISOString();
      }

      const { error } = await (supabase as any)
        .from('leads')
        .update(updateData)
        .eq('id', leadId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Erreur mise à jour lead:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Assigner un lead à un commercial
   */
  async assignLead(
    leadId: string,
    assignedTo: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase as any)
        .from('leads')
        .update({
          assigned_to: assignedTo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Erreur assignation lead:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Récupérer les leads pour un commercial
   */
  async getLeadsForCommercial(
    commercialId: string,
    filters?: {
      status?: Lead['status'];
      urgency?: Lead['urgency'];
      qualificationLevel?: 'cold' | 'warm' | 'hot';
    }
  ): Promise<{ data: Lead[] | null; error: Error | null }> {
    try {
      let query = (supabase as any)
        .from('leads')
        .select('*')
        .eq('assigned_to', commercialId)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.urgency) {
        query = query.eq('urgency', filters.urgency);
      }
      if (filters?.qualificationLevel) {
        const scoreRange =
          filters.qualificationLevel === 'hot'
            ? [70, 100]
            : filters.qualificationLevel === 'warm'
              ? [40, 69]
              : [0, 39];
        query = query
          .gte('qualification_score', scoreRange[0])
          .lte('qualification_score', scoreRange[1]);
      }

      const { data, error } = await query;
      return { data, error: error as Error };
    } catch (error) {
      console.error('Erreur récupération leads:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Récupérer les statistiques des leads
   */
  async getLeadStats(commercialId?: string): Promise<{
    total: number;
    new: number;
    contacted: number;
    qualified: number;
    hot: number;
    converted: number;
    lost: number;
    conversionRate: number;
  }> {
    try {
      let query = (supabase as any).from('leads').select('*');

      if (commercialId) {
        query = query.eq('assigned_to', commercialId);
      }

      const { data, error } = await query;

      if (error || !data) {
        throw error;
      }

      const stats = {
        total: data.length,
        new: data.filter((l) => l.status === 'new').length,
        contacted: data.filter((l) => l.status === 'contacted').length,
        qualified: data.filter((l) => l.status === 'qualified').length,
        hot: data.filter((l) => l.status === 'hot').length,
        converted: data.filter((l) => l.status === 'converted').length,
        lost: data.filter((l) => l.status === 'lost').length,
        conversionRate: 0,
      };

      stats.conversionRate =
        stats.total > 0 ? (stats.converted / stats.total) * 100 : 0;

      return stats;
    } catch (error) {
      console.error('Erreur statistiques leads:', error);
      return {
        total: 0,
        new: 0,
        contacted: 0,
        qualified: 0,
        hot: 0,
        converted: 0,
        lost: 0,
        conversionRate: 0,
      };
    }
  },

  /**
   * Exporter les leads en CSV
   */
  async exportLeadsToCSV(
    commercialId?: string
  ): Promise<{ data: string | null; error: Error | null }> {
    try {
      const { data, error } = await this.getLeadsForCommercial(
        commercialId || ''
      );

      if (error || !data) {
        throw error;
      }

      // Créer le CSV
      const headers = [
        'ID',
        'Projet',
        'Client',
        'Statut',
        'Score',
        'Budget',
        'Délai',
        'Urgence',
        'Date création',
        'Dernier contact',
        'Assigné à',
      ];

      const rows = data.map((lead) => [
        lead.id,
        lead.project_id,
        lead.client_id,
        lead.status,
        lead.qualification_score,
        lead.budget,
        lead.timeline,
        lead.urgency,
        lead.created_at,
        lead.last_contact_date || 'N/A',
        lead.assigned_to || 'Non assigné',
      ]);

      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(','))
        .join('\n');

      return { data: csvContent, error: null };
    } catch (error) {
      console.error('Erreur export CSV:', error);
      return { data: null, error: error as Error };
    }
  },
};
