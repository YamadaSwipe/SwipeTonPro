import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return getPackages(req, res);
    case 'POST':
      return createPackage(req, res);
    case 'PUT':
      return updatePackage(req, res);
    case 'DELETE':
      return deletePackage(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getPackages(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { active } = req.query;
    
    let query = supabaseAdmin.from('credit_packages').select('*');
    
    if (active === 'true') {
      query = query.eq('is_active', true);
    }
    
    const { data, error } = await query.order('sort_order', { ascending: true });
    
    if (error) throw error;
    
    return res.status(200).json({
      success: true,
      packages: data || [],
    });
  } catch (error: any) {
    console.error('Error fetching packages:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function createPackage(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify admin
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
    
    const { name, credits_amount, price_euros, bonus_credits, is_promotional, promotion_label, is_active, sort_order } = req.body;
    
    const { data, error } = await supabaseAdmin
      .from('credit_packages')
      .insert({
        name,
        credits_amount,
        price_euros,
        bonus_credits: bonus_credits || 0,
        is_promotional: is_promotional || false,
        promotion_label,
        is_active: is_active ?? true,
        sort_order: sort_order || 0,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return res.status(201).json({ success: true, package: data });
  } catch (error: any) {
    console.error('Error creating package:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function updatePackage(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify admin
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
    
    const { id, ...updates } = req.body;
    
    const { data, error } = await supabaseAdmin
      .from('credit_packages')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return res.status(200).json({ success: true, package: data });
  } catch (error: any) {
    console.error('Error updating package:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function deletePackage(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify admin
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
    
    const { id } = req.query;
    
    const { error } = await supabaseAdmin
      .from('credit_packages')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error deleting package:', error);
    return res.status(500).json({ error: error.message });
  }
}
