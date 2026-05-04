import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Vérifier l'authentification admin
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Vérifier le rôle admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !['admin', 'super_admin'].includes(profile?.role)) {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }

    // Récupérer les paramètres de date
    const { start, end, days = '30' } = req.query;
    
    let timeRange: { start?: string; end?: string } = {};
    
    if (start && end) {
      timeRange = { start: String(start), end: String(end) };
    } else {
      const daysNum = parseInt(String(days), 10) || 30;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysNum);
      
      timeRange = {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      };
    }

    // Calculer les KPIs
    const dashboard = await calculateKPIs(supabaseAdmin, timeRange);

    return res.status(200).json({
      success: true,
      data: dashboard,
      timeRange,
    });
  } catch (error: any) {
    console.error('Error fetching KPI dashboard:', error);
    return res.status(500).json({
      error: 'Failed to fetch KPI dashboard',
      details: error.message,
    });
  }
}

async function calculateKPIs(supabase: any, timeRange: { start?: string; end?: string }) {
  // 1. KPI Projets - % avec estimation réaliste
  let projectsQuery = supabase.from('projects').select('*');
  if (timeRange.start) projectsQuery = projectsQuery.gte('created_at', timeRange.start);
  if (timeRange.end) projectsQuery = projectsQuery.lte('created_at', timeRange.end);
  
  const { data: projects } = await projectsQuery;
  const totalProjects = projects?.length || 0;
  
  const projectsWithAIEstimation = projects?.filter((p: any) => {
    if (!p.ai_analysis && !p.ai_estimation) return false;
    const budgetDiff = p.estimated_budget_max && p.estimated_budget_min 
      ? (p.estimated_budget_max - p.estimated_budget_min) / p.estimated_budget_min 
      : 0;
    return budgetDiff < 0.5;
  }).length || 0;

  const projectKPIs = {
    totalProjects,
    projectsWithAIEstimation,
    realisticEstimationRate: totalProjects > 0 ? Math.round((projectsWithAIEstimation / totalProjects) * 100) : 0,
    byStatus: {
      pending_validation: projects?.filter((p: any) => p.status === 'pending_validation').length || 0,
      validated: projects?.filter((p: any) => p.status === 'validated').length || 0,
      in_progress: projects?.filter((p: any) => p.status === 'in_progress').length || 0,
      completed: projects?.filter((p: any) => p.status === 'completed').length || 0,
      cancelled: projects?.filter((p: any) => p.status === 'cancelled').length || 0,
    },
  };

  // 2. KPI Professionnels - % qui postulent
  const { data: professionals } = await supabase.from('professionals').select('id');
  
  let bidsQuery = supabase.from('bids').select('professional_id');
  if (timeRange.start) bidsQuery = bidsQuery.gte('created_at', timeRange.start);
  if (timeRange.end) bidsQuery = bidsQuery.lte('created_at', timeRange.end);
  
  const { data: bids } = await bidsQuery;
  
  const totalProfessionals = professionals?.length || 0;
  const totalBids = bids?.length || 0;
  const proIdsWithBids = new Set(bids?.map((b: any) => b.professional_id) || []);
  const professionalsWithBids = proIdsWithBids.size;

  const professionalKPIs = {
    totalProfessionals,
    activeProfessionals: totalProfessionals,
    professionalsWithBids,
    applicationRate: totalProfessionals > 0 ? Math.round((professionalsWithBids / totalProfessionals) * 100) : 0,
    avgBidsPerPro: totalProfessionals > 0 ? Math.round((totalBids / totalProfessionals) * 10) / 10 : 0,
    totalBids,
  };

  // 3. KPI Clients - % qui acceptent
  const { data: clients } = await supabase.from('profiles').select('id').eq('role', 'client');
  
  let clientProjectsQuery = supabase.from('projects').select('client_id, status, assigned_to, accepted_bid_id');
  if (timeRange.start) clientProjectsQuery = clientProjectsQuery.gte('created_at', timeRange.start);
  if (timeRange.end) clientProjectsQuery = clientProjectsQuery.lte('created_at', timeRange.end);
  
  const { data: clientProjects } = await clientProjectsQuery;
  
  const totalClients = clients?.length || 0;
  const clientsWithProjectsList = clientProjects || [];
  const clientsWithProjects = new Set(clientsWithProjectsList.map((p: any) => p.client_id)).size;
  
  const clientsWhoAccepted = clientsWithProjectsList.filter((p: any) => 
    p.status === 'in_progress' || p.status === 'completed' || p.assigned_to || p.accepted_bid_id
  ).length;

  const clientKPIs = {
    totalClients,
    clientsWithProjects,
    clientsWhoAccepted,
    acceptanceRate: clientsWithProjects > 0 ? Math.round((clientsWhoAccepted / clientsWithProjects) * 100) : 0,
    avgResponseTime: 48, // En heures, à calculer précisément
  };

  // 4. KPI Matchs - Conversion funnel
  let matchQuery = supabase.from('match_payments').select('*');
  if (timeRange.start) matchQuery = matchQuery.gte('created_at', timeRange.start);
  if (timeRange.end) matchQuery = matchQuery.lte('created_at', timeRange.end);
  
  const { data: matches } = await matchQuery;
  const totalMatches = matches?.length || 0;

  const matchesWithQuote = matches?.filter((m: any) => 
    ['quote_sent', 'quote_accepted', 'contract_signed', 'project_started', 'completed'].includes(m.status)
  ).length || 0;

  const matchesWithContract = matches?.filter((m: any) =>
    ['contract_signed', 'project_started', 'completed'].includes(m.status)
  ).length || 0;

  const rejectedMatches = matches?.filter((m: any) => 
    ['rejected', 'cancelled'].includes(m.status)
  ).length || 0;

  const matchKPIs = {
    totalMatches,
    matchesWithQuote,
    quoteSentRate: totalMatches > 0 ? Math.round((matchesWithQuote / totalMatches) * 100) : 0,
    matchesWithContract,
    contractSignedRate: totalMatches > 0 ? Math.round((matchesWithContract / totalMatches) * 100) : 0,
    rejectedMatches,
    rejectionRate: totalMatches > 0 ? Math.round((rejectedMatches / totalMatches) * 100) : 0,
    funnel: {
      match: totalMatches,
      quote_sent: matchesWithQuote,
      quote_accepted: matches?.filter((m: any) => 
        ['quote_accepted', 'contract_signed', 'project_started', 'completed'].includes(m.status)
      ).length || 0,
      contract_signed: matchesWithContract,
      project_started: matches?.filter((m: any) =>
        ['project_started', 'completed'].includes(m.status)
      ).length || 0,
      project_completed: matches?.filter((m: any) => m.status === 'completed').length || 0,
    },
  };

  // Funnel de conversion
  const stages = [
    { label: 'Mise en relation', count: matchKPIs.funnel.match },
    { label: 'Devis envoyé', count: matchKPIs.funnel.quote_sent },
    { label: 'Devis accepté', count: matchKPIs.funnel.quote_accepted },
    { label: 'Contrat signé', count: matchKPIs.funnel.contract_signed },
    { label: 'Chantier démarré', count: matchKPIs.funnel.project_started },
    { label: 'Chantier terminé', count: matchKPIs.funnel.project_completed },
  ];

  const initialCount = stages[0].count || 1;
  const conversionFunnel = stages.map((stage, index) => {
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

  return {
    projects: projectKPIs,
    professionals: professionalKPIs,
    clients: clientKPIs,
    matches: matchKPIs,
    conversionFunnel,
    lastUpdated: new Date().toISOString(),
  };
}
