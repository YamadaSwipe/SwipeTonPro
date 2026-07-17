import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { withAuth, AuthenticatedRequest } from '@/middleware/withAuth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default withAuth(async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'GET only' });
  }

  const requestedUserType = Array.isArray(req.query.user_type)
    ? req.query.user_type[0]
    : req.query.user_type;
  const page = Math.max(
    1,
    Number(Array.isArray(req.query.page) ? req.query.page[0] : req.query.page) || 1
  );
  const limit = Math.min(
    50,
    Math.max(
      1,
      Number(Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit) || 20
    )
  );
  const offset = (page - 1) * limit;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  if (!userId) {
    return res.status(401).json({ error: 'Utilisateur non authentifié' });
  }

  const isProfessionalRequest =
    requestedUserType === 'professional' || userRole === 'professional';

  try {
    if (isProfessionalRequest) {
      // Matches du professionnel
      const { data: matches, error } = await supabase
        .from('matches')
        .select(
          `
          *,
          project:projects(id, title, category, city, status, client_id),
          professional:professionals(id, company_name)
        `
        )
        .eq('professional_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Notifications non lues
      const { data: notifications } = await supabase
        .from('match_notifications')
        .select('id, type, title, message, created_at, related_match_id')
        .eq('recipient_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(20);

      return res.status(200).json({
        matches,
        notifications,
        count: matches?.length || 0,
        pagination: { page, limit },
      });
    } else {
      // Matches du client (par project)
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('client_id', userId);

      const projectIds = projects?.map((p) => p.id) || [];

      if (projectIds.length === 0) {
        return res.status(200).json({
          matches: [],
          notifications: [],
          count: 0,
          pagination: { page, limit },
        });
      }

      const { data: matches, error } = await supabase
        .from('matches')
        .select(
          `
          *,
          project:projects(id, title, category, city),
          professional:professionals(id, company_name, specialties, rating_average)
        `
        )
        .in('project_id', projectIds)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Notifications
      const { data: notifications } = await supabase
        .from('match_notifications')
        .select('id, type, title, message, created_at, related_match_id')
        .eq('recipient_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(20);

      return res.status(200).json({
        matches,
        notifications,
        count: matches?.length || 0,
        pagination: { page, limit },
      });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
