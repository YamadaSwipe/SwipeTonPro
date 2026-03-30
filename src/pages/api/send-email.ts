import type { NextApiRequest, NextApiResponse } from 'next';
import { sendEmailServerSide } from '@/lib/email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { to, subject, html, type, replyTo } = req.body;

  console.log("📧 API send-email appelée avec:", {
    to,
    subject,
    type,
    hasHtml: !!html,
    hasReplyTo: !!replyTo
  });

  if (!to || !subject || !html) {
    console.error("❌ Champs manquants:", { to: !!to, subject: !!subject, html: !!html });
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    console.log("🚀 Envoi email en cours...");
    const result = await sendEmailServerSide({
      to,
      subject,
      html,
      fromType: type || 'noreply',
      replyTo,
    });

    console.log("📊 Résultat envoi email:", result);

    if (result.success) {
      console.log("✅ Email envoyé avec succès via API");
      res.status(200).json({ 
        message: 'Email sent successfully',
        messageId: result.messageId 
      });
    } else {
      console.error("❌ Échec envoi email:", result.error);
      res.status(500).json({ 
        message: 'Failed to send email', 
        error: result.error 
      });
    }
  } catch (error) {
    console.error("❌ Erreur API send-email:", error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}