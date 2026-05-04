import type { NextApiRequest, NextApiResponse } from 'next';
import { sendEmailServerSide } from '@/lib/email';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// ============================================
// TEMPLATES EMAIL
// ============================================

function templateSupport(data: {
  projectTitle: string;
  projectId: string;
  clientName: string;
  clientEmail: string;
  city: string;
  budgetMin?: number;
  budgetMax?: number;
  description: string;
  workType: string;
  urgency: string;
  adminUrl: string;
}): string {
  const budget = data.budgetMax
    ? `${data.budgetMin?.toLocaleString('fr-FR') || 0}€ — ${data.budgetMax.toLocaleString('fr-FR')}€`
    : 'Non spécifié';

  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8f9fa;">
      <div style="background:linear-gradient(135deg,#7c3aed,#9333ea);padding:28px 24px;text-align:center;border-radius:12px 12px 0 0;">
        <h1 style="color:white;margin:0;font-size:22px;font-weight:800;">SwipeTonPro — Support</h1>
        <p style="color:rgba(255,255,255,0.9);margin:6px 0 0;font-size:14px;">🆕 Nouveau projet à valider</p>
      </div>
      <div style="background:white;padding:28px 32px;">
        <h2 style="color:#1a1a1a;margin:0 0 20px;font-size:18px;">Projet en attente de validation</h2>
        <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:10px;padding:20px;margin:0 0 20px;">
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="color:#666;padding:5px 0;width:35%;">Titre</td><td style="color:#1a1a1a;font-weight:700;">${data.projectTitle}</td></tr>
            <tr><td style="color:#666;padding:5px 0;">ID</td><td style="color:#1a1a1a;font-family:monospace;font-size:12px;">${data.projectId}</td></tr>
            <tr><td style="color:#666;padding:5px 0;">Client</td><td style="color:#1a1a1a;font-weight:600;">${data.clientName} (${data.clientEmail})</td></tr>
            <tr><td style="color:#666;padding:5px 0;">Ville</td><td style="color:#1a1a1a;">${data.city}</td></tr>
            <tr><td style="color:#666;padding:5px 0;">Type travaux</td><td style="color:#1a1a1a;">${data.workType}</td></tr>
            <tr><td style="color:#666;padding:5px 0;">Budget</td><td style="color:#7c3aed;font-weight:700;">${budget}</td></tr>
            <tr><td style="color:#666;padding:5px 0;">Urgence</td><td style="color:#1a1a1a;">${data.urgency}</td></tr>
          </table>
          <div style="margin-top:12px;padding-top:12px;border-top:1px solid #e9d5ff;">
            <p style="color:#666;font-size:13px;margin:0 0 4px;">Description :</p>
            <p style="color:#1a1a1a;font-size:14px;margin:0;font-style:italic;">"${data.description}"</p>
          </div>
        </div>
        <div style="text-align:center;">
          <a href="${data.adminUrl}" style="background:linear-gradient(135deg,#7c3aed,#9333ea);color:white;padding:12px 28px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:700;font-size:14px;">
            Valider / Refuser le projet →
          </a>
        </div>
      </div>
      <div style="background:#f8f9fa;padding:16px;text-align:center;border-radius:0 0 12px 12px;border-top:1px solid #e5e7eb;">
        <p style="color:#9ca3af;font-size:11px;margin:0;">Notification interne SwipeTonPro — Support</p>
      </div>
    </div>
  `;
}

function templateTeam(data: {
  projectTitle: string;
  projectId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  city: string;
  budgetMin?: number;
  budgetMax?: number;
  description: string;
  urgency: string;
  crmUrl: string;
}): string {
  const budget = data.budgetMax
    ? `${data.budgetMin?.toLocaleString('fr-FR') || 0}€ — ${data.budgetMax.toLocaleString('fr-FR')}€`
    : 'Non spécifié';

  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8f9fa;">
      <div style="background:linear-gradient(135deg,#0284c7,#0ea5e9);padding:28px 24px;text-align:center;border-radius:12px 12px 0 0;">
        <h1 style="color:white;margin:0;font-size:22px;font-weight:800;">SwipeTonPro — Équipe</h1>
        <p style="color:rgba(255,255,255,0.9);margin:6px 0 0;font-size:14px;">📞 Nouveau lead à qualifier</p>
      </div>
      <div style="background:white;padding:28px 32px;">
        <h2 style="color:#1a1a1a;margin:0 0 8px;font-size:18px;">Nouveau projet à traiter</h2>
        <p style="color:#555;font-size:14px;margin:0 0 20px;">Prenez contact avec le client pour qualifier ce projet.</p>
        
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:20px;margin:0 0 16px;">
          <h3 style="color:#1d4ed8;margin:0 0 12px;font-size:14px;font-weight:700;">📋 Infos projet</h3>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="color:#666;padding:4px 0;width:35%;">Projet</td><td style="color:#1a1a1a;font-weight:700;">${data.projectTitle}</td></tr>
            <tr><td style="color:#666;padding:4px 0;">Ville</td><td style="color:#1a1a1a;">${data.city}</td></tr>
            <tr><td style="color:#666;padding:4px 0;">Budget</td><td style="color:#0284c7;font-weight:700;">${budget}</td></tr>
            <tr><td style="color:#666;padding:4px 0;">Urgence</td><td style="color:#1a1a1a;">${data.urgency}</td></tr>
          </table>
        </div>

        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px;margin:0 0 20px;">
          <h3 style="color:#15803d;margin:0 0 12px;font-size:14px;font-weight:700;">👤 Contact client</h3>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="color:#666;padding:4px 0;width:35%;">Nom</td><td style="color:#1a1a1a;font-weight:700;">${data.clientName}</td></tr>
            <tr><td style="color:#666;padding:4px 0;">Email</td><td style="color:#1a1a1a;"><a href="mailto:${data.clientEmail}" style="color:#0284c7;">${data.clientEmail}</a></td></tr>
            ${data.clientPhone ? `<tr><td style="color:#666;padding:4px 0;">Téléphone</td><td style="color:#1a1a1a;font-weight:700;"><a href="tel:${data.clientPhone}" style="color:#0284c7;">${data.clientPhone}</a></td></tr>` : ''}
          </table>
        </div>

        <div style="text-align:center;">
          <a href="${data.crmUrl}" style="background:linear-gradient(135deg,#0284c7,#0ea5e9);color:white;padding:12px 28px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:700;font-size:14px;">
            Ouvrir dans le CRM →
          </a>
        </div>
      </div>
      <div style="background:#f8f9fa;padding:16px;text-align:center;border-radius:0 0 12px 12px;border-top:1px solid #e5e7eb;">
        <p style="color:#9ca3af;font-size:11px;margin:0;">Notification interne SwipeTonPro — Équipe commerciale</p>
      </div>
    </div>
  `;
}

// ============================================
// HANDLER PRINCIPAL
// ============================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { projectId, clientId } = req.body;

  if (!projectId || !clientId) {
    return res.status(400).json({ message: 'projectId et clientId requis' });
  }

  try {
    // Récupérer le projet
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select(
        'title, city, description, budget_min, budget_max, urgency, work_type, category'
      )
      .eq('id', projectId)
      .single();

    // Récupérer le client
    const { data: client } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email, phone')
      .eq('id', clientId)
      .single();

    if (!project || !client) {
      return res.status(404).json({ message: 'Projet ou client introuvable' });
    }

    // Ajouter au CRM (table leads)
    await supabaseAdmin
      .from('leads')
      .insert({
        project_id: projectId,
        client_id: clientId,
        qualification_score: 0,
        status: 'new',
        budget: project.budget_max || project.budget_min || 0,
        timeline: 'Non défini',
        urgency: project.urgency || 'medium',
        notes: `Lead généré automatiquement — ${project.title}`,
        contact_attempts: 0,
        source: 'organic',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    const results = await Promise.allSettled([
      // Email Support
      sendEmailServerSide({
        to: 'support@swipetonpro.fr',
        subject: `[NOUVEAU PROJET] ${project.title} — À valider`,
        html: templateSupport({
          projectTitle: project.title,
          projectId,
          clientName: client.full_name || 'Client',
          clientEmail: client.email,
          city: project.city || '',
          budgetMin: project.budget_min,
          budgetMax: project.budget_max,
          description: project.description || '',
          workType: project.work_types?.join(', ') || project.category || '',
          urgency: project.urgency || 'medium',
          adminUrl: `${BASE_URL}/admin/projects`,
        }),
        fromType: 'noreply',
      }),

      // Email Team
      sendEmailServerSide({
        to: 'team@swipetonpro.fr',
        subject: `[LEAD] ${project.title} — ${client.full_name} — À qualifier`,
        html: templateTeam({
          projectTitle: project.title,
          projectId,
          clientName: client.full_name || 'Client',
          clientEmail: client.email,
          clientPhone: client.phone,
          city: project.city || '',
          budgetMin: project.budget_min,
          budgetMax: project.budget_max,
          description: project.description || '',
          urgency: project.urgency || 'medium',
          crmUrl: `${BASE_URL}/admin/crm`,
        }),
        fromType: 'noreply',
      }),
    ]);

    const sent = results.filter((r) => r.status === 'fulfilled').length;

    return res.status(200).json({
      message: `${sent}/2 emails envoyés, lead créé dans le CRM`,
      sent,
    });
  } catch (error) {
    console.error('Erreur notification projet:', error);
    return res.status(500).json({ message: 'Erreur serveur', error });
  }
}
