import type { NextApiRequest, NextApiResponse } from 'next';
import { sendEmailServerSide } from '@/lib/email';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: 'userId requis' });

  try {
    // Récupérer le profil + données pro
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email, phone')
      .eq('id', userId)
      .single();

    const { data: pro } = await supabaseAdmin
      .from('professionals')
      .select('company_name, siret, specialties, description')
      .eq('user_id', userId)
      .single();

    if (!profile || !pro) {
      return res.status(404).json({ message: 'Profil introuvable' });
    }

    const adminUrl = `${BASE_URL}/admin/professionals-validation`;
    const specialties = (pro.specialties || []).join(', ') || 'Non renseignées';
    const date = new Date().toLocaleDateString('fr-FR');

    const baseInfo = `
      <div style="background:white;padding:20px;border-radius:8px;margin:16px 0;font-size:14px;">
        <p><strong>Entreprise :</strong> ${pro.company_name}</p>
        <p><strong>SIRET :</strong> ${pro.siret}</p>
        <p><strong>Spécialités :</strong> ${specialties}</p>
        <p><strong>Contact :</strong> ${profile.full_name || ''} — ${profile.email}</p>
        ${profile.phone ? `<p><strong>Téléphone :</strong> ${profile.phone}</p>` : ''}
        <p><strong>Date inscription :</strong> ${date}</p>
      </div>`;

    await Promise.allSettled([
      // Admin
      sendEmailServerSide({
        to: 'admin@swipetonpro.fr',
        subject: `🔔 Nouveau professionnel à valider — ${pro.company_name}`,
        html: `
          <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:linear-gradient(135deg,#7c3aed,#9333ea);padding:24px;text-align:center;border-radius:12px 12px 0 0;">
              <h1 style="color:white;margin:0;font-size:20px;">SwipeTonPro — Admin</h1>
              <p style="color:rgba(255,255,255,0.9);margin:6px 0 0;font-size:14px;">🔔 Validation requise</p>
            </div>
            <div style="background:#fafafa;padding:24px;border-radius:0 0 12px 12px;">
              <h2 style="color:#1a1a1a;margin:0 0 12px;font-size:18px;">Nouveau professionnel en attente</h2>
              ${baseInfo}
              <div style="text-align:center;margin-top:20px;">
                <a href="${adminUrl}" style="background:#7c3aed;color:white;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;display:inline-block;">
                  Valider / Refuser →
                </a>
              </div>
            </div>
          </div>`,
        fromType: 'noreply',
      }),

      // Support
      sendEmailServerSide({
        to: 'support@swipetonpro.fr',
        subject: `📋 Support — Nouveau pro à valider : ${pro.company_name}`,
        html: `
          <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#ea580c;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
              <h1 style="color:white;margin:0;font-size:20px;">SwipeTonPro — Support</h1>
              <p style="color:rgba(255,255,255,0.9);margin:6px 0 0;">Préparation activation compte</p>
            </div>
            <div style="background:#fafafa;padding:24px;border-radius:0 0 12px 12px;">
              <p style="color:#555;font-size:14px;">Un nouveau professionnel attend validation. Préparez l'activation du compte.</p>
              ${baseInfo}
            </div>
          </div>`,
        fromType: 'noreply',
      }),

      // Team
      sendEmailServerSide({
        to: 'team@swipetonpro.fr',
        subject: `🚀 Team — Nouveau pro inscrit : ${pro.company_name}`,
        html: `
          <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#16a34a;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
              <h1 style="color:white;margin:0;font-size:20px;">SwipeTonPro — Team</h1>
              <p style="color:rgba(255,255,255,0.9);margin:6px 0 0;">🎉 Croissance du réseau</p>
            </div>
            <div style="background:#fafafa;padding:24px;border-radius:0 0 12px 12px;">
              <p style="color:#555;font-size:14px;">Un nouveau professionnel rejoint notre réseau !</p>
              ${baseInfo}
              <p style="color:#16a34a;font-weight:700;font-size:14px;text-align:center;margin-top:16px;">
                🎉 +1 professionnel dans le réseau SwipeTonPro !
              </p>
            </div>
          </div>`,
        fromType: 'noreply',
      }),
    ]);

    return res.status(200).json({ message: 'Notifications envoyées' });

  } catch (error) {
    console.error('Erreur notify-pro-inscription:', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
}
