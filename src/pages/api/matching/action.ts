import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { action, match_id, user_id } = req.body;
  if (!match_id || !action) return res.status(400).json({ error: 'match_id et action requis' });

  try {
    const { data: match, error: fetchError } = await supabase
      .from('matches')
      .select('*, project:projects(client_id, title), professional:professionals(user_id, company_name)')
      .eq('id', match_id)
      .single();

    if (fetchError || !match) return res.status(404).json({ error: 'Match non trouvé' });

    if (action === 'accept') {
      // Vérifier que c'est le client
      if (match.project.client_id !== user_id) {
        return res.status(403).json({ error: 'Seul le client peut accepter' });
      }

      const { data, error } = await supabase
        .from('matches')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', match_id)
        .select()
        .single();

      if (error) throw error;

      // Notifier pro
      await supabase.from('match_notifications').insert({
        recipient_id: match.professional.user_id,
        type: 'match_accepted',
        title: 'Candidature acceptée',
        message: `Votre candidature pour "${match.project.title}" a été acceptée`
      });

      return res.status(200).json({ success: true, match: data });

    } else if (action === 'reject') {
      if (match.project.client_id !== user_id) {
        return res.status(403).json({ error: 'Seul le client peut refuser' });
      }

      const { data, error } = await supabase
        .from('matches')
        .update({ status: 'rejected' })
        .eq('id', match_id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ success: true, match: data });

    } else if (action === 'pay') {
      // Vérifier que c'est le pro
      if (match.professional.user_id !== user_id) {
        return res.status(403).json({ error: 'Seul le professionnel peut payer' });
      }

      const { data, error } = await supabase
        .from('matches')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', match_id)
        .select()
        .single();

      if (error) throw error;

      // Notifier client
      await supabase.from('match_notifications').insert({
        recipient_id: match.project.client_id,
        type: 'payment_received',
        title: 'Paiement confirmé',
        message: `${match.professional.company_name} a payé la mise en relation`
      });

      return res.status(200).json({ success: true, match: data });
    }

    return res.status(400).json({ error: 'Action invalide (accept/reject/pay)' });

  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
