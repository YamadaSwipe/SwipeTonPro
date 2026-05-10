import { NextApiRequest, NextApiResponse } from 'next';

// Stockage en mémoire pour le rate limiting (en production, utiliser Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitOptions {
  windowMs: number; // Fenêtre de temps en ms
  maxRequests: number; // Nombre max de requêtes
  message?: string;
  skipSuccessfulRequests?: boolean;
}

export function createRateLimit(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    message = 'Trop de requêtes, veuillez réessayer plus tard',
    skipSuccessfulRequests = false
  } = options;

  return function rateLimit(req: NextApiRequest, res: NextApiResponse, next: () => void) {
    // Obtenir l'IP du client
    const ip = req.headers['x-forwarded-for'] as string || 
               req.headers['x-real-ip'] as string || 
               req.connection?.remoteAddress || 
               req.socket?.remoteAddress || 
               'unknown';

    const key = `${ip}:${req.url || req.path}`;
    const now = Date.now();

    // Nettoyer les anciennes entrées
    for (const [storeKey, data] of rateLimitStore.entries()) {
      if (now > data.resetTime) {
        rateLimitStore.delete(storeKey);
      }
    }

    // Vérifier le rate limit
    const record = rateLimitStore.get(key);
    
    if (!record) {
      // Première requête
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    if (now > record.resetTime) {
      // Fenêtre expirée, réinitialiser
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }

    // Vérifier si la limite est dépassée
    if (record.count >= maxRequests) {
      const resetIn = Math.ceil((record.resetTime - now) / 1000);
      
      return res.status(429).json({
        error: message,
        retryAfter: resetIn,
        limit: maxRequests,
        windowMs,
        remaining: 0
      });
    }

    // Incrémenter le compteur
    record.count++;

    // Ajouter les headers de rate limiting
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

    next();
  };
}

// Rate limiting spécifique pour le login
export const loginRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 tentatives de login
  message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.'
});

// Rate limiting pour les créations de compte
export const signupRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  maxRequests: 3, // 3 créations de compte par heure
  message: 'Trop de créations de compte. Veuillez réessayer dans 1 heure.'
});

// Rate limiting pour les reset password
export const resetPasswordRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  maxRequests: 3, // 3 demandes de reset par heure
  message: 'Trop de demandes de réinitialisation. Veuillez réessayer dans 1 heure.'
});

// Rate limiting général pour les API
export const apiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requêtes par 15 minutes
  message: 'Trop de requêtes. Veuillez ralentir.'
});
