import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { 
    email, 
    userId, 
    lastStep, 
    partialData,
    utmSource,
    utmMedium,
    utmCampaign 
  } = req.body;

  if (!email || !lastStep) {
    return res.status(400).json({ message: 'email et lastStep requis' });
  }

  try {
    // Upsert: mettre à jour si existe, créer sinon
    const { data, error } = await supabaseAdmin
      .from('pro_signup_abandons')
      .upsert({
        email,
        user_id: userId || null,
        last_step: lastStep,
        step_reached_at: new Date().toISOString(),
        partial_data: partialData || {},
        utm_source: utmSource || null,
        utm_medium: utmMedium || null,
        utm_campaign: utmCampaign || null,
        completed: false,
      }, {
        onConflict: 'email',
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur track-signup-abandon:', error);
      return res.status(500).json({ message: 'Erreur base de données' });
    }

    return res.status(200).json({ 
      message: 'Abandon tracké',
      id: data.id 
    });

  } catch (error) {
    console.error('Erreur track-signup-abandon:', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
}
