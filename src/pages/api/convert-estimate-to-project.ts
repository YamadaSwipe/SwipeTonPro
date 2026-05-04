import { NextApiRequest, NextApiResponse } from 'next';
import { estimateToProjectService } from '@/services/estimateToProjectService';
import { authService } from '@/services/authService';
import { supabase } from '@/integrations/supabase/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Uniquement POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // Vérifier l'authentification
    const session = await authService.getCurrentSession();
    if (!session?.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const { estimateData, professionalId } = req.body;

    // Validation des données requises
    if (!estimateData || !professionalId) {
      return res.status(400).json({ 
        error: 'Données manquantes: estimateData et professionalId requis' 
      });
    }

    // Validation des champs de l'estimation
    const requiredFields = [
      'firstName', 'lastName', 'email', 'phone', 'city', 'postal_code',
      'description', 'workType', 'location', 'budgetMin', 'budgetMax', 'deadline'
    ];

    for (const field of requiredFields) {
      if (!estimateData[field]) {
        return res.status(400).json({ 
          error: `Champ requis manquant: ${field}` 
        });
      }
    }

    // Vérifier si la conversion est possible
    const canConvert = await estimateToProjectService.canConvertEstimate(
      estimateData, 
      professionalId
    );

    if (!canConvert.canConvert) {
      return res.status(400).json({ 
        error: canConvert.reason || 'Conversion non possible' 
      });
    }

    // Effectuer la conversion
    const result = await estimateToProjectService.convertEstimateToProject(
      estimateData,
      professionalId
    );

    if (result.success) {
      return res.status(200).json({
        success: true,
        projectId: result.projectId,
        matchId: result.matchId,
        stripeCheckoutUrl: result.stripeCheckoutUrl,
        message: 'Estimation convertie en projet avec succès'
      });
    } else {
      return res.status(500).json({ 
        error: result.error || 'Erreur lors de la conversion' 
      });
    }

  } catch (error) {
    console.error('❌ Erreur API convert-estimate-to-project:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur lors de la conversion' 
    });
  }
}
