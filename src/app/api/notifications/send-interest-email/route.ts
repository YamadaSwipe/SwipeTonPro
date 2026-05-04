/**
 * @fileoverview API d'envoi d'emails d'intérêt professionnel
 * @author Senior Architect
 * @version 1.0.0
 *
 * API pour envoyer des emails lorsqu'un professionnel manifeste son intérêt
 * pour un projet client (SMTP OVH)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  sendEmailWithRetry,
  generateProfessionalInterestEmail,
  generateAdminNotificationEmail,
} from '@/lib/mailer';

// Initialisation Supabase côté serveur
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Interface pour les données de la requête
 */
interface SendInterestEmailRequest {
  projectId: string;
  professionalId: string;
}

/**
 * Fonction principale de l'API
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📧 Email API: Sending interest notification emails');

    // ÉTAPE 0: Authentification (SÉCURITÉ)
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      console.error('❌ Email API: No authorization header provided');
      return NextResponse.json(
        {
          error: 'No token provided',
          message: "Token d'authentification manquant",
        },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    if (!token || token.length === 0) {
      console.error('❌ Email API: Invalid token format');
      return NextResponse.json(
        {
          error: 'Invalid token format',
          message: 'Format du token invalide',
        },
        { status: 401 }
      );
    }

    // Vérifier l'utilisateur via Supabase
    console.log('📧 Email API: Verifying user token...');
    const { data: authData, error: authError } =
      await supabase.auth.getUser(token);

    if (authError || !authData?.user) {
      console.error('❌ Email API: Authentication failed:', authError);
      return NextResponse.json(
        {
          error: 'Authentication failed',
          message: 'Token invalide ou expiré',
        },
        { status: 401 }
      );
    }

    const user = authData.user;

    console.log('✅ Email API: User authenticated:', user?.email);

    // ÉTAPE 1: Récupérer et valider les données
    const body = await request.json();
    const { projectId, professionalId } = body as SendInterestEmailRequest;

    console.log('📧 Email API: Request data:', { projectId, professionalId });

    if (!projectId || !professionalId) {
      console.error('❌ Email API: Missing required fields', {
        projectId,
        professionalId,
      });
      return NextResponse.json(
        {
          error: 'Missing required fields',
          message: 'projectId et professionalId sont requis',
        },
        { status: 400 }
      );
    }

    // ÉTAPE 1.1: Valider que l'utilisateur est bien le professionnel
    console.log('📧 Email API: Validating user is professional...');
    const { data: professionalData, error: proError } = await supabase
      .from('professionals')
      .select('id, user_id, company_name')
      .eq('id', professionalId)
      .eq('user_id', user.id)
      .single();

    if (proError || !professionalData) {
      console.error('❌ Email API: Professional validation failed:', proError);
      return NextResponse.json(
        {
          error: 'Professional validation failed',
          message: 'Utilisateur non autorisé à envoyer cet email',
        },
        { status: 403 }
      );
    }

    console.log(
      '✅ Email API: Professional validated:',
      professionalData.company_name
    );

    // ÉTAPE 2: Récupérer les données du projet
    console.log('📧 Email API: Fetching project data...');
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, title, client_id, description, status')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      console.error('❌ Email API: Project not found:', projectError);
      return NextResponse.json(
        {
          error: 'Project not found',
          message: 'Projet non trouvé',
        },
        { status: 404 }
      );
    }

    console.log('✅ Email API: Project found:', project.title);

    // ÉTAPE 3: Récupérer les données du client
    console.log('📧 Email API: Fetching client data...');
    const { data: client, error: clientError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', project.client_id)
      .single();

    if (clientError || !client) {
      console.error('❌ Email API: Client not found:', clientError);
      return NextResponse.json(
        {
          error: 'Client not found',
          message: 'Client non trouvé',
        },
        { status: 404 }
      );
    }

    console.log('✅ Email API: Client found:', client.full_name);

    // ÉTAPE 4: Récupérer les données du professionnel
    console.log('📧 Email API: Fetching professional data...');
    const { data: professionalDetails, error: professionalError } =
      await supabase
        .from('professionals')
        .select(
          `
        id,
        user_id,
        company_name,
        contact_email,
        contact_phone,
        address,
        city,
        postal_code,
        siret,
        status
      `
        )
        .eq('id', professionalId)
        .single();

    if (professionalError || !professionalDetails) {
      console.error('❌ Email API: Professional not found:', professionalError);
      return NextResponse.json(
        {
          error: 'Professional not found',
          message: 'Professionnel non trouvé',
        },
        { status: 404 }
      );
    }

    console.log(
      '✅ Email API: Professional found:',
      professionalDetails.company_name
    );

    // ÉTAPE 5: Envoyer l'email au client
    console.log('📧 Email API: Sending email to client...');

    const clientEmailData = generateProfessionalInterestEmail({
      projectName: project.title,
      professionalName: professionalDetails.company_name,
      professionalCompany: professionalDetails.company_name,
      clientName: client.full_name,
      projectId: project.id,
    });

    const clientEmailSent = await sendEmailWithRetry({
      to: client.email,
      ...clientEmailData,
    });

    if (!clientEmailSent) {
      console.error('❌ Email API: Failed to send client email');
      // Continuer quand même pour l'email admin
    } else {
      console.log('✅ Email API: Client email sent successfully');
    }

    // ÉTAPE 6: Envoyer l'email aux administrateurs
    console.log('📧 Email API: Sending email to admins...');

    const adminEmailData = generateAdminNotificationEmail({
      projectName: project.title,
      professionalName: professionalDetails.company_name,
      professionalCompany: professionalDetails.company_name,
      clientName: client.full_name,
      projectId: project.id,
      professionalId: professionalDetails.id,
    });

    // Récupérer la liste des emails admin
    const { data: adminProfiles, error: adminError } = await supabase
      .from('profiles')
      .select('email')
      .in('role', ['admin', 'super_admin']);

    let adminEmails: string[] = [];
    let adminEmailSent = false;

    if (adminError) {
      console.error('❌ Email API: Error fetching admin profiles:', adminError);
    } else {
      adminEmails =
        adminProfiles?.map((profile) => profile.email).filter(Boolean) || [];

      if (adminEmails.length > 0) {
        adminEmailSent = await sendEmailWithRetry({
          to: adminEmails,
          ...adminEmailData,
        });

        if (!adminEmailSent) {
          console.error('❌ Email API: Failed to send admin email');
        } else {
          console.log('✅ Email API: Admin email sent successfully');
        }
      } else {
        console.warn('⚠️ Email API: No admin emails found');
      }
    }

    // ÉTAPE 7: Logger l'action pour audit
    try {
      await supabase.from('email_logs').insert({
        project_id: projectId,
        professional_id: professionalId,
        client_id: client.id,
        type: 'professional_interest',
        client_email_sent: clientEmailSent,
        admin_email_sent: adminEmails.length > 0,
        created_at: new Date().toISOString(),
      });

      console.log('✅ Email API: Email logged successfully');
    } catch (logError) {
      console.warn('⚠️ Email API: Could not log email:', logError);
      // Ne pas bloquer si le logging échoue
    }

    // ÉTAPE 8: Retourner le résultat
    return NextResponse.json({
      success: true,
      message: "Emails d'intérêt envoyés avec succès",
      data: {
        projectId,
        professionalId,
        clientEmail: client.email,
        clientEmailSent,
        adminEmailSent: adminEmails.length > 0,
        projectName: project.title,
        professionalName: professionalDetails.company_name,
        clientName: client.full_name,
      },
    });
  } catch (error) {
    console.error('❌ Email API: Unexpected error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: "Erreur interne du serveur lors de l'envoi des emails",
        details:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * Méthode GET pour vérifier le statut du service email
 */
export async function GET() {
  try {
    console.log('📧 Email API: Health check');

    // Vérifier la configuration SMTP
    const smtpConfig = {
      host: process.env.SMTP_HOST ? '✅ Configuré' : '❌ Manquant',
      port: process.env.SMTP_PORT || '587',
      user: process.env.SMTP_USER ? '✅ Configuré' : '❌ Manquant',
      pass: process.env.SMTP_PASS ? '✅ Configuré' : '❌ Manquant',
    };

    const isConfigured = Object.values(smtpConfig).every((status) =>
      status.includes('✅')
    );

    return NextResponse.json({
      service: 'Email API',
      status: isConfigured ? 'OK' : 'MISSING_CONFIG',
      smtp: smtpConfig,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Email API: Health check error:', error);

    return NextResponse.json(
      {
        service: 'Email API',
        status: 'ERROR',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
