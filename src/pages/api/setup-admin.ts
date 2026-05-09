// API pour créer le vrai compte admin
// À exécuter une seule fois pour initialiser l'admin

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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Créer l'utilisateur dans auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@swipetonpro.fr',
      password: 'Admin1980',
      email_confirm: true,
      user_metadata: {
        full_name: 'Super Admin',
        role: 'super_admin'
      }
    });

    if (authError && !authError.message?.includes('already registered')) {
      console.error('❌ Erreur création utilisateur auth:', authError);
      return res.status(500).json({ error: 'Erreur création utilisateur auth', details: authError.message });
    }

    // 2. Créer ou mettre à jour le profil dans profiles
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authData.user?.id || '29a2361d-6568-4d5f-99c6-557b971778cc',
        email: 'admin@swipetonpro.fr',
        full_name: 'Super Admin',
        role: 'super_admin',
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Erreur création profil:', profileError);
      return res.status(500).json({ error: 'Erreur création profil', details: profileError.message });
    }

    console.log('✅ Compte admin créé avec succès');

    return res.status(200).json({
      success: true,
      message: 'Compte admin créé avec succès',
      user: {
        id: profileData.id,
        email: profileData.email,
        full_name: profileData.full_name,
        role: profileData.role
      }
    });

  } catch (error) {
    console.error('❌ Erreur setup admin:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: error });
  }
}
