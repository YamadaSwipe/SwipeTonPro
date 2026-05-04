import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'GET only' });
  }

  const { user_id, user_type } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id requis' });
  }

  try {
    if (user_type === 'professional') {
      // Matches du professionnel
      const { data: matches, error } = await supabase
        .from('matches')
        .select(`
          *,
          project:projects(id, title, category, city, status, client_id),
          professional:professionals(id, company_name)
        `)
        .eq('professional_id', user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Notifications non lues
      const { data: notifications } = await supabase
        .from('match_notifications')
        .select('*')
        .eq('recipient_id', user_id)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      return res.status(200).json({ matches, notifications, count: matches?.length || 0 });

    } else {
      // Matches du client (par project)
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('client_id', user_id);

      const projectIds = projects?.map(p => p.id) || [];

      const { data: matches, error } = await supabase
        .from('matches')
        .select(`
          *,
          project:projects(id, title, category, city),
          professional:professionals(id, company_name, specialties, rating_average)
        `)
        .in('project_id', projectIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Notifications
      const { data: notifications } = await supabase
        .from('match_notifications')
        .select('*')
        .eq('recipient_id', user_id)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      return res.status(200).json({ matches, notifications, count: matches?.length || 0 });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
