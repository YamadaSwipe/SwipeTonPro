import { NextApiRequest, NextApiResponse } from 'next';
import { milestoneService } from '@/services/milestoneService';
import { authService } from '@/services/authService';

export default async function handler(
  req: NextApiRequest,
  response: NextApiResponse
) {
  // Uniquement POST
  if (req.method !== 'POST') {
    return response.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // Vérifier l'authentification
    const session = await authService.getCurrentSession();
    if (!session?.user) {
      return response.status(401).json({ error: 'Non authentifié' });
    }

    const {
      milestoneId,
      validationType, // 'professional' | 'client'
      photos,
      notes,
      clientValidationStatus,
      clientValidationNotes,
    } = req.body;

    // Validation des données
    if (!milestoneId || !validationType) {
      return response.status(400).json({
        error: 'milestoneId et validationType requis',
      });
    }

    if (typeof milestoneId !== 'string' || typeof validationType !== 'string') {
      return response.status(400).json({
        error:
          'milestoneId et validationType doivent être des chaînes de caractères',
      });
    }

    if (!['professional', 'client'].includes(validationType)) {
      return response.status(400).json({
        error: 'validationType doit être "professional" ou "client"',
      });
    }

    let result;

    if (validationType === 'professional') {
      // Validation par le professionnel
      if (!photos || !Array.isArray(photos) || photos.length === 0) {
        return response.status(400).json({
          error:
            "photos requis pour la validation professionnelle (tableau d'URLs)",
        });
      }

      result = await milestoneService.validateByProfessional(
        milestoneId,
        photos,
        notes
      );
    } else {
      // Validation par le client
      if (!clientValidationStatus) {
        return response.status(400).json({
          error: 'clientValidationStatus requis pour la validation client',
        });
      }

      if (
        !['approved', 'rejected', 'disputed'].includes(clientValidationStatus)
      ) {
        return response.status(400).json({
          error:
            'clientValidationStatus doit être "approved", "rejected" ou "disputed"',
        });
      }

      result = await milestoneService.validateByClient(milestoneId, {
        milestoneId,
        proValidationPhotos: [], // Non utilisé pour validation client
        clientValidationStatus,
        clientValidationNotes,
      });
    }

    if (result.success) {
      return response.status(200).json({
        success: true,
        stripeTransferId: result.stripeTransferId,
      });
    } else {
      return response.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('❌ Erreur API milestones/validate:', error);
    return response.status(500).json({
      error: 'Erreur serveur lors de la validation de la milestone',
    });
  }
}
