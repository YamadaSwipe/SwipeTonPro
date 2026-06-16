import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { createClient } from '@supabase/supabase-js';
import { errorResponse } from '@/utils/apiResponse';

// Create admin client for role checking (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
}

type ApiHandler = (
  req: AuthenticatedRequest,
  res: NextApiResponse
) => Promise<void> | void;

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
        errorResponse(
          res,
          "Token d'authentification manquant",
          401,
          'MISSING_TOKEN'
        );
        return;
      }

      const token = authHeader.substring(7);

      if (!token) {
        errorResponse(res, 'Token invalide', 401, 'INVALID_TOKEN');
        return;
      }

      // Vérifier le token avec Supabase
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        console.error('❌ Auth error:', error);
        errorResponse(res, 'Token invalide ou expiré', 401, 'INVALID_TOKEN');
        return;
      }

      // Récupérer le profil utilisateur pour le rôle (avec admin client pour bypass RLS)
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // Ajouter l'utilisateur à la requête
      req.user = {
        id: user.id,
        email: user.email,
        role: profile?.role || 'client',
      };

      // Appeler le handler
      return await handler(req, res);
    } catch (error) {
      console.error('❌ Erreur middleware auth:', error);
      errorResponse(res, "Erreur d'authentification", 500, 'AUTH_ERROR');
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
          const {
            data: { user },
          } = await supabase.auth.getUser(token);

          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', user.id)
              .single();

            req.user = {
              id: user.id,
              email: user.email,
              role: profile?.role || 'client',
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
 * Middleware avec vérification de rôle admin/staff
 * Accepte: admin, super_admin, support, moderator
 */
export function withAdminAuth(handler: ApiHandler): ApiHandler {
  return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const allowedRoles = ['admin', 'super_admin', 'support', 'moderator'];
    
    if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
      errorResponse(
        res, 
        'Accès réservé aux administrateurs, modérateurs et support', 
        403, 
        'FORBIDDEN'
      );
      return;
    }

    return await handler(req, res);
  });
}

/**
 * Middleware strict pour super_admin uniquement
 * À utiliser pour les opérations critiques (suppression, configuration système)
 */
export function withSuperAdminAuth(handler: ApiHandler): ApiHandler {
  return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
    if (req.user?.role !== 'super_admin') {
      errorResponse(
        res, 
        'Accès réservé aux super administrateurs uniquement', 
        403, 
        'FORBIDDEN'
      );
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
    const ip =
      req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const key = `${ip}:${req.url}`;
    const now = Date.now();

    const record = requests.get(key);

    if (!record || now > record.resetTime) {
      // Premier appel ou fenêtre expirée
      requests.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
    } else {
      record.count++;

      if (record.count > maxRequests) {
        res.setHeader(
          'Retry-After',
          Math.ceil((record.resetTime - now) / 1000).toString()
        );
        errorResponse(
          res,
          'Trop de requêtes, veuillez réessayer plus tard',
          429,
          'RATE_LIMITED'
        );
        return;
      }
    }

    return await handler(req, res);
  };
}

export type { AuthenticatedRequest, ApiHandler };
