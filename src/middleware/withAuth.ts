import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { errorResponse } from '@/utils/apiResponse';

interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
}

type ApiHandler = (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void;

/**
 * Middleware d'authentification pour les API routes
 * Vérifie la présence d'un token valide et ajoute l'utilisateur à la requête
 */
export function withAuth(handler: ApiHandler): ApiHandler {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      // Récupérer le token depuis le header Authorization
      const authHeader = req.headers.authorization;
      
      if (!authHeader?.startsWith('Bearer ')) {
        errorResponse(res, 'Token d\'authentification manquant', 401, 'MISSING_TOKEN');
        return;
      }

      const token = authHeader.substring(7);

      if (!token) {
        errorResponse(res, 'Token invalide', 401, 'INVALID_TOKEN');
        return;
      }

      // Vérifier le token avec Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        console.error('❌ Auth error:', error);
        errorResponse(res, 'Token invalide ou expiré', 401, 'INVALID_TOKEN');
        return;
      }

      // Récupérer le profil utilisateur pour le rôle
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // Ajouter l'utilisateur à la requête
      req.user = {
        id: user.id,
        email: user.email,
        role: profile?.role || 'client'
      };

      // Appeler le handler
      return await handler(req, res);
    } catch (error) {
      console.error('❌ Erreur middleware auth:', error);
      errorResponse(res, 'Erreur d\'authentification', 500, 'AUTH_ERROR');
    }
  };
}

/**
 * Middleware avec authentification optionnelle
 * Continue même sans token mais ajoute l'utilisateur s'il existe
 */
export function withOptionalAuth(handler: ApiHandler): ApiHandler {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        if (token) {
          const { data: { user } } = await supabase.auth.getUser(token);
          
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', user.id)
              .single();

            req.user = {
              id: user.id,
              email: user.email,
              role: profile?.role || 'client'
            };
          }
        }
      }

      return await handler(req, res);
    } catch (error) {
      // Continue même en cas d'erreur d'auth
      return await handler(req, res);
    }
  };
}

/**
 * Middleware avec vérification de rôle admin
 */
export function withAdminAuth(handler: ApiHandler): ApiHandler {
  return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
    if (req.user?.role !== 'admin') {
      errorResponse(res, 'Accès réservé aux administrateurs', 403, 'FORBIDDEN');
      return;
    }

    return await handler(req, res);
  });
}

/**
 * Middleware avec vérification de rôle pro
 */
export function withProAuth(handler: ApiHandler): ApiHandler {
  return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
    if (req.user?.role !== 'professional' && req.user?.role !== 'admin') {
      errorResponse(res, 'Accès réservé aux professionnels', 403, 'FORBIDDEN');
      return;
    }

    return await handler(req, res);
  });
}

/**
 * Middleware de rate limiting basique par IP
 */
export function withRateLimit(
  handler: ApiHandler,
  maxRequests: number = 100,
  windowMs: number = 60000
): ApiHandler {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const key = `${ip}:${req.url}`;
    const now = Date.now();

    const record = requests.get(key);

    if (!record || now > record.resetTime) {
      // Premier appel ou fenêtre expirée
      requests.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
    } else {
      record.count++;
      
      if (record.count > maxRequests) {
        res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000).toString());
        errorResponse(res, 'Trop de requêtes, veuillez réessayer plus tard', 429, 'RATE_LIMITED');
        return;
      }
    }

    return await handler(req, res);
  };
}

export type { AuthenticatedRequest, ApiHandler };
