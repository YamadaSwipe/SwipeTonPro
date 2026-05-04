/**
 * @fileoverview API Route pour envoyer les notifications d'intérêt
 * @author Senior Architect
 * @version 1.0.0
 *
 * Envoie automatiquement les emails au client et à l'admin
 * lorsqu'un professionnel manifeste son intérêt pour un projet
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';

// Initialisation Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Emails des administrateurs
const ADMIN_EMAILS = [
  'admin@swipetonpro.com',
  'support@swipetonpro.com',
  'teamswipeTP@swipetonpro.com',
  'contact@swipetonpro.com',
];

/**
 * Interface pour les données de notification
 */
interface InterestNotificationData {
  projectId: string;
  professionalId: string;
}

/**
 * Interface pour les données complètes du projet
 */
interface ProjectData {
  id: string;
  title: string;
  description: string;
  category: string;
  city: string;
  postal_code: string;
  estimated_budget_min?: number;
  estimated_budget_max?: number;
  client_id: string;
  created_at: string;
}

/**
 * Interface pour les données du professionnel
 */
interface ProfessionalData {
  id: string;
  user_id: string;
  company_name: string;
  specialties: string[];
  experience_years?: number;
  rating_average?: number;
  siret: string;
  status: string;
  contact_email?: string;
}

/**
 * Interface pour les données du client
 */
interface ClientData {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
}

/**
 * Fonction principale de l'API
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Vérifier la méthode HTTP
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Méthode non autorisée',
      message: 'Seule la méthode POST est autorisée',
    });
  }

  try {
    console.log('🚀 Début traitement notification intérêt');

    // Récupérer et valider les données
    const { projectId, professionalId }: InterestNotificationData = req.body;

    if (!projectId || !professionalId) {
      console.error('❌ Données manquantes:', { projectId, professionalId });
      return res.status(400).json({
        error: 'Données manquantes',
        message: 'projectId et professionalId sont requis',
      });
    }

    console.log('📋 Données reçues:', { projectId, professionalId });

    // 1. Récupérer les informations du projet
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      console.error('❌ Erreur récupération projet:', projectError);
      return res.status(404).json({
        error: 'Projet non trouvé',
        message: "Le projet spécifié n'existe pas",
      });
    }

    console.log('✅ Projet trouvé:', project.title);

    // 2. Récupérer les informations du professionnel
    const { data: professional, error: professionalError } = await supabase
      .from('professionals')
      .select(
        `
        *,
        profiles!professionals_user_id_fkey (
          full_name,
          email,
          phone
        )
      `
      )
      .eq('id', professionalId)
      .single();

    if (professionalError || !professional) {
      console.error('❌ Erreur récupération professionnel:', professionalError);
      return res.status(404).json({
        error: 'Professionnel non trouvé',
        message: "Le professionnel spécifié n'existe pas",
      });
    }

    console.log('✅ Professionnel trouvé:', professional.company_name);

    // 3. Récupérer les informations du client
    const { data: client, error: clientError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', project.client_id)
      .single();

    if (clientError || !client) {
      console.error('❌ Erreur récupération client:', clientError);
      return res.status(404).json({
        error: 'Client non trouvé',
        message: "Le client associé au projet n'existe pas",
      });
    }

    console.log('✅ Client trouvé:', client.full_name);

    // 4. Envoyer l'email au client
    console.log('📧 Envoi email au client...');
    const clientEmailResult = await sendClientInterestEmail(
      project,
      professional,
      client
    );

    if (!clientEmailResult.success) {
      console.error('❌ Erreur envoi email client:', clientEmailResult.error);
      // Continuer même si l'email client échoue
    } else {
      console.log('✅ Email client envoyé avec succès');
    }

    // 5. Envoyer l'email aux administrateurs
    console.log('📧 Envoi emails aux administrateurs...');
    const adminEmailResults = await sendAdminInterestEmails(
      project,
      professional,
      client
    );

    const adminSuccessCount = adminEmailResults.filter((r) => r.success).length;
    console.log(
      `✅ Emails admin envoyés: ${adminSuccessCount}/${ADMIN_EMAILS.length}`
    );

    // 6. Logger la notification
    await logNotification(projectId, professionalId, project.client_id, {
      clientEmailSent: clientEmailResult.success,
      adminEmailsSent: adminSuccessCount,
      totalAdmins: ADMIN_EMAILS.length,
    });

    // 7. Retourner le succès
    return res.status(200).json({
      success: true,
      message: 'Notifications envoyées avec succès',
      data: {
        projectId,
        professionalId,
        clientEmailSent: clientEmailResult.success,
        adminEmailsSent: adminSuccessCount,
        projectName: project.title,
        professionalName: professional.company_name,
        clientName: client.full_name,
      },
    });
  } catch (error) {
    console.error('❌ Erreur générale API notification:', error);
    return res.status(500).json({
      error: 'Erreur interne du serveur',
      message: "Une erreur est survenue lors de l'envoi des notifications",
    });
  }
}

/**
 * Envoyer l'email au client pour l'informer de l'intérêt
 */
async function sendClientInterestEmail(
  project: ProjectData,
  professional: ProfessionalData,
  client: ClientData
): Promise<{ success: boolean; error?: string }> {
  try {
    const subject = `🔔 Nouveau professionnel intéressé par votre projet "${project.title}"`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Nouveau professionnel intéressé</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .professional-info { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #2563eb; }
          .project-info { background: #e0f2fe; padding: 15px; margin: 15px 0; border-radius: 8px; }
          .cta { text-align: center; margin: 20px 0; }
          .btn { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Bonne nouvelle !</h1>
            <p>Un professionnel est intéressé par votre projet</p>
          </div>
          
          <div class="content">
            <p>Bonjour ${client.full_name},</p>
            <p>Nous avons le plaisir de vous informer qu'un professionnel qualifié a manifesté son intérêt pour votre projet.</p>
            
            <div class="professional-info">
              <h3>🔧 Informations du professionnel</h3>
              <p><strong>Entreprise:</strong> ${professional.company_name}</p>
              <p><strong>Spécialités:</strong> ${professional.specialties?.join(', ') || 'Non spécifié'}</p>
              ${professional.experience_years ? `<p><strong>Expérience:</strong> ${professional.experience_years} ans</p>` : ''}
              ${professional.rating_average ? `<p><strong>Note:</strong> ⭐ ${professional.rating_average}/5</p>` : ''}
            </div>
            
            <div class="project-info">
              <h3>📋 Votre projet</h3>
              <p><strong>Titre:</strong> ${project.title}</p>
              <p><strong>Catégorie:</strong> ${project.category}</p>
              <p><strong>Lieu:</strong> ${project.city} (${project.postal_code})</p>
              ${project.estimated_budget_min ? `<p><strong>Budget estimé:</strong> ${project.estimated_budget_min}€ - ${project.estimated_budget_max || 'N/A'}€</p>` : ''}
            </div>
            
            <div class="cta">
              <p>Connectez-vous à votre espace pour voir les détails et contacter le professionnel :</p>
              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/particulier/dashboard" class="btn">
                Voir les détails
              </a>
            </div>
            
            <p>Cordialement,<br>L'équipe SwipeTonPro</p>
          </div>
          
          <div class="footer">
            <p>Cet email a été envoyé automatiquement. Ne répondez pas à cet email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: client.email,
      subject,
      html: htmlContent,
      text: `Un professionnel est intéressé par votre projet "${project.title}". Connectez-vous à votre espace pour voir les détails.`,
    });

    return { success: true };
  } catch (error) {
    console.error('Erreur envoi email client:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Envoyer les emails aux administrateurs
 */
async function sendAdminInterestEmails(
  project: ProjectData,
  professional: ProfessionalData,
  client: ClientData
): Promise<{ success: boolean; error?: string }[]> {
  const results = [];

  for (const adminEmail of ADMIN_EMAILS) {
    try {
      const subject = `🔔 Nouvel intérêt professionnel - Projet: ${project.title}`;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Nouvel intérêt professionnel</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .info-box { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #dc2626; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 Notification Admin</h1>
              <p>Nouvel intérêt professionnel enregistré</p>
            </div>
            
            <div class="content">
              <p>Un professionnel a manifesté son intérêt pour un projet sur la plateforme.</p>
              
              <div class="info-box">
                <h3>📋 Détails du projet</h3>
                <p><strong>Titre:</strong> ${project.title}</p>
                <p><strong>ID:</strong> ${project.id}</p>
                <p><strong>Client:</strong> ${client.full_name} (${client.email})</p>
                <p><strong>Catégorie:</strong> ${project.category}</p>
                <p><strong>Lieu:</strong> ${project.city} (${project.postal_code})</p>
                <p><strong>Créé le:</strong> ${new Date(project.created_at).toLocaleDateString('fr-FR')}</p>
              </div>
              
              <div class="info-box">
                <h3>🔧 Détails du professionnel</h3>
                <p><strong>Entreprise:</strong> ${professional.company_name}</p>
                <p><strong>ID:</strong> ${professional.id}</p>
                <p><strong>Spécialités:</strong> ${professional.specialties?.join(', ') || 'Non spécifié'}</p>
                <p><strong>Statut:</strong> ${professional.status}</p>
                ${professional.contact_email ? `<p><strong>Email:</strong> ${professional.contact_email}</p>` : ''}
              </div>
              
              <p>
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/projects" class="btn" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Voir dans l'admin
                </a>
              </p>
            </div>
            
            <div class="footer">
              <p>Cet email a été envoyé automatiquement par le système SwipeTonPro.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await sendEmail({
        to: adminEmail,
        subject,
        html: htmlContent,
        text: `Nouvel intérêt professionnel pour le projet "${project.title}" par ${professional.company_name}.`,
      });

      results.push({ success: true });
    } catch (error) {
      console.error(`Erreur envoi email admin ${adminEmail}:`, error);
      results.push({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    }
  }

  return results;
}

/**
 * Logger la notification dans la base de données
 */
async function logNotification(
  projectId: string,
  professionalId: string,
  clientId: string,
  results: {
    clientEmailSent: boolean;
    adminEmailsSent: number;
    totalAdmins: number;
  }
) {
  try {
    await supabase.from('notification_logs').insert({
      type: 'professional_interested',
      project_id: projectId,
      professional_id: professionalId,
      client_id: clientId,
      status: 'sent',
      metadata: {
        clientEmailSent: results.clientEmailSent,
        adminEmailsSent: results.adminEmailsSent,
        totalAdmins: results.totalAdmins,
        timestamp: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    });

    console.log('✅ Notification logged successfully');
  } catch (error) {
    console.error('❌ Erreur logging notification:', error);
    // Ne pas bloquer si le logging échoue
  }
}
