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
  res: NextApiResponse
) {
  // Uniquement POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const {
      projectId,
      milestoneName,
      milestoneOrder,
      percentage,
      amount,
      dueDate,
    } = req.body;

    // Validation des données
    if (
      !projectId ||
      !milestoneName ||
      milestoneOrder === undefined ||
      percentage === undefined ||
      amount === undefined
    ) {
      return res.status(400).json({
        error:
          'projectId, milestoneName, milestoneOrder, percentage et amount requis',
      });
    }

    if (typeof projectId !== 'string' || typeof milestoneName !== 'string') {
      return res.status(400).json({
        error:
          'projectId et milestoneName doivent être des chaînes de caractères',
      });
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      return res.status(400).json({ error: 'projectId invalide' });
    }

    if (
      typeof milestoneOrder !== 'number' ||
      typeof percentage !== 'number' ||
      typeof amount !== 'number'
    ) {
      return res.status(400).json({
        error: 'milestoneOrder, percentage et amount doivent être des nombres',
      });
    }

    if (milestoneOrder < 1 || milestoneOrder > 10) {
      return res.status(400).json({
        error: 'milestoneOrder doit être entre 1 et 10',
      });
    }

    if (percentage < 1 || percentage > 100) {
      return res.status(400).json({
        error: 'percentage doit être entre 1 et 100',
      });
    }

    if (amount < 100) {
      // Minimum 1€
      return res.status(400).json({
        error: 'amount doit être supérieur à 100 centimes',
      });
    }

    // Contrôle d'accès projet: client propriétaire ou pro assigné
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id, client_id, professional_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: 'Projet introuvable' });
    }

    let requesterProfessionalId: string | null = null;
    const { data: requesterProfessional } = await supabaseAdmin
      .from('professionals')
      .select('id')
      .eq('user_id', req.user?.id)
      .maybeSingle();

    requesterProfessionalId = requesterProfessional?.id || null;

    const isClientOwner = project.client_id === req.user?.id;
    const isAssignedProfessional =
      !!requesterProfessionalId && project.professional_id === requesterProfessionalId;

    if (!isClientOwner && !isAssignedProfessional) {
      return res.status(403).json({
        error: 'Accès interdit pour ce projet',
      });
    }

    // Créer la milestone
    const result = await milestoneService.createMilestone({
      projectId,
      milestoneName: milestoneName.trim(),
      milestoneOrder,
      percentage,
      amount,
      dueDate,
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        milestoneId: result.milestoneId,
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('❌ Erreur API milestones/create:', error);
    return res.status(500).json({
      error: 'Erreur serveur lors de la création de la milestone',
    });
  }
});
