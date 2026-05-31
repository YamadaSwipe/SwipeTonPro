import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { withAdminAuth, AuthenticatedRequest } from '@/middleware/withAuth';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default withAdminAuth(async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        return await getPricingTiers(res);

      case 'POST':
        return await createPricingTier(req, res, req.user.id);

      case 'PUT':
        return await updatePricingTier(req, res, req.user.id);

      case 'DELETE':
        return await deletePricingTier(req, res);

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Error in match-pricing-tiers API:', error);
    return res.status(500).json({ error: error.message });
  }
});

async function getPricingTiers(res: NextApiResponse) {
  try {
    const { data, error } = await supabaseAdmin
      .from('match_pricing_tiers')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;

    // Get usage stats from view
    const { data: stats, error: statsError } = await supabaseAdmin
      .from('match_pricing_summary')
      .select('*');

    if (statsError) {
      console.warn('Could not fetch pricing summary:', statsError);
    }

    return res.status(200).json({
      success: true,
      tiers: data || [],
      stats: stats || [],
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

async function createPricingTier(
  req: NextApiRequest,
  res: NextApiResponse,
  adminId: string
) {
  try {
    const {
      key,
      label,
      description,
      budget_min,
      budget_max,
      credits_cost,
      price_cents,
      sort_order,
    } = req.body;

    if (!key || !label || price_cents === undefined) {
      return res
        .status(400)
        .json({ error: 'Missing required fields: key, label, price_cents' });
    }

    const { data, error } = await supabaseAdmin
      .from('match_pricing_tiers')
      .insert({
        key,
        label,
        description,
        budget_min: budget_min || 0,
        budget_max: budget_max || null,
        credits_cost: credits_cost || 1,
        price_cents,
        sort_order: sort_order || 0,
        created_by: adminId,
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({ success: true, tier: data });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

async function updatePricingTier(
  req: NextApiRequest,
  res: NextApiResponse,
  adminId: string
) {
  try {
    const { id, ...updates } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Missing tier id' });
    }

    // Use the database function for update
    const { data, error } = await supabaseAdmin.rpc(
      'update_match_pricing_tier',
      {
        p_tier_id: id,
        p_updates: updates,
        p_admin_id: adminId,
      }
    );

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

async function deletePricingTier(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Missing tier id' });
    }

    // Soft delete by setting is_active to false instead of hard delete
    const { data, error } = await supabaseAdmin
      .from('match_pricing_tiers')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({ success: true, tier: data });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
