import type { NextApiRequest, NextApiResponse } from 'next';
import { sendEmailServerSide } from '@/lib/email';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Fonction pour remplacer les variables dans le template
function replaceVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
  });
  return result;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userId, userType } = req.body;

  // Validation stricte des inputs
  if (
    !userId ||
    typeof userId !== 'string' ||
    !userId.match(/^[0-9a-f-]{36}$/i)
  ) {
    return res
      .status(400)
      .json({ message: 'userId invalide (format UUID requis)' });
  }

  if (!userType || !['pro', 'client'].includes(userType)) {
    return res
      .status(400)
      .json({ message: 'userType invalide (pro ou client requis)' });
  }

  try {
    // Récupérer le message de bienvenue personnalisé
    const { data: welcomeMessage } = await supabaseAdmin
      .from('welcome_messages')
      .select('subject, html_content')
      .eq('message_type', userType)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Récupérer les infos utilisateur
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email, phone')
      .eq('id', userId)
      .single();

    if (!profile) {
      return res.status(404).json({ message: 'Profil introuvable' });
    }

    // Extraire le prénom
    const firstName = profile.full_name?.split(' ')[0] || 'Utilisateur';
    const lastName = profile.full_name?.split(' ').slice(1).join(' ') || '';

    // Variables disponibles
    const variables: Record<string, string> = {
      firstName,
      lastName,
      email: profile.email,
      phone: profile.phone || '',
      dashboardUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://swipetonpro.fr'}/${userType === 'pro' ? 'professionnel/dashboard' : 'particulier/dashboard'}`,
      diagnosticUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://swipetonpro.fr'}/particulier/diagnostic`,
    };

    // Si données pro disponibles
    if (userType === 'pro') {
      const { data: pro } = await supabaseAdmin
        .from('professionals')
        .select('company_name, siret')
        .eq('user_id', userId)
        .single();

      if (pro) {
        variables.companyName = pro.company_name;
        variables.siret = pro.siret;
      }
    }

    let subject: string;
    let html: string;

    if (welcomeMessage) {
      // Utiliser le template personnalisé
      subject = replaceVariables(welcomeMessage.subject, variables);
      html = replaceVariables(welcomeMessage.html_content, variables);
    } else {
      // Fallback sur les templates par défaut
      if (userType === 'pro') {
        subject = '🎉 Bienvenue sur SwipeTonPro !';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #f97316;">Bienvenue ${firstName} !</h1>
            <p>Votre compte professionnel SwipeTonPro est maintenant actif.</p>
            <p><strong>Prochaines étapes :</strong></p>
            <ul>
              <li>Complétez votre profil</li>
              <li>Ajoutez vos réalisations au portfolio</li>
              <li>Configurez vos disponibilités</li>
            </ul>
            <p>À très bientôt,<br>L'équipe SwipeTonPro</p>
          </div>`;
      } else {
        subject = '🎉 Bienvenue chez SwipeTonPro !';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #f97316;">Bienvenue ${firstName} !</h1>
            <p>Nous sommes ravis de vous compter parmi nos membres.</p>
            <p><strong>Prêt à démarrer votre projet ?</strong></p>
            <ul>
              <li>Faites votre diagnostic personnalisé</li>
              <li>Recevez des devis gratuits</li>
              <li>Comparez les professionnels</li>
            </ul>
            <p>À très bientôt,<br>L'équipe SwipeTonPro</p>
          </div>`;
      }
    }

    // Envoyer l'email
    await sendEmailServerSide({
      to: profile.email,
      subject,
      html,
      fromType: 'noreply',
    });

    return res.status(200).json({
      message: 'Email de bienvenue envoyé',
      recipient: profile.email,
    });
  } catch (error) {
    console.error('Erreur send-welcome-email:', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
}
