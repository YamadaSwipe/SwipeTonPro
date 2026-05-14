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
    console.log('🔄 Début processus de réinitialisation pour:', email);

    // Utiliser directement resetPasswordForEmail de Supabase
    // C'est la méthode officielle recommandée par Supabase
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
    });

    if (error) {
      console.error('❌ Erreur resetPasswordForEmail:', error);
      // Supabase ne retourne une erreur que si l'email n'existe pas (le bon comportement)
      // Mais on veut un message générique pour des raisons de sécurité
    }

    console.log('✅ Email de réinitialisation envoyé via Supabase');

    return res.status(200).json({
      success: true,
      message:
        'Si cet email existe dans notre système, un lien de réinitialisation a été envoyé.',
    });
  } catch (error: any) {
    console.error('❌ Erreur reset-password API:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      details: error.message,
    });
  }
}
