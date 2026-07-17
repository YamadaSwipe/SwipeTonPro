import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

// Create Supabase admin client with service role key to bypass RLS
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

  try {
    const { project_id, professional_id } = req.body;

    if (!project_id || !professional_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(project_id) || !uuidRegex.test(professional_id)) {
      return res.status(400).json({ error: 'Invalid IDs format' });
    }

    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify session using the token
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Vérifier que le professional_id appartient bien à l'utilisateur connecté
    const { data: ownerProfessional, error: ownerError } = await supabaseAdmin
      .from('professionals')
      .select('id, user_id, status')
      .eq('id', professional_id)
      .single();

    if (ownerError || !ownerProfessional) {
      return res.status(404).json({ error: 'Professional not found' });
    }

    if (ownerProfessional.user_id !== user.id) {
      return res.status(403).json({
        error: 'Unauthorized: cannot apply for another professional account',
      });
    }

    // Check if active candidature already exists (status != rejected)
    const { data: existingInterest } = await supabaseAdmin
      .from('project_interests')
      .select('id')
      .eq('project_id', project_id)
      .eq('professional_id', professional_id)
      .neq('status', 'rejected')
      .single();

    if (existingInterest) {
      return res.status(409).json({
        error: 'Vous avez deja une candidature active pour ce projet',
      });
    }

    // Vérifier que le projet est actif
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('id, status')
      .eq('id', project_id)
      .single();

    if (!project || !['published', 'pending', 'in_progress'].includes(project.status)) {
      return res
        .status(400)
        .json({ error: "Ce projet n'accepte plus de candidatures" });
    }

    // Vérifier que le professionnel est validé
    const { data: professional } = await supabaseAdmin
      .from('professionals')
      .select('id, status')
      .eq('id', professional_id)
      .single();

    if (professional?.status !== 'verified') {
      return res.status(403).json({
        error: 'Votre compte professionnel doit être vérifié pour candidater',
      });
    }

    // Insert into project_interests
    const { error: insertError } = await supabaseAdmin
      .from('project_interests')
      .insert({
        project_id,
        professional_id,
        status: 'pre_matched',
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error inserting into project_interests:', insertError);
      return res.status(500).json({ error: 'Failed to create interest' });
    }

    // Get project client_id for notification
    const { data: projectData } = await supabaseAdmin
      .from('projects')
      .select('client_id')
      .eq('id', project_id)
      .single();

    if (projectData?.client_id) {
      // Insert notification for the client
      const { error: notifError } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: projectData.client_id,
          type: 'new_interest',
          title: 'Un professionnel est intéressé par votre projet',
          message:
            'Un professionnel a manifeste son interet pour votre projet et souhaite vous contacter.',
          data: { project_id: project_id, professional_id: professional_id },
          project_id,
          created_at: new Date().toISOString(),
        });

      if (notifError) {
        console.error(
          'Erreur insert notification:',
          JSON.stringify(notifError)
        );
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in candidature API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
