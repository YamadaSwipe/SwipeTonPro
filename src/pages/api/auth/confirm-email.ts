import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Use service role key to bypass email confirmation
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Update the user to confirm their email
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });

    if (error) {
      console.error('Error confirming email:', error);
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error in confirm-email API:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
