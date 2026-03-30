/**
 * @fileoverview Service Email avec SMTP OVH
 * @author Senior Architect
 * @version 1.0.0
 * 
 * Service d'envoi d'emails via SMTP OVH pour la production
 */

import nodemailer from 'nodemailer';

/**
 * Configuration du transporteur SMTP OVH
 */
const createTransporter = () => {
  console.log('🔧 SMTP CONFIG:', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    user: process.env.SMTP_USER ? '***' : 'MISSING',
    pass: process.env.SMTP_PASS ? '***' : 'MISSING'
  });

  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // TLS pour port 587
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!
    },
    tls: {
      rejectUnauthorized: false // Accepter les certificats auto-signés si nécessaire
    }
  });

  return transporter;
};

/**
 * Interface pour les données d'email
 */
interface EmailData {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

/**
 * Envoyer un email via SMTP OVH
 * @param emailData Données de l'email
 * @returns Promise<boolean> Succès/Échec
 */
export const sendEmail = async (emailData: EmailData): Promise<boolean> => {
  try {
    console.log('📧 Email Service: Sending email to:', emailData.to);
    console.log('📧 Email Service: Subject:', emailData.subject);

    const transporter = createTransporter();

    // Vérifier la connexion SMTP
    await transporter.verify();
    console.log('✅ SMTP Server connection verified');

    const mailOptions = {
      from: emailData.from || `${process.env.EMAIL_FROM_NAME || 'SwipeTonPro'} <${process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text || emailData.html.replace(/<[^>]*>/g, '') // Texte brut généré automatiquement
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);
    console.log('📧 Email Service: Response:', result.response);

    return true;
  } catch (error) {
    console.error('❌ EMAIL ERROR:', error);
    console.error('❌ Email Service Details:', {
      to: emailData.to,
      subject: emailData.subject,
      error: error.message,
      stack: error.stack
    });
    return false;
  }
};

/**
 * Envoyer un email avec retry automatique
 * @param emailData Données de l'email
 * @param maxRetries Nombre maximum de tentatives
 * @returns Promise<boolean> Succès/Échec
 */
export const sendEmailWithRetry = async (emailData: EmailData, maxRetries: number = 3): Promise<boolean> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`📧 Email Service: Attempt ${attempt}/${maxRetries}`);
    
    const success = await sendEmail(emailData);
    
    if (success) {
      console.log(`✅ Email sent successfully on attempt ${attempt}`);
      return true;
    }
    
    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
      console.log(`⏳ Email Service: Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  console.error(`❌ Email Service: Failed after ${maxRetries} attempts`);
  return false;
};

/**
 * Template pour email d'intérêt de professionnel
 */
export const generateProfessionalInterestEmail = (data: {
  projectName: string;
  professionalName: string;
  professionalCompany: string;
  clientName: string;
  projectId: string;
}) => ({
  subject: `Un professionnel est intéressé par votre projet : ${data.projectName}`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Intérêt professionnel - SwipeTonPro</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Bonne nouvelle !</h1>
        </div>
        <div class="content">
          <h2>Un professionnel est intéressé par votre projet</h2>
          <p>Bonjour ${data.clientName},</p>
          <p>Nous avons le plaisir de vous informer que <strong>${data.professionalName}</strong> de <strong>${data.professionalCompany}</strong> a manifesté son intérêt pour votre projet <strong>"${data.projectName}"</strong>.</p>
          <p>Le professionnel pourra maintenant consulter les détails de votre projet et vous contacter directement pour discuter de votre besoin.</p>
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/projets/${data.projectId}" class="button">
            Voir mon projet
          </a>
          <p>N'hésitez pas à consulter votre tableau de bord pour suivre l'évolution de votre projet.</p>
          <p>Cordialement,<br>L'équipe SwipeTonPro</p>
        </div>
        <div class="footer">
          <p>Cet email a été envoyé automatiquement. Si vous n'êtes pas à l'origine de cette action, veuillez nous contacter.</p>
        </div>
      </div>
    </body>
    </html>
  `
});

/**
 * Template pour email admin notification
 */
export const generateAdminNotificationEmail = (data: {
  projectName: string;
  professionalName: string;
  professionalCompany: string;
  clientName: string;
  projectId: string;
  professionalId: string;
}) => ({
  subject: `[ADMIN] Nouvel intérêt professionnel - ${data.projectName}`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Notification Admin - SwipeTonPro</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .info { background: #e5e7eb; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .button { background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Notification Admin</h1>
        </div>
        <div class="content">
          <h2>Nouvel intérêt professionnel enregistré</h2>
          <p>Un professionnel a manifesté son intérêt pour un projet client.</p>
          
          <div class="info">
            <h3>📋 Détails du projet</h3>
            <p><strong>Nom du projet:</strong> ${data.projectName}</p>
            <p><strong>ID du projet:</strong> ${data.projectId}</p>
            <p><strong>Client:</strong> ${data.clientName}</p>
          </div>
          
          <div class="info">
            <h3>👨‍💼 Détails du professionnel</h3>
            <p><strong>Nom:</strong> ${data.professionalName}</p>
            <p><strong>Entreprise:</strong> ${data.professionalCompany}</p>
            <p><strong>ID:</strong> ${data.professionalId}</p>
          </div>
          
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin/projects/${data.projectId}" class="button">
            Voir dans l'admin
          </a>
          
          <p>Cette notification est générée automatiquement par le système SwipeTonPro.</p>
        </div>
        <div class="footer">
          <p>Email système - SwipeTonPro Admin</p>
        </div>
      </div>
    </body>
    </html>
  `
});

export default {
  sendEmail,
  sendEmailWithRetry,
  generateProfessionalInterestEmail,
  generateAdminNotificationEmail
};
