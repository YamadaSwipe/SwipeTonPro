import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    console.log('🔍 Vérification des conflits de comptes...');

    // Vérifier si admin@swipetonpro.fr existe dans profiles
    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', 'admin@swipetonpro.fr')
      .single();

    console.log('🔐 Admin profile check:', {
      found: !!adminProfile,
      error: adminError?.message,
      role: adminProfile?.role
    });

    // Vérifier si bgreen.rs@gmail.com existe
    const { data: userProfile, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', 'bgreen.rs@gmail.com')
      .single();

    console.log('👤 User profile check:', {
      found: !!userProfile,
      error: userError?.message,
      role: userProfile?.role,
      id: userProfile?.id
    });

    // Vérifier s'il y a des doublons d'emails
    const { data: allProfiles } = await supabaseAdmin
      .from('profiles')
      .select('email, role, id, created_at')
      .in('email', ['admin@swipetonpro.fr', 'bgreen.rs@gmail.com']);

    console.log('📋 All relevant profiles:', allProfiles);

    return res.status(200).json({
      adminProfile: adminProfile ? {
        id: adminProfile.id,
        email: adminProfile.email,
        role: adminProfile.role,
        created_at: adminProfile.created_at
      } : null,
      userProfile: userProfile ? {
        id: userProfile.id,
        email: userProfile.email,
        role: userProfile.role,
        created_at: userProfile.created_at
      } : null,
      adminError: adminError?.message || null,
      userError: userError?.message || null,
      allProfiles: allProfiles || [],
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Erreur vérification conflits:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
}
