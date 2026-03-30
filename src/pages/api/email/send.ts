import { NextApiRequest, NextApiResponse } from 'next';
import { emailService, EmailData } from '@/services/emailService';

// Configuration pour différents providers d'email
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'development'; // 'sendgrid', 'ses', 'brevo', 'development'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const emailData: EmailData = req.body;

    // Validation des données requises
    if (!emailData.to || !emailData.subject || !emailData.html) {
      return res.status(400).json({ 
        error: 'Données manquantes: to, subject et html sont requis' 
      });
    }

    let result;

    if (EMAIL_PROVIDER === 'development') {
      // En développement, logger l'email et simuler l'envoi
      console.log('📧 Email (développement):', {
        to: emailData.to,
        subject: emailData.subject,
        preview: emailData.html.substring(0, 200) + '...',
        timestamp: new Date().toISOString()
      });

      // Sauvegarder l'email dans un fichier local pour inspection
      const fs = require('fs');
      const path = require('path');
      
      const emailLog = {
        timestamp: new Date().toISOString(),
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        from: emailData.from,
        replyTo: emailData.replyTo
      };

      const logsDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir);
      }

      const logFile = path.join(logsDir, `emails-${new Date().toISOString().split('T')[0]}.json`);
      fs.appendFileSync(logFile, JSON.stringify(emailLog) + '\n');

      result = { success: true };
    } else if (EMAIL_PROVIDER === 'sendgrid') {
      // Intégration SendGrid
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

      const msg = {
        to: emailData.to,
        from: emailData.from || process.env.SENDGRID_FROM_EMAIL!,
        subject: emailData.subject,
        html: emailData.html,
        replyTo: emailData.replyTo,
      };

      await sgMail.send(msg);
      result = { success: true };

    } else if (EMAIL_PROVIDER === 'ses') {
      // Intégration AWS SES
      const AWS = require('aws-sdk');
      const ses = new AWS.SES({ region: process.env.AWS_REGION });

      const params = {
        Destination: { ToAddresses: Array.isArray(emailData.to) ? emailData.to : [emailData.to] },
        Message: {
          Body: { Html: { Charset: 'UTF-8', Data: emailData.html } },
          Subject: { Charset: 'UTF-8', Data: emailData.subject }
        },
        Source: emailData.from || process.env.SES_FROM_EMAIL!,
        ReplyToAddresses: emailData.replyTo ? [emailData.replyTo] : []
      };

      await ses.sendEmail(params).promise();
      result = { success: true };

    } else if (EMAIL_PROVIDER === 'brevo') {
      // Intégration Brevo (Sendinblue)
      const SibApiV3Sdk = require('sib-api-v3-sdk');
      
      const defaultClient = SibApiV3Sdk.ApiClient.instance;
      const apiKey = defaultClient.authentications['api-key'];
      apiKey.apiKey = process.env.BREVO_API_KEY!;

      const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
      
      const sendSmtpEmail = {
        to: Array.isArray(emailData.to) 
          ? emailData.to.map(email => ({ email })) 
          : [{ email: emailData.to }],
        subject: emailData.subject,
        htmlContent: emailData.html,
        sender: { 
          email: emailData.from || process.env.BREVO_FROM_EMAIL!,
          name: 'SwipeTonPro'
        },
        replyTo: emailData.replyTo ? { email: emailData.replyTo } : undefined
      };

      await apiInstance.sendTransacEmail(sendSmtpEmail);
      result = { success: true };

    } else {
      result = await emailService.sendEmail(emailData);
    }

    if (result.success) {
      res.status(200).json({ 
        success: true, 
        message: 'Email envoyé avec succès',
        provider: EMAIL_PROVIDER
      });
    } else {
      res.status(500).json({ 
        error: result.error || 'Erreur lors de l\'envoi de l\'email' 
      });
    }

  } catch (error) {
    console.error('Erreur API email:', error);
    
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erreur serveur' 
    });
  }
}
