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
  if (email !== 'admin@swipetonpro.fr' || password !== 'Admin1980') {
    console.log('❌ Invalid admin ghost credentials');
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  try {
    // Tenter d'abord l'authentification Supabase normale
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

    if (!authError && authData.user) {
      // Récupérer le profil complet
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (!profileError && profileData) {
        console.log(
          '✅ Admin login successful via Supabase:',
          profileData.email
        );
        return res.status(200).json({
          success: true,
          user: profileData,
        });
      }
    }

    // Si l'auth Supabase échoue, utiliser le fallback admin fantôme
    console.log('🔧 Fallback admin fantôme activé');
    const adminProfile = {
      id: '29a2361d-6568-4d5f-99c6-557b971778cc',
      email: 'admin@swipetonpro.fr',
      full_name: 'Super Admin',
      role: 'super_admin',
      created_at: new Date().toISOString(),
    };

    console.log('✅ Admin ghost fallback successful:', adminProfile.email);
    return res.status(200).json({
      success: true,
      user: adminProfile,
      note: 'Utilisation du fallback admin fantôme',
    });
  } catch (error) {
    console.error('❌ Admin login error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
