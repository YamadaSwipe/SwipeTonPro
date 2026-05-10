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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }

    console.log('🔍 Recherche utilisateur:', email);

    // Vérifier dans la table profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    console.log('👤 Profile:', profile?.id || 'Non trouvé');
    console.log('❌ Profile error:', profileError?.message || 'Aucune erreur');

    // Vérifier les tentatives de connexion récentes
    const { data: authLogs } = await supabase
      .from('auth_logs')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(5);

    console.log('📋 Auth logs:', authLogs?.length || 0);

    return res.status(200).json({
      email: email,
      profile: profile
        ? {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            role: profile.role,
            created_at: profile.created_at,
          }
        : null,
      profileError: profileError?.message || null,
      authLogs: authLogs || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Erreur debug utilisateur:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      message: error.message,
    });
  }
}
