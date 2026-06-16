import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { contactRateLimit } from '@/middleware/rateLimit';
import { sendEmail } from '@/lib/email';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function sendContactEmailToAdmins(formData: {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  requestType: string;
}) {
  try {
    // Récupérer tous les emails des administrateurs
    const { data: admins, error: adminError } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .in('role', ['admin', 'moderator'])
      .not('email', 'is', null);

    if (adminError) {
      console.error('❌ Erreur récupération admins:', adminError);
      return false;
    }

    if (!admins || admins.length === 0) {
      console.warn('⚠️ Aucun administrateur trouvé pour notification');
      return false;
    }

    // Préparer le HTML de l'email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Nouveau ticket de support</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; }
          .header { background: linear-gradient(135deg, #ff6b35, #f7931e); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .field { margin-bottom: 20px; }
          .label { font-weight: bold; color: #333; margin-bottom: 5px; display: block; }
          .value { background: #f9f9f9; padding: 12px; border-radius: 5px; border-left: 4px solid #ff6b35; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; background: #ff6b35; color: white; font-size: 12px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎫 Nouveau Ticket de Support</h1>
          <p>Un utilisateur a soumis une demande via le formulaire de contact</p>
        </div>
        
        <div class="content">
          <div class="field">
            <span class="label">Type de demande:</span>
            <div class="value"><span class="badge">${formData.requestType}</span></div>
          </div>
          
          <div class="field">
            <span class="label">👤 Nom complet:</span>
            <div class="value">${formData.name}</div>
          </div>
          
          <div class="field">
            <span class="label">📧 Email:</span>
            <div class="value"><a href="mailto:${formData.email}">${formData.email}</a></div>
          </div>
          
          <div class="field">
            <span class="label">📱 Téléphone:</span>
            <div class="value"><a href="tel:${formData.phone}">${formData.phone}</a></div>
          </div>
          
          <div class="field">
            <span class="label">📝 Sujet:</span>
            <div class="value">${formData.subject}</div>
          </div>
          
          <div class="field">
            <span class="label">💬 Message:</span>
            <div class="value" style="white-space: pre-wrap;">${formData.message}</div>
          </div>
        </div>
        
        <div class="footer">
          <p>Ce ticket a été créé automatiquement depuis le formulaire de contact de SwipeTonPro</p>
          <p>Date: ${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}</p>
          <p style="margin-top: 20px;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://swipetonpro.fr'}/admin/support-tickets" 
               style="color: #ff6b35; text-decoration: none; font-weight: bold;">
              → Voir tous les tickets de support
            </a>
          </p>
        </div>
      </body>
      </html>
    `;

    // Envoyer l'email à chaque administrateur
    let emailsSent = 0;
    for (const admin of admins) {
      try {
        const result = await sendEmail({
          to: admin.email,
          subject: `🎫 Nouveau ticket de support: ${formData.subject}`,
          html: emailHtml,
          fromType: 'support',
          replyTo: formData.email,
        });

        if (result.success) {
          emailsSent++;
          console.log(`✅ Email envoyé à ${admin.email}`);
        } else {
          console.error(`❌ Échec envoi email à ${admin.email}:`, result.error);
        }
      } catch (error) {
        console.error(`❌ Erreur envoi email à ${admin.email}:`, error);
      }
    }

    console.log(`📧 ${emailsSent}/${admins.length} emails envoyés aux administrateurs`);
    return emailsSent > 0;
  } catch (error) {
    console.error('❌ Erreur envoi emails aux admins:', error);
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Appliquer le rate limiting
  await new Promise<void>((resolve, reject) => {
    contactRateLimit(req, res, () => resolve());
  });

  if (res.headersSent) {
    return; // Le rate limiting a déjà répondu
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { name, email, phone, address, requestType, subject, message } = req.body;

    // Validation des champs obligatoires
    if (!name || !email || !phone || !subject || !message) {
      return res.status(400).json({
        error: 'Les champs nom, email, téléphone, sujet et message sont obligatoires',
      });
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Email invalide',
      });
    }

    // Récupérer l'utilisateur connecté (si applicable)
    const authHeader = req.headers.authorization;
    let userId = null;
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (!authError && user) {
          userId = user.id;
        }
      } catch (authError) {
        console.log('Utilisateur non authentifié, création de ticket anonyme');
      }
    }

    // Récupérer l'IP et le User-Agent
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
                      (req.headers['x-real-ip'] as string) || 
                      req.socket.remoteAddress || 
                      null;
    const userAgent = req.headers['user-agent'] || null;

    // Créer le ticket dans la base de données
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('support_tickets')
      .insert({
        user_id: userId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        address: address?.trim() || null,
        request_type: requestType || 'Demande générale',
        subject: subject.trim(),
        message: message.trim(),
        status: 'pending',
        priority: 'normal',
        ip_address: ipAddress,
        user_agent: userAgent,
        source: 'contact_form',
      })
      .select()
      .single();

    if (ticketError) {
      console.error('❌ Erreur création ticket:', ticketError);
      return res.status(500).json({
        error: 'Erreur lors de la création du ticket de support',
        details: process.env.NODE_ENV === 'development' ? ticketError.message : undefined,
      });
    }

    console.log('✅ Ticket de support créé:', ticket.id);

    // Envoyer les emails de notification aux administrateurs
    const emailsSent = await sendContactEmailToAdmins({
      name,
      email,
      phone,
      subject,
      message,
      requestType: requestType || 'Demande générale',
    });

    if (!emailsSent) {
      console.warn('⚠️ Aucun email envoyé aux administrateurs, mais ticket créé');
    }

    // Succès - Le trigger de la base de données créera automatiquement les notifications
    return res.status(200).json({
      success: true,
      message: 'Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.',
      ticketId: ticket.id,
    });
  } catch (error) {
    console.error('❌ Erreur API contact:', error);

    return res.status(500).json({
      error: 'Une erreur est survenue lors de l\'envoi de votre message',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
    });
  }
}
