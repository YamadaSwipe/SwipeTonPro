import { NextApiRequest, NextApiResponse } from 'next';
import { estimateToProjectService } from '@/services/estimateToProjectService';
import { withAuth, AuthenticatedRequest } from '@/middleware/withAuth';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default withAuth(async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Uniquement POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { estimateData, professionalId } = req.body;

    // Validation des données requises
    if (!estimateData || !professionalId) {
      return res.status(400).json({ 
        error: 'Données manquantes: estimateData et professionalId requis' 
      });
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(professionalId)) {
      return res.status(400).json({ error: 'professionalId invalide' });
    }

    // Vérifier que le pro demandé appartient à l'utilisateur connecté
    const { data: professional, error: professionalError } = await supabaseAdmin
      .from('professionals')
      .select('id, user_id, status')
      .eq('id', professionalId)
      .single();

    if (professionalError || !professional) {
      return res.status(404).json({ error: 'Professionnel introuvable' });
    }

    if (professional.user_id !== req.user?.id) {
      return res.status(403).json({
        error: 'Non autorisé pour ce profil professionnel',
      });
    }

    if (professional.status !== 'verified') {
      return res.status(403).json({
        error: 'Votre profil professionnel doit être validé pour continuer',
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
});
