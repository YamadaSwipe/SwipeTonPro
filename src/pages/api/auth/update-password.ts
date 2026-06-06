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

  const { password } = req.body;
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    console.log('🔄 Admin password update request');

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error('❌ Invalid token:', authError);
      return res.status(401).json({ error: 'Invalid token' });
    }

    console.log('✅ User verified:', user.email);

    // Update password using admin client
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password }
    );

    if (updateError) {
      console.error('❌ Password update error:', updateError);
      return res.status(400).json({ error: updateError.message });
    }

    console.log('✅ Password updated successfully for:', user.email);

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('❌ Password update exception:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
