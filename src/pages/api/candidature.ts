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
      await supabaseAdmin.from('notifications').insert({
        user_id: projectData.client_id,
        type: 'new_interest',
        title: 'Un professionnel est intéressé par votre projet',
        message:
          'Un professionnel a manifeste son interet pour votre projet et souhaite vous contacter.',
        data: { project_id: project_id, professional_id: professional_id },
        project_id,
        created_at: new Date().toISOString(),
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in candidature API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
