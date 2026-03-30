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

  const { professionalId, action, reason, proEmail, companyName } = req.body;

  if (!professionalId || !action) {
    return res.status(400).json({ message: 'professionalId et action requis' });
  }
  if (action === 'reject' && !reason) {
    return res.status(400).json({ message: 'Motif requis pour un rejet' });
  }

  try {
    // Récupérer email si pas fourni
    let email = proEmail;
    let company = companyName;

    if (!email) {
      const { data: pro } = await supabaseAdmin
        .from('professionals')
        .select('company_name, user_id')
        .eq('id', professionalId)
        .single();

      if (pro) {
        company = pro.company_name;
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('email')
          .eq('id', pro.user_id)
          .single();
        email = profile?.email;
      }
    }

    if (!email) return res.status(404).json({ message: 'Email introuvable' });

    const dashboardUrl = `${BASE_URL}/professionnel/dashboard`;
    const inscriptionUrl = `${BASE_URL}/professionnel/inscription`;

    if (action === 'approve') {
      await sendEmailServerSide({
        to: email,
        subject: `✅ Votre compte professionnel est activé — SwipeTonPro`,
        html: `
          <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8f9fa;">
            <div style="background:linear-gradient(135deg,#16a34a,#22c55e);padding:32px 24px;text-align:center;border-radius:12px 12px 0 0;">
              <h1 style="color:white;margin:0;font-size:28px;font-weight:800;">SwipeTon<span style="opacity:.85;">Pro</span></h1>
              <p style="color:rgba(255,255,255,.95);margin:8px 0 0;font-size:16px;">✅ Compte approuvé !</p>
            </div>
            <div style="background:white;padding:36px 32px;">
              <h2 style="color:#1a1a1a;margin:0 0 8px;font-size:22px;">Félicitations ${company || ''} !</h2>
              <p style="color:#555;line-height:1.7;margin:0 0 24px;font-size:15px;">
                Votre compte professionnel a été <strong>validé par notre équipe</strong>. 
                Vous pouvez maintenant accéder à votre dashboard et commencer à trouver des projets.
              </p>

              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px;margin:0 0 24px;">
                <h3 style="color:#15803d;margin:0 0 12px;font-size:15px;font-weight:700;">🚀 Pour commencer</h3>
                <p style="color:#166534;margin:5px 0;font-size:14px;">1. Connectez-vous à votre dashboard professionnel</p>
                <p style="color:#166534;margin:5px 0;font-size:14px;">2. Complétez votre profil si nécessaire</p>
                <p style="color:#166534;margin:5px 0;font-size:14px;">3. Parcourez les projets disponibles</p>
                <p style="color:#166534;margin:5px 0;font-size:14px;">4. Exprimez votre intérêt sur les projets qui vous correspondent</p>
              </div>

              <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px;margin:0 0 28px;">
                <p style="color:#1d4ed8;font-size:14px;margin:0;">
                  💡 <strong>Rappel :</strong> Une fois qu'un particulier accepte votre candidature (MATCH), 
                  vous pouvez payer la mise en relation pour accéder à ses coordonnées et organiser un RDV.
                </p>
              </div>

              <div style="text-align:center;">
                <a href="${dashboardUrl}" style="background:linear-gradient(135deg,#16a34a,#22c55e);color:white;padding:14px 36px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:700;font-size:15px;">
                  Accéder à mon dashboard →
                </a>
              </div>
            </div>
            <div style="background:#f8f9fa;padding:20px;text-align:center;border-radius:0 0 12px 12px;border-top:1px solid #e5e7eb;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">SwipeTonPro — La mise en relation BTP par intérêt mutuel</p>
            </div>
          </div>`,
        fromType: 'noreply',
      });

    } else if (action === 'reject') {
      await sendEmailServerSide({
        to: email,
        subject: `❌ Votre inscription professionnelle — SwipeTonPro`,
        html: `
          <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8f9fa;">
            <div style="background:linear-gradient(135deg,#dc2626,#ef4444);padding:32px 24px;text-align:center;border-radius:12px 12px 0 0;">
              <h1 style="color:white;margin:0;font-size:28px;font-weight:800;">SwipeTon<span style="opacity:.85;">Pro</span></h1>
              <p style="color:rgba(255,255,255,.95);margin:8px 0 0;font-size:16px;">❌ Inscription refusée</p>
            </div>
            <div style="background:white;padding:36px 32px;">
              <h2 style="color:#1a1a1a;margin:0 0 8px;font-size:22px;">Bonjour ${company || ''}</h2>
              <p style="color:#555;line-height:1.7;margin:0 0 24px;font-size:15px;">
                Après examen de votre dossier, votre inscription n'a pas pu être validée en l'état.
              </p>

              <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:20px;margin:0 0 24px;">
                <h3 style="color:#dc2626;margin:0 0 8px;font-size:14px;font-weight:700;">Motif du refus :</h3>
                <p style="color:#991b1b;font-size:14px;margin:0;font-style:italic;">"${reason}"</p>
              </div>

              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px;margin:0 0 28px;">
                <h3 style="color:#15803d;margin:0 0 12px;font-size:14px;font-weight:700;">✏️ Que faire ?</h3>
                <p style="color:#166534;margin:5px 0;font-size:14px;">1. Corrigez les éléments mentionnés dans le motif</p>
                <p style="color:#166534;margin:5px 0;font-size:14px;">2. Soumettez à nouveau votre inscription</p>
                <p style="color:#166534;margin:5px 0;font-size:14px;">3. Notre équipe revalidera votre dossier sous 24h</p>
              </div>

              <div style="text-align:center;margin:0 0 16px;">
                <a href="${inscriptionUrl}" style="background:linear-gradient(135deg,#ea580c,#f97316);color:white;padding:14px 36px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:700;font-size:15px;">
                  Refaire mon inscription →
                </a>
              </div>
              <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0;">
                Questions ? <a href="mailto:support@qwipetonpro.fr" style="color:#ea580c;">support@qwipetonpro.fr</a>
              </p>
            </div>
            <div style="background:#f8f9fa;padding:20px;text-align:center;border-radius:0 0 12px 12px;border-top:1px solid #e5e7eb;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">SwipeTonPro — La mise en relation BTP par intérêt mutuel</p>
            </div>
          </div>`,
        fromType: 'noreply',
      });

    } else if (action === 'suspend') {
      await sendEmailServerSide({
        to: email,
        subject: `⚠️ Votre compte professionnel — SwipeTonPro`,
        html: `
          <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8f9fa;">
            <div style="background:linear-gradient(135deg,#f59e0b,#f97316);padding:32px 24px;text-align:center;border-radius:12px 12px 0 0;">
              <h1 style="color:white;margin:0;font-size:28px;font-weight:800;">SwipeTon<span style="opacity:.85;">Pro</span></h1>
              <p style="color:rgba(255,255,255,.95);margin:8px 0 0;font-size:16px;">⚠️ Compte suspendu</p>
            </div>
            <div style="background:white;padding:36px 32px;">
              <h2 style="color:#1a1a1a;margin:0 0 8px;font-size:22px;">Bonjour ${company || ''}</h2>
              <p style="color:#555;line-height:1.7;margin:0 0 24px;font-size:15px;">
                Votre compte professionnel a été temporairement suspendu par notre équipe d'administration.
              </p>

              <div style="background:#fef3c7;border:1px solid #fde047;border-radius:10px;padding:20px;margin:0 0 24px;">
                <h3 style="color:#d97706;margin:0 0 8px;font-size:14px;font-weight:700;">Raison de la suspension :</h3>
                <p style="color:#92400e;font-size:14px;margin:0;font-style:italic;">"${reason}"</p>
              </div>

              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px;margin:0 0 28px;">
                <h3 style="color:#15803d;margin:0 0 12px;font-size:14px;font-weight:700;">📋 Que faire ?</h3>
                <p style="color:#166534;margin:5px 0;font-size:14px;">1. Contactez le support pour comprendre la suspension</p>
                <p style="color:#166534;margin:5px 0;font-size:14px;">2. Régularisez votre situation si nécessaire</p>
                <p style="color:#166534;margin:5px 0;font-size:14px;">3. Notre équipe réévaluera votre dossier</p>
              </div>

              <div style="text-align:center;margin:0 0 16px;">
                <a href="mailto:support@qwipetonpro.fr" style="background:linear-gradient(135deg,#f59e0b,#f97316);color:white;padding:14px 36px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:700;font-size:15px;">
                  Contacter le support →
                </a>
              </div>
              <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0;">
                Questions ? <a href="mailto:support@qwipetonpro.fr" style="color:#f59e0b;">support@qwipetonpro.fr</a>
              </p>
            </div>
            <div style="background:#f8f9fa;padding:20px;text-align:center;border-radius:0 0 12px 12px;border-top:1px solid #e5e7eb;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">SwipeTonPro — La mise en relation BTP par intérêt mutuel</p>
            </div>
          </div>`,
        fromType: 'noreply',
      });
    }

    return res.status(200).json({ message: `Email ${action} envoyé` });

  } catch (error) {
    console.error('Erreur notify-pro-status:', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
}
