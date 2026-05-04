import { NextApiRequest, NextApiResponse } from 'next';
import { projectConversionService } from '@/services/projectConversionService';
import { authService } from '@/services/authService';

export default async function handler(req: NextApiRequest, response: NextApiResponse) {
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
      estimationId, 
      professionalId, 
      projectTitle, 
      projectDescription, 
      estimatedBudget,
      milestones 
    } = req.body;

    // Validation des données
    if (!estimationId || !professionalId) {
      return response.status(400).json({ 
        error: 'estimationId et professionalId requis' 
      });
    }

    if (typeof estimationId !== 'string' || typeof professionalId !== 'string') {
      return response.status(400).json({ 
        error: 'estimationId et professionalId doivent être des chaînes de caractères' 
      });
    }

    if (estimatedBudget && (typeof estimatedBudget !== 'number' || estimatedBudget < 1000)) {
      return response.status(400).json({ 
        error: 'estimatedBudget doit être un nombre supérieur à 1000' 
      });
    }

    // Vérifier si la conversion est possible
    const canConvert = await projectConversionService.canConvertEstimation(
      estimationId,
      professionalId
    );

    if (!canConvert.canConvert) {
      return response.status(400).json({
        success: false,
        error: canConvert.reason
      });
    }

    // Effectuer la conversion
    const result = await projectConversionService.convertEstimationToProject({
      estimationId,
      professionalId,
      projectTitle,
      projectDescription,
      estimatedBudget,
      milestones
    });

    if (result.success) {
      return response.status(200).json({
        success: true,
        projectId: result.projectId,
        matchId: result.matchId,
        stripeCheckoutUrl: result.stripeCheckoutUrl,
        message: 'Estimation convertie en projet ferme avec succès'
      });
    } else {
      return response.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Erreur API conversion/convert:', error);
    return response.status(500).json({ 
      error: 'Erreur serveur lors de la conversion' 
    });
  }
}
