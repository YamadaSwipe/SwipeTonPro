import type { NextApiRequest, NextApiResponse } from 'next';
import { sendEmailServerSide } from '@/lib/email';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// ============================================
// TEMPLATES EMAIL MATCH
// ============================================

function templateMatchPro(data: {
  proName: string;
  projectTitle: string;
  projectCity: string;
  projectBudget: string;
  pricePaid: string;
  dashboardUrl: string;
}): string {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #ea580c, #f97316); padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">
          SwipeTon<span style="opacity: 0.85;">Pro</span>
        </h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px;">
          🎉 Match confirmé !
        </p>
      </div>

      <!-- Body -->
      <div style="background: white; padding: 36px 32px;">
        <h2 style="color: #1a1a1a; margin: 0 0 8px; font-size: 22px;">
          Bonjour ${data.proName},
        </h2>
        <p style="color: #555; line-height: 1.7; margin: 0 0 24px; font-size: 15px;">
          Votre mise en relation a été confirmée ! Vous avez maintenant accès aux coordonnées du client et pouvez organiser votre premier rendez-vous.
        </p>

        <!-- Détails projet -->
        <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: 20px; margin: 0 0 24px;">
          <h3 style="color: #c2410c; margin: 0 0 14px; font-size: 16px; font-weight: 700;">
            📋 Projet débloqué
          </h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="color: #666; padding: 4px 0; font-size: 14px; width: 40%;">Projet</td>
              <td style="color: #1a1a1a; padding: 4px 0; font-size: 14px; font-weight: 600;">${data.projectTitle}</td>
            </tr>
            <tr>
              <td style="color: #666; padding: 4px 0; font-size: 14px;">Localisation</td>
              <td style="color: #1a1a1a; padding: 4px 0; font-size: 14px; font-weight: 600;">${data.projectCity}</td>
            </tr>
            <tr>
              <td style="color: #666; padding: 4px 0; font-size: 14px;">Budget client</td>
              <td style="color: #1a1a1a; padding: 4px 0; font-size: 14px; font-weight: 600;">${data.projectBudget}</td>
            </tr>
            <tr>
              <td style="color: #666; padding: 4px 0; font-size: 14px;">Mise en relation</td>
              <td style="color: #ea580c; padding: 4px 0; font-size: 14px; font-weight: 700;">${data.pricePaid}</td>
            </tr>
          </table>
        </div>

        <!-- Prochaines étapes -->
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 20px; margin: 0 0 28px;">
          <h3 style="color: #15803d; margin: 0 0 12px; font-size: 15px; font-weight: 700;">✅ Prochaines étapes</h3>
          <p style="color: #166534; margin: 4px 0; font-size: 14px;">1. Consultez les coordonnées du client dans votre dashboard</p>
          <p style="color: #166534; margin: 4px 0; font-size: 14px;">2. Contactez-le pour un premier échange</p>
          <p style="color: #166534; margin: 4px 0; font-size: 14px;">3. Planifiez un rendez-vous (téléphonique ou sur site)</p>
        </div>

        <!-- CTA -->
        <div style="text-align: center;">
          <a href="${data.dashboardUrl}"
             style="background: linear-gradient(135deg, #ea580c, #f97316); color: white; padding: 14px 36px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 700; font-size: 15px; letter-spacing: 0.3px;">
            Accéder au projet →
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">SwipeTonPro — La mise en relation BTP par intérêt mutuel</p>
        <p style="color: #d1d5db; font-size: 11px; margin: 4px 0 0;">© 2026 SwipeTonPro. Tous droits réservés.</p>
      </div>
    </div>
  `;
}

function templateMatchClient(data: {
  clientName: string;
  proName: string;
  projectTitle: string;
  dashboardUrl: string;
}): string {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #0284c7, #0ea5e9); padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">
          SwipeTon<span style="opacity: 0.85;">Pro</span>
        </h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px;">
          🤝 Votre professionnel est confirmé !
        </p>
      </div>

      <!-- Body -->
      <div style="background: white; padding: 36px 32px;">
        <h2 style="color: #1a1a1a; margin: 0 0 8px; font-size: 22px;">
          Bonjour ${data.clientName},
        </h2>
        <p style="color: #555; line-height: 1.7; margin: 0 0 24px; font-size: 15px;">
          Excellente nouvelle ! <strong>${data.proName}</strong> a confirmé la mise en relation pour votre projet <strong>"${data.projectTitle}"</strong>. Il va vous contacter très prochainement.
        </p>

        <!-- Info -->
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 20px; margin: 0 0 28px;">
          <h3 style="color: #1d4ed8; margin: 0 0 12px; font-size: 15px; font-weight: 700;">💡 À savoir</h3>
          <p style="color: #1e40af; margin: 4px 0; font-size: 14px;">• Le professionnel a accès à vos coordonnées</p>
          <p style="color: #1e40af; margin: 4px 0; font-size: 14px;">• Vous pouvez organiser un RDV depuis votre planning</p>
          <p style="color: #1e40af; margin: 4px 0; font-size: 14px;">• La messagerie complète est maintenant disponible</p>
        </div>

        <!-- CTA -->
        <div style="text-align: center;">
          <a href="${data.dashboardUrl}"
             style="background: linear-gradient(135deg, #0284c7, #0ea5e9); color: white; padding: 14px 36px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 700; font-size: 15px;">
            Voir mon projet →
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">SwipeTonPro — La mise en relation BTP par intérêt mutuel</p>
        <p style="color: #d1d5db; font-size: 11px; margin: 4px 0 0;">© 2026 SwipeTonPro. Tous droits réservés.</p>
      </div>
    </div>
  `;
}

function templateMatchSupport(data: {
  proName: string;
  proEmail: string;
  clientName: string;
  clientEmail: string;
  projectTitle: string;
  projectId: string;
  pricePaid: string;
  adminUrl: string;
}): string {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #7c3aed, #9333ea); padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 800;">
          SwipeTonPro — Support
        </h1>
        <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0; font-size: 14px;">
          🔔 Nouveau match — Notification interne
        </p>
      </div>

      <!-- Body -->
      <div style="background: white; padding: 28px;">
        <div style="background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 10px; padding: 20px; margin: 0 0 20px;">
          <h3 style="color: #7c3aed; margin: 0 0 14px; font-size: 15px;">Détails du match</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="color: #666; padding: 5px 0; width: 35%;">Projet</td><td style="color: #1a1a1a; font-weight: 600;">${data.projectTitle}</td></tr>
            <tr><td style="color: #666; padding: 5px 0;">ID Projet</td><td style="color: #1a1a1a; font-family: monospace; font-size: 12px;">${data.projectId}</td></tr>
            <tr><td style="color: #666; padding: 5px 0;">Professionnel</td><td style="color: #1a1a1a; font-weight: 600;">${data.proName} (${data.proEmail})</td></tr>
            <tr><td style="color: #666; padding: 5px 0;">Particulier</td><td style="color: #1a1a1a; font-weight: 600;">${data.clientName} (${data.clientEmail})</td></tr>
            <tr><td style="color: #666; padding: 5px 0;">Montant encaissé</td><td style="color: #7c3aed; font-weight: 700; font-size: 16px;">${data.pricePaid}</td></tr>
            <tr><td style="color: #666; padding: 5px 0;">Date/heure</td><td style="color: #1a1a1a;">${new Date().toLocaleString('fr-FR')}</td></tr>
          </table>
        </div>

        <div style="text-align: center;">
          <a href="${data.adminUrl}"
             style="background: linear-gradient(135deg, #7c3aed, #9333ea); color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 700; font-size: 14px;">
            Voir dans l'admin →
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div style="background: #f8f9fa; padding: 16px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 11px; margin: 0;">Notification interne SwipeTonPro — Ne pas répondre à cet email</p>
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

  const { projectId, professionalId, clientId, pricePaid } = req.body;

  if (!projectId || !professionalId || !clientId) {
    return res.status(400).json({ message: 'Champs manquants: projectId, professionalId, clientId' });
  }

  try {
    // Récupérer les infos du projet
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('title, city, budget_max, budget_min')
      .eq('id', projectId)
      .single();

    // Récupérer les infos du pro
    const { data: proProfile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email')
      .eq('id', professionalId)
      .single();

    // Récupérer les infos du particulier
    const { data: clientProfile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email')
      .eq('id', clientId)
      .single();

    if (!project || !proProfile || !clientProfile) {
      return res.status(404).json({ message: 'Données introuvables' });
    }

    const budgetDisplay = project.budget_max
      ? `${project.budget_max.toLocaleString('fr-FR')} €`
      : project.budget_min
        ? `à partir de ${project.budget_min.toLocaleString('fr-FR')} €`
        : 'Non spécifié';

    const pricePaidDisplay = pricePaid
      ? `${pricePaid} €`
      : 'Voir admin';

    const results = await Promise.allSettled([
      // Email au professionnel
      sendEmailServerSide({
        to: proProfile.email,
        subject: `🎉 Match confirmé — ${project.title}`,
        html: templateMatchPro({
          proName: proProfile.full_name || 'Professionnel',
          projectTitle: project.title,
          projectCity: project.city || '',
          projectBudget: budgetDisplay,
          pricePaid: pricePaidDisplay,
          dashboardUrl: `${BASE_URL}/professionnel/dashboard`,
        }),
        fromType: 'noreply',
      }),

      // Email au particulier
      sendEmailServerSide({
        to: clientProfile.email,
        subject: `🤝 Votre professionnel est confirmé — ${project.title}`,
        html: templateMatchClient({
          clientName: clientProfile.full_name || 'Client',
          proName: proProfile.full_name || 'Votre professionnel',
          projectTitle: project.title,
          dashboardUrl: `${BASE_URL}/particulier/dashboard`,
        }),
        fromType: 'noreply',
      }),

      // Email au support
      sendEmailServerSide({
        to: 'support@swipetonpro.com',
        subject: `[MATCH] ${project.title} — ${pricePaidDisplay}`,
        html: templateMatchSupport({
          proName: proProfile.full_name || professionalId,
          proEmail: proProfile.email,
          clientName: clientProfile.full_name || clientId,
          clientEmail: clientProfile.email,
          projectTitle: project.title,
          projectId,
          pricePaid: pricePaidDisplay,
          adminUrl: `${BASE_URL}/admin`,
        }),
        fromType: 'support',
      }),
    ]);

    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return res.status(200).json({
      message: `${sent}/3 emails envoyés`,
      sent,
      failed,
    });

  } catch (error) {
    console.error('Erreur notification match:', error);
    return res.status(500).json({ message: 'Erreur serveur', error });
  }
}
