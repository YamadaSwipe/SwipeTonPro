import type { NextApiRequest, NextApiResponse } from 'next';
import { sendEmailServerSide } from '@/lib/email';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Mapping des rôles vers les emails
const ROLE_EMAILS: Record<string, string> = {
  admin: 'admin@swipetonpro.fr',
  support: 'support@swipetonpro.fr',
  team: 'team@swipetonpro.fr',
};

// Templates par rôle
const TEMPLATES: Record<
  string,
  (data: any) => { subject: string; html: string }
> = {
  admin: (data) => ({
    subject: `🔔 Nouveau client inscrit — ${data.name || data.email}`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#3b82f6,#6366f1);padding:24px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="color:white;margin:0;font-size:20px;">SwipeTonPro — Admin</h1>
          <p style="color:rgba(255,255,255,0.9);margin:6px 0 0;font-size:14px;">🔔 Nouvelle inscription client</p>
        </div>
        <div style="background:#fafafa;padding:24px;border-radius:0 0 12px 12px;">
          <h2 style="color:#1a1a1a;margin:0 0 12px;font-size:18px;">Nouveau client sur la plateforme</h2>
          ${data.baseInfo}
          <div style="text-align:center;margin-top:20px;">
            <a href="${data.adminUrl}" style="background:#3b82f6;color:white;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;display:inline-block;">
              Voir les utilisateurs →
            </a>
          </div>
        </div>
      </div>`,
  }),
  support: (data) => ({
    subject: `📋 Support — Nouveau client : ${data.name || data.email}`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#ea580c;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="color:white;margin:0;font-size:20px;">SwipeTonPro — Support</h1>
          <p style="color:rgba(255,255,255,0.9);margin:6px 0 0;">Nouveau client à accueillir</p>
        </div>
        <div style="background:#fafafa;padding:24px;border-radius:0 0 12px 12px;">
          <p style="color:#555;font-size:14px;">Un nouveau client vient de s'inscrire sur la plateforme.</p>
          ${data.baseInfo}
        </div>
      </div>`,
  }),
  team: (data) => ({
    subject: `🚀 Team — Nouveau client : ${data.name || data.email}`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#16a34a;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="color:white;margin:0;font-size:20px;">SwipeTonPro — Team</h1>
          <p style="color:rgba(255,255,255,0.9);margin:6px 0 0;">🎉 Nouveau membre !</p>
        </div>
        <div style="background:#fafafa;padding:24px;border-radius:0 0 12px 12px;">
          <p style="color:#555;font-size:14px;">Un nouveau client rejoint notre communauté !</p>
          ${data.baseInfo}
          <p style="color:#16a34a;font-weight:700;font-size:14px;text-align:center;margin-top:16px;">
            🎉 +1 client dans la famille SwipeTonPro !
          </p>
        </div>
      </div>`,
  }),
};

// Récupérer les destinataires configurés depuis la base
async function getNotificationRecipients(
  notificationType: string
): Promise<Array<{ email: string; role: string }>> {
  const { data: settings } = await supabaseAdmin
    .from('notification_settings')
    .select('recipients, is_enabled')
    .eq('notification_type', notificationType)
    .single();

  // Si pas de settings ou désactivé, retourner les destinataires par défaut
  if (!settings || !settings.is_enabled) {
    return [
      { email: ROLE_EMAILS.admin, role: 'admin' },
      { email: ROLE_EMAILS.support, role: 'support' },
    ];
  }

  const recipients: string[] = settings.recipients || ['admin'];

  return recipients.map((role: string) => ({
    email: ROLE_EMAILS[role] || role,
    role: ROLE_EMAILS[role] ? role : 'custom',
  }));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST')
    return res.status(405).json({ message: 'Method not allowed' });

  const { userId } = req.body;
  if (
    !userId ||
    typeof userId !== 'string' ||
    !userId.match(/^[0-9a-f-]{36}$/i)
  ) {
    return res
      .status(400)
      .json({ message: 'userId invalide (format UUID requis)' });
  }

  try {
    // Récupérer les destinataires configurés
    const recipients = await getNotificationRecipients('client_signup');

    if (recipients.length === 0) {
      console.log(
        'Notifications client_signup désactivées ou aucun destinataire'
      );
      return res.status(200).json({ message: 'Notifications désactivées' });
    }

    // Récupérer le profil client
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email, phone, created_at')
      .eq('id', userId)
      .single();

    if (!profile) {
      return res.status(404).json({ message: 'Profil introuvable' });
    }

    const date = new Date(profile.created_at || Date.now()).toLocaleDateString(
      'fr-FR'
    );
    const adminUrl = `${BASE_URL}/admin/users`;

    const baseInfo = `
      <div style="background:white;padding:20px;border-radius:8px;margin:16px 0;font-size:14px;">
        <p><strong>Nom :</strong> ${profile.full_name || 'Non renseigné'}</p>
        <p><strong>Email :</strong> ${profile.email}</p>
        ${profile.phone ? `<p><strong>Téléphone :</strong> ${profile.phone}</p>` : ''}
        <p><strong>Date inscription :</strong> ${date}</p>
      </div>`;

    // Construire les emails selon les destinataires configurés
    const emailPromises = recipients.map((recipient) => {
      const template = TEMPLATES[recipient.role];
      if (!template) return Promise.resolve();

      const { subject, html } = template({
        name: profile.full_name,
        email: profile.email,
        baseInfo,
        adminUrl,
      });

      return sendEmailServerSide({
        to: recipient.email,
        subject,
        html,
        fromType: 'noreply',
      });
    });

    await Promise.allSettled(emailPromises);

    return res.status(200).json({
      message: 'Notifications envoyées',
      recipients: recipients.map((r) => r.role),
    });
  } catch (error) {
    console.error('Erreur notify-client-inscription:', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
}
