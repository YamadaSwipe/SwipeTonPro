// =====================================================
// API Login Admin Fantôme - Contournement total Supabase Auth
// =====================================================

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  console.log('🔧 Admin Ghost Login API called:', email);

  // Vérifier credentials admin fantôme
  if (email !== 'admin@swipetonpro.fr' || password !== 'Admin123!') {
    console.log('❌ Invalid admin ghost credentials');
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  try {
    // Récupérer le profil admin réel par email
    const { data: adminProfile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'admin@swipotonpro.fr')
      .eq('role', 'super_admin')
      .maybeSingle();

    if (error || !adminProfile) {
      console.error('❌ Admin profile not found in DB:', error);
      return res
        .status(500)
        .json({ error: 'Admin profile not found in database' });
    }

    console.log('✅ Admin ghost login successful:', adminProfile.email);

    // Retourner les données admin
    return res.status(200).json({
      success: true,
      user: {
        id: adminProfile.id,
        email: adminProfile.email,
        full_name: adminProfile.full_name,
        role: adminProfile.role,
        created_at: adminProfile.created_at,
      },
    });
  } catch (error) {
    console.error('❌ Admin ghost login error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
