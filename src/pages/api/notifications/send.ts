/**
 * @fileoverview API Sécurisée d'Envoi de Notifications
 * @author Senior Security Architect
 * @version 1.0.0
 * 
 * Endpoint sécurisé pour l'envoi de notifications email
 */

import { NextRequest, NextResponse } from 'next/server';
import { secureNotificationService } from '@/services/secureNotificationService';
import { withSecureNotification } from '@/middleware/secureNotification';

/**
 * Types de notifications et leurs handlers
 */
const notificationHandlers = {
  professional_interested: async (data: any) => {
    return await secureNotificationService.notifyProfessionalInterest(
      data.projectId,
      data.professionalId
    );
  },
  
  new_project_admin: async (data: any) => {
    return await secureNotificationService.notifyNewProject(data.projectId);
  },
  
  new_professional_admin: async (data: any) => {
    return await secureNotificationService.notifyNewProfessional(data.professionalId);
  },
  
  match_completed: async (data: any) => {
    return await secureNotificationService.notifyMatchCompleted(
      data.projectId,
      data.professionalId,
      data.clientId
    );
  }
};

/**
 * Handler principal avec sécurité
 */
async function handler(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, ...notificationData } = body;

    console.log('🔔 API Notification reçue:', { type, dataKeys: Object.keys(notificationData) });

    // Vérifier que le type est supporté
    if (!type || !notificationHandlers[type]) {
      return NextResponse.json(
        { error: `Type de notification non supporté: ${type}` },
        { status: 400 }
      );
    }

    // Exécuter le handler spécifique
    const result = await notificationHandlers[type](notificationData);

    if (result.success) {
      console.log('✅ Notification envoyée avec succès:', type);
      return NextResponse.json({
        success: true,
        message: 'Notification envoyée avec succès',
        type,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('❌ Échec envoi notification:', type, result.error);
      return NextResponse.json(
        { 
          success: false, 
          error: result.error,
          type,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Erreur API notification:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur serveur',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * Exporter avec le middleware de sécurité
 */
export default withSecureNotification(handler);

/**
 * Méthodes HTTP autorisées
 */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: false,
  },
};
