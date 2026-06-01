import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { loginRateLimit } from '@/middleware/rateLimit';

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

  // Appliquer le rate limiting
  await new Promise<void>((resolve, reject) => {
    loginRateLimit(req, res, () => resolve());
  });

  if (res.headersSent) {
    return; // Le rate limiting a déjà répondu
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  // Validation email stricte
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Format d'email invalide" });
  }

  try {
    console.log('🔐 Tentative de connexion sécurisée pour:', email);

    // Connexion via Supabase pour tous les utilisateurs (y compris admin)
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.warn('⚠️ Erreur connexion:', error.message);
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Récupérer le profil utilisateur
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (!profile) {
      return res.status(404).json({ error: 'Profil introuvable' });
    }

    console.log('✅ Connexion réussie pour:', email, 'Rôle:', profile.role);

    return res.status(200).json({
      success: true,
      user: data.user,
      profile,
      session: data.session,
      isAdmin: profile.role === 'super_admin' || profile.role === 'admin',
    });
  } catch (error: any) {
    console.error('❌ Erreur connexion sécurisée:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
