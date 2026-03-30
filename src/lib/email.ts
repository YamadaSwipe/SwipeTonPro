import nodemailer from 'nodemailer';

type EmailType = 'admin' | 'contact' | 'team' | 'support' | 'noreply';

const emailConfig = {
  admin: process.env.SMTP_USER_ADMIN || 'admin@swipetonpro.fr',
  contact: process.env.SMTP_USER_CONTACT || 'contact@swipetonpro.fr',
  team: process.env.SMTP_USER_TEAM ||  'team@swipetonpro.fr',
  support: process.env.SMTP_USER_SUPPORT || 'support@swipetonpro.fr',
  noreply: process.env.SMTP_USER_NOREPLY || 'noreply@swipetonpro.fr',
};

// Créer le transporter de manière paresseuse
let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'ssl0.ovh.net',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true,
      auth: {
        user: emailConfig.noreply,
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
  fromType?: string;
  replyTo?: string;
}

export async function sendEmailServerSide({ to, subject, html, fromType = 'noreply', replyTo }: SendEmailOptions) {
  const fromAddress = emailConfig[fromType];

  if (!fromAddress) {
    throw new Error(`Invalid email type: ${fromType}`);
  }

  // Vérifier les variables d'environnement SMTP
  console.log("🔧 Configuration SMTP:", {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: fromAddress,
    hasPassword: !!process.env.SMTP_PASSWORD
  });

  if (!process.env.SMTP_PASSWORD) {
    console.error("❌ SMTP_PASSWORD non défini dans les variables d'environnement");
    return { success: false, error: "SMTP configuration manquante" };
  }

  // Pour OVH, il est préférable de réinitialiser l'auth pour correspondre à l'adresse 'from'
  // si le serveur exige que l'utilisateur authentifié corresponde à l'expéditeur.
  const specificTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'ssl0.ovh.net',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true,
    auth: {
      user: fromAddress,
      pass: process.env.SMTP_PASSWORD || '',
    },
  });

  try {
    const mailOptions = {
      from: `"SwipeTonPro" <${fromAddress}>`,
      to,
      replyTo: replyTo || fromAddress,
      subject,
      html,
    };

    console.log("📧 Envoi email avec options:", {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    const info = await specificTransporter.sendMail(mailOptions);
    console.log(`✅ Email envoyé avec succès de ${fromAddress}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Erreur envoi email depuis ${fromAddress}:`, error);
    console.error("Détails de l'erreur:", {
      message: error.message,
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
      response: error.response
    });
    return { success: false, error };
  }
}

// Alias pour compatibilité
export const sendEmail = sendEmailServerSide;