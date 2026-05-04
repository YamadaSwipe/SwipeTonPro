import { NextApiRequest, NextApiResponse } from 'next';
import { milestoneService } from '@/services/milestoneService';
import { authService } from '@/services/authService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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
}
