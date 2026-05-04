import { NextApiRequest, NextApiResponse } from 'next';
import { withAdminAuth, AuthenticatedRequest } from '@/middleware/withAuth';
import { matchingFeesService } from '@/services/matchingFeesService';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse,
  httpErrors 
} from '@/utils/apiResponse';

/**
 * API pour gérer les paliers de frais de matching (Admin uniquement)
 * 
 * GET /api/admin/matching-fees - Liste tous les paliers actifs
 * GET /api/admin/matching-fees?calculate=50000 - Calcule les frais pour un montant
 * GET /api/admin/matching-fees?preview=true - Prévisualise les frais
 * POST /api/admin/matching-fees - Crée un nouveau palier
 * PUT /api/admin/matching-fees - Met à jour un palier
 * DELETE /api/admin/matching-fees?id=xxx - Supprime un palier
 */

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return await handleGet(req, res);
    
    case 'POST':
      return await handlePost(req, res);
    
    case 'PUT':
    case 'PATCH':
      return await handlePut(req, res);
    
    case 'DELETE':
      return await handleDelete(req, res);
    
    default:
      return httpErrors.methodNotAllowed(res);
  }
}

// GET - Récupération
async function handleGet(req: AuthenticatedRequest, res: NextApiResponse) {
  const { calculate, preview, includeInactive } = req.query;

  try {
    // Calcul des frais pour un montant
    if (calculate && typeof calculate === 'string') {
      const amount = parseInt(calculate, 10);
      
      if (isNaN(amount) || amount <= 0) {
        return validationErrorResponse(res, ['Montant invalide']);
      }

      const result = await matchingFeesService.calculateFee(amount);

      if (result.success) {
        return successResponse(res, {
          amount,
          feeAmount: result.feeAmount,
          feeDetails: result.feeDetails
        });
      } else {
        return errorResponse(res, result.error || 'Erreur de calcul', 400);
      }
    }

    // Prévisualisation
    if (preview === 'true') {
      const testAmounts = [2500, 5000, 15000, 30000, 50000, 100000, 250000, 500000];
      const previews = await matchingFeesService.previewFees(testAmounts);
      return successResponse(res, { previews });
    }

    // Récupérer tous les paliers
    const tiers = await matchingFeesService.getActiveTiers();
    const stats = await matchingFeesService.getFeeStats();

    return successResponse(res, {
      tiers: includeInactive === 'true' ? tiers : tiers.filter(t => t.is_active),
      stats,
      count: tiers.length
    });

  } catch (error) {
    console.error('❌ Erreur GET matching-fees:', error);
    return httpErrors.internalError(res);
  }
}

// POST - Création
async function handlePost(req: AuthenticatedRequest, res: NextApiResponse) {
  const {
    min_amount,
    max_amount,
    fee_amount,
    is_percentage = false,
    percentage_value,
    is_active = true
  } = req.body;

  const userId = req.user?.id;

  // Validation
  const errors = [];

  if (min_amount === undefined || typeof min_amount !== 'number') {
    errors.push('Le montant minimum est requis (en centimes)');
  }

  if (fee_amount === undefined && !is_percentage) {
    errors.push('Le montant des frais ou le pourcentage est requis');
  }

  if (is_percentage && (!percentage_value || percentage_value <= 0)) {
    errors.push('Le pourcentage doit être positif quand is_percentage est true');
  }

  if (!is_percentage && (!fee_amount || fee_amount <= 0)) {
    errors.push('Le montant des frais doit être positif');
  }

  if (errors.length > 0) {
    return validationErrorResponse(res, errors);
  }

  // Validation logique
  if (max_amount !== null && max_amount !== undefined && min_amount >= max_amount) {
    return validationErrorResponse(res, ['Le montant max doit être supérieur au montant min']);
  }

  if (is_percentage && (percentage_value <= 0 || percentage_value > 100)) {
    return validationErrorResponse(res, ['Le pourcentage doit être entre 0 et 100']);
  }

  try {
    const result = await matchingFeesService.createTier(
      {
        min_amount,
        max_amount: max_amount || null,
        fee_amount: fee_amount || 0,
        is_percentage,
        percentage_value: is_percentage ? percentage_value : null,
        is_active
      },
      userId!
    );

    if (result.success) {
      return successResponse(
        res,
        { 
          id: result.tierId,
          min_amount,
          max_amount,
          fee_amount,
          is_percentage,
          percentage_value 
        },
        201
      );
    } else {
      return errorResponse(res, result.error || 'Erreur lors de la création', 400);
    }
  } catch (error) {
    console.error('❌ Erreur POST matching-fees:', error);
    return httpErrors.internalError(res);
  }
}

// PUT - Mise à jour
async function handlePut(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id, ...updates } = req.body;
  const userId = req.user?.id;

  if (!id || typeof id !== 'string') {
    return validationErrorResponse(res, ['L\'ID du palier est requis']);
  }

  // Validation des champs mis à jour
  if (updates.min_amount !== undefined && updates.max_amount !== undefined) {
    if (updates.min_amount >= updates.max_amount) {
      return validationErrorResponse(res, ['Le montant max doit être supérieur au montant min']);
    }
  }

  if (updates.is_percentage && updates.percentage_value !== undefined) {
    if (updates.percentage_value <= 0 || updates.percentage_value > 100) {
      return validationErrorResponse(res, ['Le pourcentage doit être entre 0 et 100']);
    }
  }

  try {
    const result = await matchingFeesService.updateTier(id, updates, userId!);

    if (result.success) {
      return successResponse(res, { id, updates });
    } else {
      return errorResponse(res, result.error || 'Erreur lors de la mise à jour', 400);
    }
  } catch (error) {
    console.error('❌ Erreur PUT matching-fees:', error);
    return httpErrors.internalError(res);
  }
}

// DELETE - Suppression
async function handleDelete(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query;
  const userId = req.user?.id;

  if (!id || typeof id !== 'string') {
    return validationErrorResponse(res, ['L\'ID du palier est requis']);
  }

  try {
    const result = await matchingFeesService.deleteTier(id, userId!);

    if (result.success) {
      return successResponse(res, { id, deleted: true });
    } else {
      return errorResponse(res, result.error || 'Erreur lors de la suppression', 400);
    }
  } catch (error) {
    console.error('❌ Erreur DELETE matching-fees:', error);
    return httpErrors.internalError(res);
  }
}

export default withAdminAuth(handler);
