import type { NextApiRequest, NextApiResponse } from 'next';
import { sendEmailServerSide } from '@/lib/email';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

/**
 * API de relance automatique des abandons d'inscription pro
 * À appeler via cron toutes les 24h
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Vérifier le secret cron (optionnel mais recommandé)
  const cronSecret = req.headers['x-cron-secret'];
  if (cronSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Récupérer les abandons de plus de 24h sans relance
    const { data: abandons, error } = await supabaseAdmin
      .from('pro_signup_abandons')
      .select('*')
      .eq('reminder_sent', false)
      .eq('completed', false)
      .lt('step_reached_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(50);

    if (error) {
      console.error('Erreur récupération abandons:', error);
      return res.status(500).json({ message: 'Erreur base de données' });
    }

    if (!abandons || abandons.length === 0) {
      return res.status(200).json({ message: 'Aucun abandon à relancer', count: 0 });
    }

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const abandon of abandons) {
      try {
        const partialData = abandon.partial_data || {};
        const stepLabels: Record<string, string> = {
          auth: 'création du compte',
          info: 'informations entreprise',
          documents: 'documents requis',
          portfolio: 'portfolio',
        };

        const resumeUrl = `${BASE_URL}/professionnel/inscription`;

        // Envoyer l'email de relance
        await sendEmailServerSide({
          to: abandon.email,
          subject: '🚀 Finalisez votre inscription sur SwipeTonPro',
          html: `
            <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;">
              <div style="background:linear-gradient(135deg,#f97316,#fb923c);padding:24px;text-align:center;border-radius:12px 12px 0 0;">
                <h1 style="color:white;margin:0;font-size:22px;">SwipeTonPro</h1>
                <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">Vous y étiez presque !</p>
              </div>
              
              <div style="background:#fafafa;padding:24px;border-radius:0 0 12px 12px;">
                <p style="color:#1a1a1a;font-size:16px;margin-bottom:16px;">
                  Bonjour,
                </p>
                
                <p style="color:#555;font-size:14px;line-height:1.6;">
                  Vous avez commencé votre inscription en tant que professionnel sur <strong>SwipeTonPro</strong> 
                  mais ne l'avez pas finalisée. Ne laissez pas passer cette opportunité d'accéder à des chantiers qualifiés !
                </p>
                
                <div style="background:white;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #f97316;">
                  <h3 style="margin:0 0 12px;color:#1a1a1a;font-size:16px;">Où vous en étiez</h3>
                  <p style="margin:6px 0;font-size:14px;color:#555;">
                    <strong>Étape :</strong> ${stepLabels[abandon.last_step] || abandon.last_step}
                  </p>
                  ${partialData.company ? `<p style="margin:6px 0;font-size:14px;color:#555;"><strong>Entreprise :</strong> ${partialData.company}</p>` : ''}
                  ${partialData.city ? `<p style="margin:6px 0;font-size:14px;color:#555;"><strong>Ville :</strong> ${partialData.city}</p>` : ''}
                </div>
                
                <div style="background:#fff7ed;padding:16px;border-radius:8px;margin:20px 0;border:1px solid #fed7aa;">
                  <p style="color:#9a3412;font-size:14px;margin:0;line-height:1.5;">
                    <strong>⏱️ Il ne vous reste que quelques minutes</strong><br>
                    Vos informations sont sauvegardées, reprenez exactement où vous vous étiez arrêté.
                  </p>
                </div>
                
                <div style="text-align:center;margin:24px 0;">
                  <a href="${resumeUrl}" 
                     style="background:#f97316;color:white;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;display:inline-block;">
                    Reprendre mon inscription →
                  </a>
                </div>
                
                <p style="color:#888;font-size:12px;text-align:center;margin-top:24px;">
                  Si vous ne souhaitez pas finaliser votre inscription, vous pouvez ignorer cet email.<br>
                  Vos données seront automatiquement supprimées après 30 jours.
                </p>
              </div>
            </div>`,
          fromType: 'noreply',
        });

        // Marquer comme relancé
        await supabaseAdmin
          .from('pro_signup_abandons')
          .update({
            reminder_sent: true,
            reminder_sent_at: new Date().toISOString(),
            reminder_count: 1,
          })
          .eq('id', abandon.id);

        results.sent++;

      } catch (emailError) {
        console.error(`Erreur envoi relance à ${abandon.email}:`, emailError);
        results.failed++;
        results.errors.push(`${abandon.email}: ${(emailError as Error).message}`);
      }
    }

    return res.status(200).json({
      message: 'Relances envoyées',
      total: abandons.length,
      ...results,
    });

  } catch (error) {
    console.error('Erreur cron send-abandon-reminders:', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
}
