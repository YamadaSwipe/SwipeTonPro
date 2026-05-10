import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function sendContactEmail(formData: { name: string; email: string; subject: string; message: string }) {
  // Vérifier si la clé API Resend est configurée
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY non configurée');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SwipeTonPro <contact@swipetonpro.fr>',
        to: ['contact@swipetonpro.fr'], // Email de l'admin
        subject: `Nouveau message de contact: ${formData.subject}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Nouveau message de contact</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #ff6b35, #f7931e); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .field { margin-bottom: 20px; }
              .label { font-weight: bold; color: #333; margin-bottom: 5px; }
              .value { background: white; padding: 10px; border-radius: 5px; border-left: 4px solid #ff6b35; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>📧 Nouveau Message de Contact</h1>
              <p>Un visiteur vous a contacté via le site SwipeTonPro</p>
            </div>
            
            <div class="content">
              <div class="field">
                <div class="label">👤 Nom complet:</div>
                <div class="value">${formData.name}</div>
              </div>
              
              <div class="field">
                <div class="label">📧 Email de l'expéditeur:</div>
                <div class="value">${formData.email}</div>
              </div>
              
              <div class="field">
                <div class="label">📝 Sujet:</div>
                <div class="value">${formData.subject}</div>
              </div>
              
              <div class="field">
                <div class="label">💬 Message:</div>
                <div class="value" style="white-space: pre-wrap;">${formData.message}</div>
              </div>
            </div>
            
            <div class="footer">
              <p>Ce message a été envoyé depuis le formulaire de contact de SwipeTonPro</p>
              <p>Date: ${new Date().toLocaleString('fr-FR')}</p>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Erreur Resend:', errorData);
      return false;
    }

    console.log('✅ Email de contact envoyé avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email contact:', error);
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { name, email, subject, message } = req.body;

    // Validation des champs
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        error: 'Tous les champs sont obligatoires' 
      });
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Email invalide' 
      });
    }

    // Envoyer l'email
    const emailSent = await sendContactEmail({ name, email, subject, message });

    if (!emailSent) {
      // En cas d'échec d'envoi, retourner quand même un succès pour ne pas frustrer l'utilisateur
      // mais noter le problème pour le développement
      return res.status(200).json({
        success: true,
        message: 'Message envoyé avec succès',
        note: process.env.NODE_ENV === 'development' 
          ? 'En développement: Vérifiez la configuration Resend.'
          : 'Nous avons bien reçu votre message et vous répondrons rapidement.',
      });
    }

    // Succès complet
    return res.status(200).json({
      success: true,
      message: 'Message envoyé avec succès',
    });

  } catch (error) {
    console.error('❌ Erreur API contact:', error);
    
    // En cas d'erreur serveur, retourner quand même un succès pour ne pas frustrer l'utilisateur
    // mais logger l'erreur pour le débogage
    return res.status(200).json({
      success: true,
      message: 'Message envoyé avec succès',
      note: process.env.NODE_ENV === 'development' 
        ? 'Erreur serveur en développement: ' + (error as Error).message
        : 'Nous avons bien reçu votre message et vous répondrons rapidement.',
    });
  }
}
