import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { interest_id, action } = req.body;

  if (!interest_id || !action) {
    return res.status(400).json({ error: 'Missing interest_id or action' });
  }

  if (action !== 'accepted' && action !== 'rejected') {
    return res.status(400).json({ error: 'Invalid action. Must be accepted or rejected' });
  }

  try {
    // Verify user authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get interest data to retrieve professional_id and project_id
    const { data: interestData, error: interestError } = await supabaseAdmin
      .from('project_interests')
      .select('professional_id, project_id, project:projects(client_id)')
      .eq('id', interest_id)
      .single();

    if (interestError || !interestData) {
      console.error('Error fetching interest:', interestError);
      return res.status(404).json({ error: 'Interest not found' });
    }

    // Seul le client propriétaire du projet peut accepter/refuser
    if ((interestData as any).project?.client_id !== user.id) {
      return res.status(403).json({ error: 'Forbidden: not project owner' });
    }

    const updatePayload: Record<string, any> = {};
    if (action === 'accepted') {
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + 24);

      updatePayload.status = 'payment_pending';
      updatePayload.client_interested = true;
      updatePayload.payment_deadline = deadline.toISOString();
    } else {
      updatePayload.status = 'rejected';
      updatePayload.client_interested = false;
    }

    // Update the status in project_interests
    const { error: updateError } = await supabaseAdmin
      .from('project_interests')
      .update(updatePayload)
      .eq('id', interest_id);

    if (updateError) {
      console.error('Error updating status:', updateError);
      return res.status(500).json({ error: 'Failed to update status' });
    }

    // Get professional's user_id
    const { data: professionalData, error: professionalError } = await supabaseAdmin
      .from('professionals')
      .select('user_id')
      .eq('id', interestData.professional_id)
      .single();

    if (professionalError || !professionalData?.user_id) {
      console.error('Error fetching professional:', professionalError);
      return res.status(404).json({ error: 'Professional not found' });
    }

    // Créer/assurer la conversation anonyme lors de l'acceptation
    if (action === 'accepted') {
      await supabaseAdmin.from('conversations').insert(
        {
          project_id: interestData.project_id,
          professional_id: interestData.professional_id,
          client_id: user.id,
          status: 'anonymous',
          phase: 'anonymous',
        },
        { onConflict: 'project_id,professional_id', ignoreDuplicates: true }
      );
    }

    // Insert notification for the professional
    const notificationData = {
      user_id: professionalData.user_id,
      type: action === 'accepted' ? 'application_accepted' : 'application_rejected',
      title: action === 'accepted' ? 'Votre candidature a été acceptée' : 'Votre candidature n\'a pas été retenue',
      message: action === 'accepted' 
        ? 'Le particulier a accepté votre candidature. Finalisez le paiement de mise en relation pour débloquer les coordonnées.'
        : 'Le particulier n\'a pas retenu votre candidature pour ce projet',
      data: { project_id: interestData.project_id, professional_id: interestData.professional_id },
      project_id: interestData.project_id,
      created_at: new Date().toISOString(),
    };

    const { error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert(notificationData);

    if (notificationError) {
      console.error('Error inserting notification:', notificationError);
      // Don't fail the request if notification fails, but log it
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in update-interest API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
