import type { NextApiRequest, NextApiResponse } from 'next';
import { sendEmailServerSide } from '@/lib/email';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

function templateValidated(data: {
  clientName: string;
  projectTitle: string;
  city: string;
  dashboardUrl: string;
}): string {
  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8f9fa;">
      <div style="background:linear-gradient(135deg,#16a34a,#22c55e);padding:32px 24px;text-align:center;border-radius:12px 12px 0 0;">
        <h1 style="color:white;margin:0;font-size:28px;font-weight:800;">SwipeTon<span style="opacity:0.85;">Pro</span></h1>
        <p style="color:rgba(255,255,255,0.95);margin:8px 0 0;font-size:16px;">✅ Votre projet est en ligne !</p>
      </div>
      <div style="background:white;padding:36px 32px;">
        <h2 style="color:#1a1a1a;margin:0 0 8px;font-size:22px;">Félicitations ${data.clientName} !</h2>
        <p style="color:#555;line-height:1.7;margin:0 0 24px;font-size:15px;">
          Votre projet <strong>"${data.projectTitle}"</strong> a été validé par notre équipe et est maintenant visible par les professionnels.
        </p>
        
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px;margin:0 0 24px;">
          <h3 style="color:#15803d;margin:0 0 12px;font-size:15px;font-weight:700;">🚀 Prochaines étapes</h3>
          <p style="color:#166534;margin:6px 0;font-size:14px;">1. Les professionnels vont consulter votre projet</p>
          <p style="color:#166534;margin:6px 0;font-size:14px;">2. Ceux qui sont intéressés exprimeront leur candidature</p>
          <p style="color:#166534;margin:6px 0;font-size:14px;">3. Vous recevrez une notification pour chaque candidature</p>
          <p style="color:#166534;margin:6px 0;font-size:14px;">4. Vous choisissez votre professionnel et confirmez le match</p>
        </div>

        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px;margin:0 0 28px;">
          <p style="color:#1d4ed8;font-size:14px;margin:0;">
            💡 <strong>Conseil :</strong> Un projet avec une description détaillée et un budget précis attire 3x plus de candidatures qualifiées.
          </p>
        </div>

        <div style="text-align:center;">
          <a href="${data.dashboardUrl}" style="background:linear-gradient(135deg,#16a34a,#22c55e);color:white;padding:14px 36px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:700;font-size:15px;">
            Voir mon projet en ligne →
          </a>
        </div>
      </div>
      <div style="background:#f8f9fa;padding:20px;text-align:center;border-radius:0 0 12px 12px;border-top:1px solid #e5e7eb;">
        <p style="color:#9ca3af;font-size:12px;margin:0;">SwipeTonPro — La mise en relation BTP par intérêt mutuel</p>
      </div>
    </div>
  `;
}

function templateRejected(data: {
  clientName: string;
  projectTitle: string;
  reason: string;
  dashboardUrl: string;
}): string {
  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8f9fa;">
      <div style="background:linear-gradient(135deg,#dc2626,#ef4444);padding:32px 24px;text-align:center;border-radius:12px 12px 0 0;">
        <h1 style="color:white;margin:0;font-size:28px;font-weight:800;">SwipeTon<span style="opacity:0.85;">Pro</span></h1>
        <p style="color:rgba(255,255,255,0.95);margin:8px 0 0;font-size:16px;">📋 Mise à jour de votre projet</p>
      </div>
      <div style="background:white;padding:36px 32px;">
        <h2 style="color:#1a1a1a;margin:0 0 8px;font-size:22px;">Bonjour ${data.clientName},</h2>
        <p style="color:#555;line-height:1.7;margin:0 0 24px;font-size:15px;">
          Votre projet <strong>"${data.projectTitle}"</strong> n'a pas pu être publié en l'état. Voici le motif :
        </p>

        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:20px;margin:0 0 24px;">
          <h3 style="color:#dc2626;margin:0 0 8px;font-size:14px;font-weight:700;">Motif du refus :</h3>
          <p style="color:#991b1b;font-size:14px;margin:0;font-style:italic;">"${data.reason}"</p>
        </div>

        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px;margin:0 0 28px;">
          <h3 style="color:#15803d;margin:0 0 12px;font-size:14px;font-weight:700;">✏️ Comment corriger ?</h3>
          <p style="color:#166534;margin:6px 0;font-size:14px;">1. Connectez-vous à votre espace particulier</p>
          <p style="color:#166534;margin:6px 0;font-size:14px;">2. Modifiez votre projet en tenant compte du motif</p>
          <p style="color:#166534;margin:6px 0;font-size:14px;">3. Soumettez à nouveau pour validation</p>
          <p style="color:#166534;margin:6px 0;font-size:14px;">4. Notre équipe revalidera sous 24h</p>
        </div>

        <div style="text-align:center;margin:0 0 16px;">
          <a href="${data.dashboardUrl}" style="background:linear-gradient(135deg,#ea580c,#f97316);color:white;padding:14px 36px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:700;font-size:15px;">
            Modifier mon projet →
          </a>
        </div>

        <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0;">
          Des questions ? Contactez-nous à <a href="mailto:support@qwipetonpro.fr" style="color:#ea580c;">support@qwipetonpro.fr</a>
        </p>
      </div>
      <div style="background:#f8f9fa;padding:20px;text-align:center;border-radius:0 0 12px 12px;border-top:1px solid #e5e7eb;">
        <p style="color:#9ca3af;font-size:12px;margin:0;">SwipeTonPro — La mise en relation BTP par intérêt mutuel</p>
      </div>
    </div>
  `;
}

function templateSupportValidated(data: {
  projectTitle: string;
  projectId: string;
  clientEmail: string;
  validatedBy: string;
}): string {
  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#16a34a;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
        <h1 style="color:white;margin:0;font-size:18px;">✅ Projet validé — SwipeTonPro</h1>
      </div>
      <div style="background:white;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
        <table style="width:100%;font-size:14px;border-collapse:collapse;">
          <tr><td style="color:#666;padding:4px 0;width:35%;">Projet</td><td style="font-weight:600;">${data.projectTitle}</td></tr>
          <tr><td style="color:#666;padding:4px 0;">ID</td><td style="font-family:monospace;font-size:12px;">${data.projectId}</td></tr>
          <tr><td style="color:#666;padding:4px 0;">Client notifié</td><td>${data.clientEmail}</td></tr>
          <tr><td style="color:#666;padding:4px 0;">Validé par</td><td style="font-weight:600;">${data.validatedBy}</td></tr>
          <tr><td style="color:#666;padding:4px 0;">Date</td><td>${new Date().toLocaleString('fr-FR')}</td></tr>
        </table>
      </div>
    </div>
  `;
}

// ============================================
// HANDLER PRINCIPAL
// ============================================

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { projectId, action, reason, validatedBy } = req.body;

  if (!projectId || !action) {
    return res.status(400).json({ message: 'projectId et action requis' });
  }

  if (!['validate', 'reject', 'info_needed'].includes(action)) {
    return res.status(400).json({ message: 'action doit être "validate" ou "reject"' });
  }

  if (action === 'reject' && !reason) {
    return res.status(400).json({ message: 'Le motif est requis pour un refus' });
  }

  try {
    // Récupérer le projet et le client
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('title, client_id, city')
      .eq('id', projectId)
      .single();

    if (!project) {
      return res.status(404).json({ message: 'Projet introuvable' });
    }

    const { data: client } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email')
      .eq('id', project.client_id)
      .single();

    if (!client) {
      return res.status(404).json({ message: 'Client introuvable' });
    }

    // Mettre à jour le statut du projet
    const newStatus = action === 'validate' ? 'published'
      : action === 'reject' ? 'rejected'
      : 'info_needed';
    await supabaseAdmin
      .from('projects')
      .update({
        status: newStatus,
        validation_status: newStatus,
        ...(action === 'reject' && { rejection_reason: reason }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    const emailsToSend = [];

    if (action === 'validate') {
      // Email au particulier — projet validé
      emailsToSend.push(
        sendEmailServerSide({
          to: client.email,
          subject: `✅ Votre projet "${project.title}" est en ligne !`,
          html: templateValidated({
            clientName: client.full_name || 'Client',
            projectTitle: project.title,
            city: project.city || '',
            dashboardUrl: `${BASE_URL}/particulier/projects`,
          }),
          fromType: 'noreply',
        })
      );

      // Email au support — confirmation
      emailsToSend.push(
        sendEmailServerSide({
          to: 'support@qwipetonpro.fr',
          subject: `[VALIDÉ] ${project.title}`,
          html: templateSupportValidated({
            projectTitle: project.title,
            projectId,
            clientEmail: client.email,
            validatedBy: validatedBy || 'Admin',
          }),
          fromType: 'noreply',
        })
      );
    } else {
      // Email au particulier — projet refusé avec motif
      emailsToSend.push(
        sendEmailServerSide({
          to: client.email,
          subject: `📋 Mise à jour de votre projet "${project.title}"`,
          html: templateRejected({
            clientName: client.full_name || 'Client',
            projectTitle: project.title,
            reason,
            dashboardUrl: `${BASE_URL}/particulier/projects`,
          }),
          fromType: 'noreply',
        })
      );
    }

    const results = await Promise.allSettled(emailsToSend);
    const sent = results.filter(r => r.status === 'fulfilled').length;

    return res.status(200).json({
      message: `Projet ${action === 'validate' ? 'validé' : action === 'reject' ? 'refusé' : 'en attente d\'infos'} — ${sent} email(s) envoyé(s)`,
      status: newStatus,
      sent,
    });

  } catch (error) {
    console.error('Erreur notification statut projet:', error);
    return res.status(500).json({ message: 'Erreur serveur', error });
  }
}
