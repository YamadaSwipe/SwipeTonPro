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

  const { userId, companyName, siret } = req.body;
  if (!userId) return res.status(400).json({ message: 'userId requis' });

  try {
    // Récupérer le profil
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single();

    if (!profile?.email) {
      return res.status(404).json({ message: 'Email introuvable' });
    }

    const date = new Date().toLocaleDateString('fr-FR');
    const dashboardUrl = `${BASE_URL}/professionnel/validation-en-cours`;

    // Envoyer email de confirmation au pro
    await sendEmailServerSide({
      to: profile.email,
      subject: `✅ Inscription confirmée — ${companyName || 'Votre entreprise'}`,
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#16a34a,#22c55e);padding:24px;text-align:center;border-radius:12px 12px 0 0;">
            <h1 style="color:white;margin:0;font-size:22px;">SwipeTonPro</h1>
            <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">Inscription enregistrée</p>
          </div>
          
          <div style="background:#fafafa;padding:24px;border-radius:0 0 12px 12px;">
            <p style="color:#1a1a1a;font-size:16px;margin-bottom:16px;">
              Bonjour ${profile.full_name || ''},
            </p>
            
            <p style="color:#555;font-size:14px;line-height:1.6;">
              Votre inscription en tant que professionnel sur <strong>SwipeTonPro</strong> a bien été enregistrée.
            </p>
            
            <div style="background:white;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #22c55e;">
              <h3 style="margin:0 0 12px;color:#1a1a1a;font-size:16px;">Récapitulatif de votre dossier</h3>
              <p style="margin:6px 0;font-size:14px;color:#555;"><strong>Entreprise :</strong> ${companyName || 'Non renseigné'}</p>
              <p style="margin:6px 0;font-size:14px;color:#555;"><strong>SIRET :</strong> ${siret || 'Non renseigné'}</p>
              <p style="margin:6px 0;font-size:14px;color:#555;"><strong>Date d'inscription :</strong> ${date}</p>
            </div>
            
            <div style="background:#f0fdf4;padding:16px;border-radius:8px;margin:20px 0;border:1px solid #bbf7d0;">
              <p style="color:#166534;font-size:14px;margin:0;line-height:1.5;">
                <strong>⏳ Prochaine étape : Validation</strong><br>
                Notre équipe examine votre dossier. Vous recevrez une notification sous 24-48h.
              </p>
            </div>
            
            <p style="color:#555;font-size:14px;line-height:1.6;margin-top:20px;">
              Vous pouvez consulter l'état de votre dossier à tout moment :
            </p>
            
            <div style="text-align:center;margin:24px 0;">
              <a href="${dashboardUrl}" 
                 style="background:#16a34a;color:white;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;display:inline-block;">
                Voir mon dossier →
              </a>
            </div>
            
            <div style="border-top:1px solid #e5e5e5;padding-top:20px;margin-top:24px;">
              <p style="color:#888;font-size:12px;margin:0;text-align:center;">
                Cet email vous a été envoyé automatiquement suite à votre inscription sur SwipeTonPro.<br>
                Si vous n'êtes pas à l'origine de cette demande, veuillez nous contacter.
              </p>
            </div>
          </div>
        </div>`,
      fromType: 'noreply',
    });

    return res.status(200).json({ message: 'Email de confirmation envoyé' });

  } catch (error) {
    console.error('Erreur notify-pro-confirmation:', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
}
