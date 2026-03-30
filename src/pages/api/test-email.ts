import type { NextApiRequest, NextApiResponse } from 'next';
import { sendEmailServerSide } from '@/lib/email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('🔧 Test email configuration');
    console.log('SMTP_HOST:', process.env.SMTP_HOST);
    console.log('SMTP_PORT:', process.env.SMTP_PORT);
    console.log('SMTP_USER_SUPPORT:', process.env.SMTP_USER_SUPPORT);
    console.log('SMTP_PASSWORD exists:', !!process.env.SMTP_PASSWORD);

    const result = await sendEmailServerSide({
      to: "support@swipetonpro.fr",
      subject: "🧪 Test Email Configuration",
      html: `
        <h2>Test de configuration SMTP</h2>
        <p>Email de test envoyé depuis SwipeTonPro</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
        <p>Si vous recevez cet email, la configuration est correcte.</p>
      `,
      fromType: 'support'
    });

    if (result.success) {
      console.log('✅ Test email sent successfully:', result.messageId);
      res.status(200).json({ 
        message: 'Test email sent successfully', 
        messageId: result.messageId 
      });
    } else {
      console.error('❌ Test email failed:', result.error);
      res.status(500).json({ 
        message: 'Test email failed', 
        error: result.error 
      });
    }
  } catch (error) {
    console.error('❌ Test email error:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: error 
    });
  }
}
