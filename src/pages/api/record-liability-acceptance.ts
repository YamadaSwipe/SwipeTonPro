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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { projectId, professionalId, paymentIntentId, acceptedAt, clause } = req.body;

    if (!projectId || !professionalId || !acceptedAt || !clause) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Enregistrer l'acceptation dans la table liability_acceptances
    const { data, error } = await supabase
      .from('liability_acceptances')
      .insert({
        project_id: projectId,
        professional_id: professionalId,
        payment_intent_id: paymentIntentId,
        clause_text: clause,
        accepted_at: acceptedAt,
        ip_address: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown',
        user_agent: req.headers['user-agent'] || 'unknown'
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording liability acceptance:', error);
      return res.status(500).json({ error: 'Failed to record acceptance' });
    }

    // Mettre à jour le payment_intent_id si disponible
    if (paymentIntentId && paymentIntentId !== 'pending') {
      await supabase
        .from('matches')
        .update({ payment_intent_id: paymentIntentId })
        .eq('project_id', projectId)
        .eq('professional_id', professionalId);
    }

    res.status(200).json({ 
      success: true, 
      data,
      message: 'Liability acceptance recorded successfully' 
    });

  } catch (error) {
    console.error('Error in record-liability-acceptance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
