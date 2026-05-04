import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { matchId } = req.query;
  if (!matchId || typeof matchId !== 'string') {
    return res.status(400).json({ error: 'Invalid match ID' });
  }

  try {
    const { data: match, error } = await supabaseAdmin
      .from('matches')
      .select(`
        id,
        price_amount,
        project:projects(title, description, location, estimated_budget_min, estimated_budget_max),
        client:profiles(full_name),
        bid:bids(proposed_price)
      `)
      .eq('id', matchId)
      .single();

    if (error || !match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    return res.status(200).json({ success: true, match });
  } catch (error: any) {
    console.error('Error fetching match details:', error);
    return res.status(500).json({ error: error.message });
  }
}
