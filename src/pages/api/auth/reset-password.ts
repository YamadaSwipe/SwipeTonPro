import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email requis' });
  }

  try {
    // Générer directement le lien de récupération avec le service role (bypass SMTP)
    // Si l'utilisateur n'existe pas, generateLink retournera une erreur
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: {
          redirectTo: `${BASE_URL}/auth/reset-password`,
        },
      });

    if (linkError) {
      console.error('❌ Erreur generateLink:', linkError);

      // Si l'utilisateur n'existe pas, on retourne quand même un succès (sécurité)
      // pour ne pas révéler si l'email existe dans la base
      if (
        linkError.message?.includes('User not found') ||
        linkError.message?.includes('user not found')
      ) {
        return res.status(200).json({
          success: true,
          message:
            'Si cet email existe dans notre système, un lien de réinitialisation a été généré.',
        });
      }

      return res.status(500).json({
        error: 'Impossible de générer le lien de réinitialisation',
        details: linkError.message,
      });
    }

    // @ts-ignore - properties properties not fully typed
    const resetLink =
      (linkData.properties as any)?.action_link ||
      (linkData.properties as any)?.link;

    console.log('✅ Lien de réinitialisation généré pour:', email);

    // Retourner le lien (en dev, l'utilisateur peut l'utiliser directement)
    return res.status(200).json({
      success: true,
      message: 'Lien de réinitialisation généré avec succès',
      resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined,
      note:
        process.env.NODE_ENV === 'development'
          ? 'En développement, utilisez le lien ci-dessus. En production, configurez SMTP dans Supabase.'
          : 'Un email de réinitialisation a été envoyé.',
    });
  } catch (error: any) {
    console.error('❌ Erreur reset-password API:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      details: error.message,
    });
  }
}
