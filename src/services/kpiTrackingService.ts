import { supabase } from '@/integrations/supabase/client';

// Types pour les KPI détaillés
export interface ProjectKPIs {
  // % projet avec estimation realiste
  totalProjects: number;
  projectsWithAIEstimation: number;
  realisticEstimationRate: number;
  
  // Breakdown by status
  byStatus: {
    pending_validation: number;
    validated: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
}

export interface ProfessionalKPIs {
  // % artisans qui postule
  totalProfessionals: number;
  activeProfessionals: number;
  professionalsWithBids: number;
  applicationRate: number;
  
  // Average bids per professional
  avgBidsPerPro: number;
  totalBids: number;
}

export interface ClientKPIs {
  // % particulier qui acceptent
  totalClients: number;
  clientsWithProjects: number;
  clientsWhoAccepted: number;
  acceptanceRate: number;
  
  // Response time
  avgResponseTime: number;
}

export interface MatchKPIs {
  totalMatches: number;
  
  // % matchs > devis envoyé
  matchesWithQuote: number;
  quoteSentRate: number;
  
  // % matchs > chantier signé
  matchesWithContract: number;
  contractSignedRate: number;
  
  // % de refus
  rejectedMatches: number;
  rejectionRate: number;
  
  // Conversion funnel
  funnel: {
    match: number;
    quote_sent: number;
    quote_accepted: number;
    contract_signed: number;
    project_started: number;
    project_completed: number;
  };
}

export interface ConversionFunnel {
  stage: string;
  count: number;
  percentage: number;
  dropOff: number;
}

export interface GlobalKPIDashboard {
  projects: ProjectKPIs;
  professionals: ProfessionalKPIs;
  clients: ClientKPIs;
  matches: MatchKPIs;
  conversionFunnel: ConversionFunnel[];
  lastUpdated: string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  label: string;
}

export interface KPITimeSeries {
  metric: string;
  data: TimeSeriesData[];
}

/**
 * Récupère les KPI des projets (% avec estimation réaliste)
 */
export async function getProjectKPIs(timeRange?: { start?: string; end?: string }): Promise<ProjectKPIs> {
  try {
    let query = supabase.from('projects').select('*');
    
    if (timeRange?.start) {
      query = query.gte('created_at', timeRange.start);
    }
    if (timeRange?.end) {
      query = query.lte('created_at', timeRange.end);
    }
    
    const { data: projects, error } = await query;
    
    if (error) throw error;
    
    const totalProjects = projects?.length || 0;
    
    // Projets avec estimation IA réaliste (différence budget min/max < 50%)
    const projectsWithAIEstimation = projects?.filter(p => {
      if (!p.ai_analysis && !p.ai_estimation) return false;
      const budgetDiff = p.estimated_budget_max && p.estimated_budget_min 
        ? (p.estimated_budget_max - p.estimated_budget_min) / p.estimated_budget_min 
        : 0;
      return budgetDiff < 0.5; // Écart < 50% considéré comme réaliste
    }).length || 0;
    
    const realisticEstimationRate = totalProjects > 0 
      ? Math.round((projectsWithAIEstimation / totalProjects) * 100) 
      : 0;
    
    // Breakdown by status
    const byStatus = {
      pending_validation: projects?.filter(p => p.status === 'pending_validation').length || 0,
      validated: projects?.filter(p => p.status === 'validated').length || 0,
      in_progress: projects?.filter(p => p.status === 'in_progress').length || 0,
      completed: projects?.filter(p => p.status === 'completed').length || 0,
      cancelled: projects?.filter(p => p.status === 'cancelled').length || 0,
    };
    
    return {
      totalProjects,
      projectsWithAIEstimation,
      realisticEstimationRate,
      byStatus,
    };
  } catch (error) {
    console.error('Error fetching project KPIs:', error);
    return {
      totalProjects: 0,
      projectsWithAIEstimation: 0,
      realisticEstimationRate: 0,
      byStatus: { pending_validation: 0, validated: 0, in_progress: 0, completed: 0, cancelled: 0 },
    };
  }
}

/**
 * Récupère les KPI des professionnels (% qui postulent)
 */
export async function getProfessionalKPIs(timeRange?: { start?: string; end?: string }): Promise<ProfessionalKPIs> {
  try {
    // Récupérer tous les professionnels actifs
    const { data: professionals, error: proError } = await supabase
      .from('professionals')
      .select('id, user_id, created_at');
    
    if (proError) throw proError;
    
    // Récupérer tous les bids (postulations)
    let bidsQuery = supabase.from('bids').select('professional_id, id');
    if (timeRange?.start) bidsQuery = bidsQuery.gte('created_at', timeRange.start);
    if (timeRange?.end) bidsQuery = bidsQuery.lte('created_at', timeRange.end);
    
    const { data: bids, error: bidsError } = await bidsQuery;
    
    if (bidsError) throw bidsError;
    
    const totalProfessionals = professionals?.length || 0;
    const totalBids = bids?.length || 0;
    
    // Professionnels qui ont postulé (au moins un bid)
    const proIdsWithBids = new Set(bids?.map(b => b.professional_id) || []);
    const professionalsWithBids = proIdsWithBids.size;
    
    const applicationRate = totalProfessionals > 0 
      ? Math.round((professionalsWithBids / totalProfessionals) * 100) 
      : 0;
    
    // Moyenne de bids par professionnel actif
    const avgBidsPerPro = totalProfessionals > 0 
      ? Math.round((totalBids / totalProfessionals) * 10) / 10 
      : 0;
    
    return {
      totalProfessionals,
      activeProfessionals: totalProfessionals,
      professionalsWithBids,
      applicationRate,
      avgBidsPerPro,
      totalBids,
    };
  } catch (error) {
    console.error('Error fetching professional KPIs:', error);
    return {
      totalProfessionals: 0,
      activeProfessionals: 0,
      professionalsWithBids: 0,
      applicationRate: 0,
      avgBidsPerPro: 0,
      totalBids: 0,
    };
  }
}

/**
 * Récupère les KPI des clients (% qui acceptent)
 */
export async function getClientKPIs(timeRange?: { start?: string; end?: string }): Promise<ClientKPIs> {
  try {
    // Récupérer les profils clients
    const { data: clients, error: clientError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'client');
    
    if (clientError) throw clientError;
    
    // Récupérer les projets avec acceptations
    let projectsQuery = supabase.from('projects').select('id, status, client_id, assigned_to, accepted_bid_id');
    if (timeRange?.start) projectsQuery = projectsQuery.gte('created_at', timeRange.start);
    if (timeRange?.end) projectsQuery = projectsQuery.lte('created_at', timeRange.end);
    
    const { data: projects, error: projError } = await projectsQuery;
    
    if (projError) throw projError;
    
    const totalClients = clients?.length || 0;
    const clientsWithProjects = new Set(projects?.map(p => p.client_id)).size;
    
    // Clients qui ont accepté une offre (projet assigné ou bid accepté)
    const clientsWhoAccepted = projects?.filter(p => 
      p.status === 'in_progress' || 
      p.status === 'completed' || 
      p.assigned_to || 
      p.accepted_bid_id
    ).length || 0;
    
    const acceptanceRate = clientsWithProjects > 0 
      ? Math.round((clientsWhoAccepted / clientsWithProjects) * 100) 
      : 0;
    
    // Temps de réponse moyen (simplifié)
    const avgResponseTime = 48;
    
    return {
      totalClients,
      clientsWithProjects,
      clientsWhoAccepted,
      acceptanceRate,
      avgResponseTime,
    };
  } catch (error) {
    console.error('Error fetching client KPIs:', error);
    return {
      totalClients: 0,
      clientsWithProjects: 0,
      clientsWhoAccepted: 0,
      acceptanceRate: 0,
      avgResponseTime: 0,
    };
  }
}

/**
 * Récupère les KPI des matchs (conversion funnel)
 */
export async function getMatchKPIs(timeRange?: { start?: string; end?: string }): Promise<MatchKPIs> {
  try {
    // Match payments = mise en relation payée
    let matchQuery = supabase.from('match_payments').select('*');
    if (timeRange?.start) matchQuery = matchQuery.gte('created_at', timeRange.start);
    if (timeRange?.end) matchQuery = matchQuery.lte('created_at', timeRange.end);
    
    const { data: matches, error: matchError } = await matchQuery;
    if (matchError) throw matchError;
    
    const totalMatches = matches?.length || 0;
    
    // Matchs avec devis envoyé
    const matchesWithQuote = matches?.filter(m => 
      m.status === 'quote_sent' || 
      m.status === 'quote_accepted' ||
      m.status === 'contract_signed' ||
      m.status === 'project_started' ||
      m.status === 'completed'
    ).length || 0;
    
    const quoteSentRate = totalMatches > 0 
      ? Math.round((matchesWithQuote / totalMatches) * 100) 
      : 0;
    
    // Matchs avec chantier signé
    const matchesWithContract = matches?.filter(m =>
      m.status === 'contract_signed' ||
      m.status === 'project_started' ||
      m.status === 'completed'
    ).length || 0;
    
    const contractSignedRate = totalMatches > 0
      ? Math.round((matchesWithContract / totalMatches) * 100)
      : 0;
    
    // Matchs refusés
    const rejectedMatches = matches?.filter(m => 
      m.status === 'rejected' || m.status === 'cancelled'
    ).length || 0;
    
    const rejectionRate = totalMatches > 0
      ? Math.round((rejectedMatches / totalMatches) * 100)
      : 0;
    
    // Funnel complet
    const funnel = {
      match: totalMatches,
      quote_sent: matchesWithQuote,
      quote_accepted: matches?.filter(m => 
        m.status === 'quote_accepted' ||
        m.status === 'contract_signed' ||
        m.status === 'project_started' ||
        m.status === 'completed'
      ).length || 0,
      contract_signed: matchesWithContract,
      project_started: matches?.filter(m =>
        m.status === 'project_started' || m.status === 'completed'
      ).length || 0,
      project_completed: matches?.filter(m => m.status === 'completed').length || 0,
    };
    
    return {
      totalMatches,
      matchesWithQuote,
      quoteSentRate,
      matchesWithContract,
      contractSignedRate,
      rejectedMatches,
      rejectionRate,
      funnel,
    };
  } catch (error) {
    console.error('Error fetching match KPIs:', error);
    return {
      totalMatches: 0,
      matchesWithQuote: 0,
      quoteSentRate: 0,
      matchesWithContract: 0,
      contractSignedRate: 0,
      rejectedMatches: 0,
      rejectionRate: 0,
      funnel: { match: 0, quote_sent: 0, quote_accepted: 0, contract_signed: 0, project_started: 0, project_completed: 0 },
    };
  }
}

/**
 * Récupère le funnel de conversion complet
 */
export async function getConversionFunnel(timeRange?: { start?: string; end?: string }): Promise<ConversionFunnel[]> {
  const matchKPIs = await getMatchKPIs(timeRange);
  
  const { funnel } = matchKPIs;
  const stages = [
    { key: 'match', label: 'Mise en relation', count: funnel.match },
    { key: 'quote_sent', label: 'Devis envoyé', count: funnel.quote_sent },
    { key: 'quote_accepted', label: 'Devis accepté', count: funnel.quote_accepted },
    { key: 'contract_signed', label: 'Contrat signé', count: funnel.contract_signed },
    { key: 'project_started', label: 'Chantier démarré', count: funnel.project_started },
    { key: 'project_completed', label: 'Chantier terminé', count: funnel.project_completed },
  ];
  
  const initialCount = stages[0].count || 1;
  
  return stages.map((stage, index) => {
    const prevCount = index > 0 ? stages[index - 1].count : initialCount;
    const dropOff = index > 0 && prevCount > 0
      ? Math.round(((prevCount - stage.count) / prevCount) * 100)
      : 0;
    
    return {
      stage: stage.label,
      count: stage.count,
      percentage: Math.round((stage.count / initialCount) * 100),
      dropOff,
    };
  });
}

/**
 * Récupère le tableau de bord KPI complet
 */
export async function getGlobalKPIDashboard(timeRange?: { start?: string; end?: string }): Promise<GlobalKPIDashboard> {
  const [projects, professionals, clients, matches] = await Promise.all([
    getProjectKPIs(timeRange),
    getProfessionalKPIs(timeRange),
    getClientKPIs(timeRange),
    getMatchKPIs(timeRange),
  ]);
  
  const conversionFunnel = await getConversionFunnel(timeRange);
  
  return {
    projects,
    professionals,
    clients,
    matches,
    conversionFunnel,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Récupère l'évolution temporelle d'un KPI
 */
export async function getKPITimeSeries(
  metric: 'projects' | 'professionals' | 'clients' | 'matches' | 'conversion',
  days: number = 30
): Promise<KPITimeSeries> {
  try {
    const data: TimeSeriesData[] = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const timeRange = {
        start: startOfDay.toISOString(),
        end: endOfDay.toISOString(),
      };
      
      let value = 0;
      
      switch (metric) {
        case 'projects':
          const projectKPIs = await getProjectKPIs(timeRange);
          value = projectKPIs.totalProjects;
          break;
        case 'professionals':
          const proKPIs = await getProfessionalKPIs(timeRange);
          value = proKPIs.totalBids;
          break;
        case 'clients':
          const clientKPIs = await getClientKPIs(timeRange);
          value = clientKPIs.clientsWhoAccepted;
          break;
        case 'matches':
          const matchKPIs = await getMatchKPIs(timeRange);
          value = matchKPIs.totalMatches;
          break;
        case 'conversion':
          const matchKPIs2 = await getMatchKPIs(timeRange);
          value = matchKPIs2.contractSignedRate;
          break;
      }
      
      data.push({
        date: date.toISOString().split('T')[0],
        value,
        label: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
      });
    }
    
    return { metric, data };
  } catch (error) {
    console.error('Error fetching KPI time series:', error);
    return { metric, data: [] };
  }
}

/**
 * Compare les KPIs entre deux périodes
 */
export async function compareKPIs(
  currentPeriod: { start: string; end: string },
  previousPeriod: { start: string; end: string }
): Promise<{
  current: GlobalKPIDashboard;
  previous: GlobalKPIDashboard;
  changes: {
    projectsRateChange: number;
    applicationRateChange: number;
    acceptanceRateChange: number;
    quoteSentRateChange: number;
    contractRateChange: number;
    rejectionRateChange: number;
  };
}> {
  const [current, previous] = await Promise.all([
    getGlobalKPIDashboard(currentPeriod),
    getGlobalKPIDashboard(previousPeriod),
  ]);
  
  const changes = {
    projectsRateChange: current.projects.realisticEstimationRate - previous.projects.realisticEstimationRate,
    applicationRateChange: current.professionals.applicationRate - previous.professionals.applicationRate,
    acceptanceRateChange: current.clients.acceptanceRate - previous.clients.acceptanceRate,
    quoteSentRateChange: current.matches.quoteSentRate - previous.matches.quoteSentRate,
    contractRateChange: current.matches.contractSignedRate - previous.matches.contractSignedRate,
    rejectionRateChange: current.matches.rejectionRate - previous.matches.rejectionRate,
  };
  
  return { current, previous, changes };
}

/**
 * Log un événement KPI pour tracking temps réel
 */
export async function logKPIEvent(event: {
  event_type: string;
  project_id?: string;
  professional_id?: string;
  client_id?: string;
  metadata?: Record<string, any>;
}) {
  try {
    const { error } = await supabase.from('kpi_events').insert({
      event_type: event.event_type,
      project_id: event.project_id,
      professional_id: event.professional_id,
      client_id: event.client_id,
      metadata: event.metadata,
      created_at: new Date().toISOString(),
    });
    
    if (error) console.error('Error logging KPI event:', error);
  } catch (error) {
    console.error('Error in logKPIEvent:', error);
  }
}

/**
 * Récupère les alertes KPI (anomalies)
 */
export async function getKPIAlerts(): Promise<{
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  value: number;
  threshold: number;
}[]> {
  const dashboard = await getGlobalKPIDashboard();
  const alerts = [];
  
  // Alertes basées sur les seuils critiques
  if (dashboard.projects.realisticEstimationRate < 30) {
    alerts.push({
      type: 'low_estimation_rate',
      severity: 'high',
      message: 'Taux d\'estimation IA faible',
      value: dashboard.projects.realisticEstimationRate,
      threshold: 30,
    });
  }
  
  if (dashboard.professionals.applicationRate < 20) {
    alerts.push({
      type: 'low_application_rate',
      severity: 'medium',
      message: 'Taux de postulation des pros faible',
      value: dashboard.professionals.applicationRate,
      threshold: 20,
    });
  }
  
  if (dashboard.matches.rejectionRate > 40) {
    alerts.push({
      type: 'high_rejection_rate',
      severity: 'high',
      message: 'Taux de refus élevé',
      value: dashboard.matches.rejectionRate,
      threshold: 40,
    });
  }
  
  if (dashboard.matches.contractSignedRate < 15) {
    alerts.push({
      type: 'low_conversion_rate',
      severity: 'medium',
      message: 'Taux de conversion faible',
      value: dashboard.matches.contractSignedRate,
      threshold: 15,
    });
  }
  
  return alerts;
}

export default {
  getProjectKPIs,
  getProfessionalKPIs,
  getClientKPIs,
  getMatchKPIs,
  getConversionFunnel,
  getGlobalKPIDashboard,
  getKPITimeSeries,
  compareKPIs,
  logKPIEvent,
  getKPIAlerts,
};
