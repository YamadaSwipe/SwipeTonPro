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
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  try {
    console.log(`🧪 Test de connexion pour: ${email}`);

    // 1. Vérifier si l'utilisateur existe dans auth.users
    const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      return res.status(500).json({ error: 'Erreur liste utilisateurs', details: listError.message });
    }

    const authUser = authUsers.users.find(u => u.email === email);
    
    if (!authUser) {
      return res.status(404).json({ 
        error: 'Utilisateur non trouvé',
        email: email,
        existsInAuth: false
      });
    }

    // 2. Vérifier le profil dans la table profiles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    // 3. Tester la connexion
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    const result = {
      email: email,
      authUser: {
        id: authUser.id,
        email: authUser.email,
        email_confirmed_at: authUser.email_confirmed_at,
        last_sign_in_at: authUser.last_sign_in_at,
        created_at: authUser.created_at,
        user_metadata: authUser.user_metadata
      },
      profile: profile || null,
      profileError: profileError?.message || null,
      signInTest: {
        success: !signInError,
        error: signInError?.message || null,
        user: signInData?.user ? {
          id: signInData.user.id,
          email: signInData.user.email
        } : null,
        session: signInData?.session ? {
          access_token: signInData.session.access_token.substring(0, 20) + '...',
          expires_at: signInData.session.expires_at
        } : null
      },
      recommendations: []
    };

    // 4. Générer des recommandations
    if (signInError) {
      if (signInError.message?.includes('Invalid login credentials')) {
        result.recommendations.push('❌ Mot de passe incorrect. Vérifiez les majuscules/minuscules.');
      } else if (signInError.message?.includes('Email not confirmed')) {
        result.recommendations.push('📧 Email non confirmé. Vérifiez votre boîte mail.');
      } else {
        result.recommendations.push(`⚠️ Erreur: ${signInError.message}`);
      }
    }

    if (authUser && !authUser.email_confirmed_at) {
      result.recommendations.push('📧 L\'email n\'est pas confirmé. Regardez dans les spams.');
    }

    if (!profile && !profileError) {
      result.recommendations.push('👤 L\'utilisateur existe dans auth mais pas dans profiles. Contactez l\'admin.');
    }

    // Nettoyer la session si succès
    if (signInData?.session) {
      await supabaseAdmin.auth.signOut();
    }

    console.log(`✅ Test de connexion terminé pour: ${email}`, {
      success: !signInError,
      hasProfile: !!profile,
      emailConfirmed: !!authUser.email_confirmed_at
    });

    return res.status(200).json({
      success: true,
      result
    });

  } catch (error: any) {
    console.error('❌ Erreur test mot de passe:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
}
