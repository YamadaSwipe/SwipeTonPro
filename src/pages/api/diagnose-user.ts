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

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email requis' });
  }

  try {
    console.log('🔍 Diagnostic pour email:', email);

    // 1. Chercher l'utilisateur dans auth.users
    const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Erreur listUsers:', authError);
      return res.status(500).json({ error: 'Erreur récupération utilisateurs' });
    }

    const user = users?.find(u => u.email === email);

    if (!user) {
      return res.status(404).json({ 
        error: 'Utilisateur non trouvé',
        details: 'Aucun utilisateur avec cet email dans auth.users'
      });
    }

    console.log('✅ Utilisateur trouvé:', {
      id: user.id,
      email: user.email,
      email_confirmed: user.email_confirmed_at,
      created_at: user.created_at,
      last_sign_in: user.last_sign_in_at,
      banned: user.banned_until,
    });

    // 2. Chercher le profil dans profiles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Erreur profil:', profileError);
    }

    console.log('📊 Profil:', profile ? {
      id: profile.id,
      role: profile.role,
      user_id: profile.user_id,
    } : 'Non trouvé');

    // 3. Vérifier si le mot de passe peut être réinitialisé
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
    });

    if (resetError) {
      console.error('❌ Erreur generateLink:', resetError);
    } else {
      console.log('✅ Lien de récupération généré:', !!resetData?.properties?.action_link);
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        email_confirmed: !!user.email_confirmed_at,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        banned_until: user.banned_until,
      },
      profile: profile || null,
      can_generate_reset_link: !resetError,
      reset_link_error: resetError?.message || null,
    });
  } catch (error: any) {
    console.error('❌ Erreur diagnostic:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
}
