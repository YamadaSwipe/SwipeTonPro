import { NextApiRequest, NextApiResponse } from 'next';
import { withAdminAuth, AuthenticatedRequest } from '@/middleware/withAuth';
import { appSettingsService } from '@/services/appSettingsService';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse,
  httpErrors 
} from '@/utils/apiResponse';

/**
 * API pour gérer les paramètres de l'application (Admin uniquement)
 * 
 * GET /api/admin/app-settings - Liste tous les settings
 * GET /api/admin/app-settings?category=quotas - Liste par catégorie
 * GET /api/admin/app-settings?key=max_pro_estimates_daily - Récupère un setting spécifique
 * POST /api/admin/app-settings - Crée un nouveau setting
 * PUT /api/admin/app-settings - Met à jour un setting
 * DELETE /api/admin/app-settings?key=xxx - Supprime un setting
 */

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { method, query } = req;

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
  const { key, category, keys } = req.query;

  try {
    // Récupérer un setting spécifique
    if (key && typeof key === 'string') {
      const value = await appSettingsService.getSetting(key, false);
      
      if (value === null) {
        return httpErrors.notFound(res, 'Setting non trouvé');
      }

      return successResponse(res, { key, value });
    }

    // Récupérer plusieurs settings
    if (keys && typeof keys === 'string') {
      const keyArray = keys.split(',').map(k => k.trim());
      const values = await appSettingsService.getMultipleSettings(keyArray);
      return successResponse(res, values);
    }

    // Récupérer par catégorie
    if (category && typeof category === 'string') {
      const settings = await appSettingsService.getSettingsByCategory(category);
      return successResponse(res, settings);
    }

    // Récupérer les settings par défaut (quotas et features)
    const [quotas, features] = await Promise.all([
      appSettingsService.getSettingsByCategory('quotas'),
      appSettingsService.getSettingsByCategory('features')
    ]);

    return successResponse(res, {
      quotas,
      features,
      totalCount: quotas.length + features.length
    });

  } catch (error) {
    console.error('❌ Erreur GET app-settings:', error);
    return httpErrors.internalError(res);
  }
}

// POST - Création
async function handlePost(req: AuthenticatedRequest, res: NextApiResponse) {
  const { key, value, description, category = 'general' } = req.body;
  const userId = req.user?.id;

  // Validation
  if (!key || typeof key !== 'string') {
    return validationErrorResponse(res, ['Le paramètre "key" est requis']);
  }

  if (value === undefined) {
    return validationErrorResponse(res, ['Le paramètre "value" est requis']);
  }

  if (key.length > 100) {
    return validationErrorResponse(res, ['La clé ne peut pas dépasser 100 caractères']);
  }

  // Validation du format de la clé (snake_case)
  const keyRegex = /^[a-z][a-z0-9_]*$/;
  if (!keyRegex.test(key)) {
    return validationErrorResponse(res, ['La clé doit être en snake_case (ex: max_pro_estimates_daily)']);
  }

  try {
    const result = await appSettingsService.createSetting(
      key,
      value,
      description || '',
      category,
      userId!
    );

    if (result.success) {
      return successResponse(
        res, 
        { key, value, category },
        201
      );
    } else {
      return errorResponse(res, result.error || 'Erreur lors de la création', 400);
    }
  } catch (error) {
    console.error('❌ Erreur POST app-settings:', error);
    return httpErrors.internalError(res);
  }
}

// PUT - Mise à jour
async function handlePut(req: AuthenticatedRequest, res: NextApiResponse) {
  const { key, value } = req.body;
  const userId = req.user?.id;

  // Validation
  if (!key || typeof key !== 'string') {
    return validationErrorResponse(res, ['Le paramètre "key" est requis']);
  }

  if (value === undefined) {
    return validationErrorResponse(res, ['Le paramètre "value" est requis']);
  }

  // Settings protégés
  const protectedSettings = ['app_version', 'database_version'];
  if (protectedSettings.includes(key)) {
    return httpErrors.forbidden(res, 'Ce setting est protégé et ne peut pas être modifié');
  }

  try {
    const result = await appSettingsService.updateSetting(key, value, userId!);

    if (result.success) {
      return successResponse(res, { key, value });
    } else {
      return errorResponse(res, result.error || 'Erreur lors de la mise à jour', 400);
    }
  } catch (error) {
    console.error('❌ Erreur PUT app-settings:', error);
    return httpErrors.internalError(res);
  }
}

// DELETE - Suppression (désactivation)
async function handleDelete(req: AuthenticatedRequest, res: NextApiResponse) {
  const { key } = req.query;
  const userId = req.user?.id;

  if (!key || typeof key !== 'string') {
    return validationErrorResponse(res, ['Le paramètre "key" est requis']);
  }

  // Settings critiques non supprimables
  const criticalSettings = [
    'max_pro_estimates_daily',
    'max_user_estimates_per_project',
    'max_client_estimates_weekly',
    'anonymous_message_limit',
    'stripe_escrow_enabled'
  ];

  if (criticalSettings.includes(key)) {
    return httpErrors.forbidden(res, 'Ce setting critique ne peut pas être supprimé');
  }

  try {
    // Soft delete: marquer comme non-editable et caché
    const result = await appSettingsService.updateSetting(
      key,
      { deleted: true, deleted_at: new Date().toISOString() },
      userId!
    );

    if (result.success) {
      return successResponse(res, { key, deleted: true });
    } else {
      return errorResponse(res, result.error || 'Erreur lors de la suppression', 400);
    }
  } catch (error) {
    console.error('❌ Erreur DELETE app-settings:', error);
    return httpErrors.internalError(res);
  }
}

export default withAdminAuth(handler);
