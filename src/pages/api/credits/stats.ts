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

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!['admin', 'super_admin'].includes(profile?.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { data: professionals } = await supabaseAdmin
      .from('professionals')
      .select('credits_balance');

    const { data: transactions } = await supabaseAdmin
      .from('credit_transactions')
      .select('amount_euros, credits_purchased')
      .eq('transaction_type', 'purchase')
      .eq('status', 'completed');

    const totalCredits = professionals?.reduce((sum, p) => sum + (p.credits_balance || 0), 0) || 0;
    const activePros = professionals?.filter(p => (p.credits_balance || 0) > 0).length || 0;
    const totalPurchases = transactions?.length || 0;
    const totalRevenue = transactions?.reduce((sum, t) => sum + (t.amount_euros || 0), 0) || 0;
    const avgBalance = professionals?.length ? Math.round(totalCredits / professionals.length) : 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalCreditsInCirculation: totalCredits,
        totalPurchases,
        totalRevenue,
        activeProfessionals: activePros,
        avgBalance,
      },
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({ error: error.message });
  }
}
