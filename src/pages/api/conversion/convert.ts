import { NextApiRequest, NextApiResponse } from 'next';
import { projectConversionService } from '@/services/projectConversionService';
import { withAuth, AuthenticatedRequest } from '@/middleware/withAuth';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default withAuth(async function handler(req: AuthenticatedRequest, response: NextApiResponse) {
  // Uniquement POST
  if (req.method !== 'POST') {
    return response.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
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

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(estimationId) || !uuidRegex.test(professionalId)) {
      return response.status(400).json({ error: 'IDs invalides' });
    }

    const { data: professional, error: professionalError } = await supabaseAdmin
      .from('professionals')
      .select('id, user_id, status')
      .eq('id', professionalId)
      .single();

    if (professionalError || !professional) {
      return response.status(404).json({ error: 'Professionnel introuvable' });
    }

    if (professional.user_id !== req.user?.id) {
      return response.status(403).json({
        error: 'Non autorisé pour ce profil professionnel',
      });
    }

    if (professional.status !== 'verified') {
      return response.status(403).json({
        error: 'Profil professionnel non validé',
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
});
