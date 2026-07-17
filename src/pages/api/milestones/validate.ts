import { NextApiRequest, NextApiResponse } from 'next';
import { milestoneService } from '@/services/milestoneService';
import { withAuth, AuthenticatedRequest } from '@/middleware/withAuth';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default withAuth(async function handler(
  req: AuthenticatedRequest,
  response: NextApiResponse
) {
  // Uniquement POST
  if (req.method !== 'POST') {
    return response.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
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

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(milestoneId)) {
      return response.status(400).json({ error: 'milestoneId invalide' });
    }

    if (!['professional', 'client'].includes(validationType)) {
      return response.status(400).json({
        error: 'validationType doit être "professional" ou "client"',
      });
    }

    // Contrôle d'accès: vérifier l'appartenance au projet lié à la milestone
    const { data: milestoneProject, error: milestoneProjectError } = await supabaseAdmin
      .from('project_milestones')
      .select('id, project:projects(client_id, professional_id)')
      .eq('id', milestoneId)
      .maybeSingle();

    if (milestoneProjectError || !milestoneProject) {
      return response.status(404).json({ error: 'Milestone introuvable' });
    }

    const isClientOwner =
      (milestoneProject as any).project?.client_id === req.user?.id;

    const { data: requesterProfessional } = await supabaseAdmin
      .from('professionals')
      .select('id')
      .eq('user_id', req.user?.id)
      .maybeSingle();

    const isAssignedProfessional =
      !!requesterProfessional?.id &&
      (milestoneProject as any).project?.professional_id === requesterProfessional.id;

    if (validationType === 'professional' && !isAssignedProfessional) {
      return response.status(403).json({
        error: 'Seul le professionnel assigné peut valider cette étape',
      });
    }

    if (validationType === 'client' && !isClientOwner) {
      return response.status(403).json({
        error: 'Seul le client propriétaire peut valider cette étape',
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
});
