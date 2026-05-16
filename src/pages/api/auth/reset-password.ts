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

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email requis' });
  }

  try {
    console.log('🔄 Demande reset password pour:', email);

    // Utiliser la méthode native Supabase resetPasswordForEmail
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
    });

    if (error) {
      console.error('❌ Erreur resetPasswordForEmail:', error);
      // Pas d'erreur en réponse (raison de sécurité)
      return res.status(200).json({
        success: true,
        message:
          'Si cet email existe, un lien de réinitialisation a été envoyé.',
      });
    }

    console.log('✅ Email de réinitialisation envoyé par Supabase à:', email);

    return res.status(200).json({
      success: true,
      message: 'Un lien de réinitialisation a été envoyé à votre email.',
    });
  } catch (error: any) {
    console.error('❌ Erreur reset-password:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
    });
  }
}
