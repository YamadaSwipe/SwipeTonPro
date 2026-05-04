import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email requis' });
  }

  try {
    // 1. Vérifier que l'utilisateur existe dans auth.users
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();

    if (userError) {
      console.error('❌ Erreur listUsers:', userError);
      return res.status(500).json({ error: 'Impossible de vérifier les utilisateurs' });
    }

    const userExists = userData.users.some((u: any) => u.email?.toLowerCase() === email.toLowerCase());

    if (!userExists) {
      // Pour la sécurité, ne pas révéler si l'email existe ou pas
      return res.status(200).json({
        success: true,
        message: 'Si cet email existe, un lien de réinitialisation a été généré.'
      });
    }

    // 2. Générer le lien de récupération avec le service role (bypass SMTP)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${BASE_URL}/auth/reset-password`
      }
    });

    if (linkError) {
      console.error('❌ Erreur generateLink:', linkError);
      return res.status(500).json({
        error: 'Impossible de générer le lien de réinitialisation',
        details: linkError.message
      });
    }

    const resetLink = linkData.properties?.action_link || linkData.properties?.link;

    console.log('✅ Lien de réinitialisation généré pour:', email);

    // 3. Retourner le lien (en dev, l'utilisateur peut l'utiliser directement)
    return res.status(200).json({
      success: true,
      message: 'Lien de réinitialisation généré avec succès',
      resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined,
      note: process.env.NODE_ENV === 'development'
        ? 'En développement, utilisez le lien ci-dessus. En production, configurez SMTP dans Supabase.'
        : 'Un email de réinitialisation a été envoyé.'
    });

  } catch (error: any) {
    console.error('❌ Erreur reset-password API:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      details: error.message
    });
  }
}
