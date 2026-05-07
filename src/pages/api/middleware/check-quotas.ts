import { NextApiRequest, NextApiResponse } from 'next';
import { checkEstimationQuotas } from '@/middleware/quotaMiddleware';

export default async function handler(
  req: NextApiRequest,
  response: NextApiResponse
) {
  // Uniquement POST
  if (req.method !== 'POST') {
    return response.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { clientId, professionalId, projectId } = req.body;

    // Validation des données
    if (!clientId || !professionalId) {
      return response.status(400).json({
        error: 'clientId et professionalId requis',
      });
    }

    if (typeof clientId !== 'string' || typeof professionalId !== 'string') {
      return response.status(400).json({
        error:
          'clientId et professionalId doivent être des chaînes de caractères',
      });
    }

    if (projectId && typeof projectId !== 'string') {
      return response.status(400).json({
        error: 'projectId doit être une chaîne de caractères',
      });
    }

    // Vérifier tous les quotas
    const quotaResult = await checkEstimationQuotas(
      clientId,
      professionalId,
      projectId
    );

    if (quotaResult.canCreate) {
      return response.status(200).json({
        success: true,
        message: 'Tous les quotas sont respectés',
        canProceed: true,
      });
    } else {
      return response.status(429).json({
        success: false,
        error: 'Quota dépassé',
        canProceed: false,
        moderationMessage: quotaResult.moderationMessage,
        // @ts-ignore - body type is ReadableStream
        quotaInfo: quotaResult.response
          ? JSON.parse(quotaResult.response.body as any)
          : null,
      });
    }
  } catch (error) {
    console.error('❌ Erreur API middleware/check-quotas:', error);
    return response.status(500).json({
      error: 'Erreur serveur lors de la vérification des quotas',
    });
  }
}
