import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const { action, project_id, professional_id, match_id, client_id, message } = req.body;

  try {
    switch (action) {
      case 'create_interest': {
        // Pro candidature automatique avec trigger
        const { data, error } = await supabase
          .from('project_interests')
          .insert({
            project_id,
            professional_id,
            status: 'interested'
          })
          .select('*, project:projects(*), professional:professionals(*)')
          .single();

        if (error) throw error;

        // Notification au client
        await notifyClient(data.project.client_id, 'Nouvelle candidature', 
          `${data.professional.company_name} est intéressé par votre projet`);

        return res.status(200).json({ success: true, interest: data, match_created: true });
      }

      case 'accept_match': {
        // Client accepte le match
        const { data: match, error } = await supabase
          .from('matches')
          .update({ status: 'accepted', accepted_at: new Date().toISOString() })
          .eq('id', match_id)
          .select('*, professional:professionals(*), project:projects(*)')
          .single();

        if (error) throw error;

        // Notifier le pro
        await notifyPro(match.professional.user_id, 'Candidature acceptée',
          `Le client a accepté votre candidature pour "${match.project.title}"`);

        return res.status(200).json({ success: true, match });
      }

      case 'reject_match': {
        // Client refuse
        const { data: match, error } = await supabase
          .from('matches')
          .update({ status: 'rejected' })
          .eq('id', match_id)
          .select()
          .single();

        if (error) throw error;

        return res.status(200).json({ success: true, match });
      }

      case 'confirm_payment': {
        // Paiement confirmé - match devient actif
        const { data: match, error } = await supabase
          .from('matches')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('id', match_id)
          .select('*, professional:professionals(*), project:projects(*)')
          .single();

        if (error) throw error;

        // Notifications des deux côtés
        await notifyClient(match.project.client_id, 'Match confirmé',
          `${match.professional.company_name} a accès à vos coordonnées`);
        await notifyPro(match.professional.user_id, 'Paiement confirmé',
          `Vous avez maintenant accès aux coordonnées du client`);

        return res.status(200).json({ success: true, match });
      }

      default:
        return res.status(400).json({ error: 'Action inconnue' });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

async function notifyClient(recipient_id: string, title: string, message: string) {
  await supabase.from('match_notifications').insert({
    recipient_id, type: 'interest_received', title, message
  });
}

async function notifyPro(recipient_id: string, title: string, message: string) {
  await supabase.from('match_notifications').insert({
    recipient_id, type: 'match_accepted', title, message
  });
}
