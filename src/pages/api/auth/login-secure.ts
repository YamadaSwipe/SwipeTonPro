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
    return res.status(400).json({ error: 'Format d\'email invalide' });
  }

  try {
    console.log('🔐 Tentative de connexion sécurisée pour:', email);

    // Vérifier si c'est l'admin
    if (email === 'admin@swipetonpro.fr') {
      if (password !== process.env.ADMIN_SECURE_PASSWORD) {
        console.warn('⚠️ Tentative de connexion admin échouée');
        return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      }

      // Vérifier les conflits de comptes
      const { data: existingUser } = await supabaseAdmin
        .from('profiles')
        .select('id, role')
        .eq('email', email)
        .single();

      if (existingUser && existingUser.role !== 'super_admin') {
        console.error('🚨 Conflit admin détecté');
        return res.status(403).json({ error: 'Conflit de compte. Contactez l\'administrateur.' });
      }

      // Créer session admin sécurisée
      const adminSession = {
        user: {
          id: '29a2361d-6568-4d5f-99c6-557b971778cc',
          email: 'admin@swipetonpro.fr',
          role: 'super_admin',
          created_at: new Date().toISOString()
        },
        timestamp: Date.now(),
        isolation_key: 'EDSWIPE_ADMIN_ISOLATION_2024'
      };

      return res.status(200).json({
        success: true,
        user: adminSession.user,
        session: adminSession,
        isAdmin: true
      });
    }

    // Connexion utilisateur normal via Supabase
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.warn('⚠️ Erreur connexion utilisateur:', error.message);
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Récupérer le profil utilisateur
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    console.log('✅ Connexion réussie pour:', email);

    return res.status(200).json({
      success: true,
      user: data.user,
      profile,
      session: data.session,
      isAdmin: false
    });

  } catch (error: any) {
    console.error('❌ Erreur connexion sécurisée:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
