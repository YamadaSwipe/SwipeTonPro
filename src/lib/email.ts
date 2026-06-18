import nodemailer from 'nodemailer';

type EmailType = 'admin' | 'contact' | 'team' | 'support' | 'noreply';

const emailConfig = {
  admin: process.env.SMTP_USER_ADMIN || 'admin@swipetonpro.fr',
  contact: process.env.SMTP_USER_CONTACT || 'contact@swipetonpro.fr',
  team: process.env.SMTP_USER_TEAM || 'team@swipetonpro.fr',
  support: process.env.SMTP_USER_SUPPORT || 'support@swipetonpro.fr',
  noreply: process.env.SMTP_USER_NOREPLY || 'noreply@swipetonpro.fr',
};

// Créer le transporter de manière paresseuse
let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.resend.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true,
      auth: {
        user: process.env.SMTP_USER || 'resend',
        pass: process.env.SMTP_PASSWORD || '',
      },
    });
  }
  return transporter;
}

// Définition du type SendEmailOptions
interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  fromType?: string;
  replyTo?: string;
}

export async function sendEmailServerSide({
  to,
  subject,
  html,
  fromType = 'noreply',
  replyTo,
}: SendEmailOptions) {
  try {
    const fromAddress = emailConfig[fromType as EmailType];

    if (!fromAddress) {
      throw new Error(`Invalid email type: ${fromType}`);
    }

    // Vérifier les variables d'environnement SMTP
    console.log('🔧 Configuration SMTP:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: fromAddress,
      hasPassword: !!process.env.SMTP_PASSWORD,
    });

    if (!process.env.SMTP_PASSWORD) {
      console.error(
        "❌ SMTP_PASSWORD non défini dans les variables d'environnement"
      );
      return { success: false, error: 'SMTP configuration manquante' };
    }

    if (!process.env.SMTP_HOST) {
      console.error(
        "❌ SMTP_HOST non défini dans les variables d'environnement"
      );
      return { success: false, error: 'SMTP configuration manquante' };
    }

    // Pour OVH, utiliser l'adresse email complète comme username
    const specificTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true,
      auth: {
        user: fromAddress, // Utiliser l'adresse email complète pour OVH
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: true,
      },
    });

    const mailOptions = {
      from: `"SwipeTonPro" <${fromAddress}>`,
      to,
      replyTo: replyTo || fromAddress,
      subject,
      html,
    };

    console.log('📧 Envoi email avec options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
    });

    const info = await specificTransporter.sendMail(mailOptions);
    console.log(
      `✅ Email envoyé avec succès de ${fromAddress}: ${info.messageId}`
    );
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`❌ Erreur envoi email:`, error);
    console.error("Détails de l'erreur:", {
      message: error?.message,
      code: error?.code,
      command: error?.command,
      responseCode: error?.responseCode,
      response: error?.response,
    });
    return { success: false, error: error?.message || 'Erreur inconnue' };
  }
}

// Alias pour compatibilité
export const sendEmail = sendEmailServerSide;
