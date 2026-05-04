import { NextApiResponse } from 'next';

/**
 * Standard API Response utilities for consistent API responses
 */

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  meta?: {
    timestamp: string;
    requestId?: string;
    pagination?: {
      page: number;
      perPage: number;
      total: number;
      totalPages: number;
    };
  };
}

// Standard success response
export function successResponse<T>(
  res: NextApiResponse,
  data: T,
  statusCode: number = 200,
  meta?: ApiResponse<T>['meta']
): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  };
  res.status(statusCode).json(response);
}

// Standard error response
export function errorResponse(
  res: NextApiResponse,
  message: string,
  statusCode: number = 400,
  errorCode?: string
): void {
  const response: ApiResponse = {
    success: false,
    error: message,
    errorCode,
    meta: {
      timestamp: new Date().toISOString()
    }
  };
  res.status(statusCode).json(response);
}

// Common HTTP error helpers
export const httpErrors = {
  badRequest: (res: NextApiResponse, message: string = 'Requête invalide') =>
    errorResponse(res, message, 400, 'BAD_REQUEST'),

  unauthorized: (res: NextApiResponse, message: string = 'Non authentifié') =>
    errorResponse(res, message, 401, 'UNAUTHORIZED'),

  forbidden: (res: NextApiResponse, message: string = 'Accès refusé') =>
    errorResponse(res, message, 403, 'FORBIDDEN'),

  notFound: (res: NextApiResponse, message: string = 'Ressource non trouvée') =>
    errorResponse(res, message, 404, 'NOT_FOUND'),

  methodNotAllowed: (res: NextApiResponse, message: string = 'Méthode non autorisée') =>
    errorResponse(res, message, 405, 'METHOD_NOT_ALLOWED'),

  conflict: (res: NextApiResponse, message: string = 'Conflit de données') =>
    errorResponse(res, message, 409, 'CONFLICT'),

  rateLimited: (res: NextApiResponse, message: string = 'Trop de requêtes', retryAfter?: number) => {
    res.setHeader('Retry-After', retryAfter?.toString() || '60');
    errorResponse(res, message, 429, 'RATE_LIMITED');
  },

  internalError: (res: NextApiResponse, message: string = 'Erreur serveur') =>
    errorResponse(res, message, 500, 'INTERNAL_ERROR'),

  serviceUnavailable: (res: NextApiResponse, message: string = 'Service temporairement indisponible') =>
    errorResponse(res, message, 503, 'SERVICE_UNAVAILABLE')
};

// Quota specific responses
export function quotaExceededResponse(
  res: NextApiResponse,
  quotaType: 'professional' | 'client' | 'project',
  resetTime?: string,
  moderationMessage?: any
): void {
  const typeLabels = {
    professional: 'Quota journalier atteint',
    client: 'Quota hebdomadaire atteint',
    project: 'Quota de réponses atteint'
  };

  const response: ApiResponse = {
    success: false,
    error: typeLabels[quotaType],
    errorCode: 'QUOTA_EXCEEDED',
    meta: {
      timestamp: new Date().toISOString()
    }
  };

  // Add additional data in headers for client-side handling
  if (resetTime) {
    res.setHeader('X-Quota-Reset-Time', resetTime);
  }
  if (moderationMessage) {
    res.setHeader('X-Moderation-Message', JSON.stringify(moderationMessage));
  }

  res.status(403).json(response);
}

// Validation error response
export function validationErrorResponse(
  res: NextApiResponse,
  errors: string[] | string
): void {
  const errorMessages = Array.isArray(errors) ? errors : [errors];

  const response: ApiResponse = {
    success: false,
    error: 'Validation échouée',
    errorCode: 'VALIDATION_ERROR',
    meta: {
      timestamp: new Date().toISOString()
    }
  };

  // Add validation details in a separate field
  (response as any).validationErrors = errorMessages;

  res.status(422).json(response);
}

// Pagination helper
export function paginatedResponse<T>(
  res: NextApiResponse,
  data: T[],
  page: number,
  perPage: number,
  total: number
): void {
  const totalPages = Math.ceil(total / perPage);

  successResponse(res, data, 200, {
    timestamp: new Date().toISOString(),
    pagination: {
      page,
      perPage,
      total,
      totalPages
    }
  });
}

// Moderation response (for content flagged)
export function moderationBlockedResponse(
  res: NextApiResponse,
  reason: string,
  moderationResult?: any
): void {
  const response: ApiResponse = {
    success: false,
    error: 'Contenu bloqué par la modération',
    errorCode: 'CONTENT_BLOCKED',
    meta: {
      timestamp: new Date().toISOString()
    }
  };

  if (moderationResult) {
    (response as any).moderationResult = moderationResult;
  }

  res.status(403).json(response);
}

// Export types
export type { ApiResponse };
