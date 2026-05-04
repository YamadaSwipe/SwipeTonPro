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
    const { projectId, professionalIds, paymentOption } = req.body;

    if (!projectId || !professionalIds || !Array.isArray(professionalIds)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Notifier chaque professionnel intéressé
    for (const professionalId of professionalIds) {
      // Créer une notification pour le professionnel
      await supabase
        .from('notifications')
        .insert({
          user_id: professionalId,
          type: 'escrow_option_available',
          title: 'Option de paiement séquestré disponible',
          message: `Le client a activé l'option de paiement séquestré pour ce projet. Option: ${getPaymentOptionLabel(paymentOption)}`,
          data: {
            project_id: projectId,
            payment_option: paymentOption,
            created_at: new Date().toISOString()
          },
          read: false
        });

      // Envoyer un email (simulation - à implémenter avec un service email)
      console.log(`Notification escrow envoyée au professionnel ${professionalId} pour le projet ${projectId}`);
    }

    // Créer une notification pour le client
    const { data: project } = await supabase
      .from('projects')
      .select('client_id')
      .eq('id', projectId)
      .single();

    if (project?.client_id) {
      await supabase
        .from('notifications')
        .insert({
          user_id: project.client_id,
          type: 'escrow_notified',
          title: 'Professionnels notifiés',
          message: `Les professionnels intéressés ont été notifiés de votre option de paiement séquestré`,
          data: {
            project_id: projectId,
            payment_option: paymentOption,
            professionals_count: professionalIds.length,
            created_at: new Date().toISOString()
          },
          read: false
        });
    }

    res.status(200).json({ 
      success: true, 
      message: `Notifications envoyées à ${professionalIds.length} professionnels` 
    });

  } catch (error) {
    console.error('Error in notify-escrow-option:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

function getPaymentOptionLabel(option: string): string {
  switch (option) {
    case 'deposit_only':
      return 'Acompte uniquement';
    case 'full_amount':
      return 'Montant total des travaux';
    case 'milestones':
      return 'Versement par paliers';
    default:
      return 'Non spécifiée';
  }
}
