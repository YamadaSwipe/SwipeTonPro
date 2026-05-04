/**
 * @fileoverview Middleware de Sécurité pour les Notifications
 * @author Senior Security Architect
 * @version 1.0.0
 *
 * Protège les endpoints de notification contre les abus
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Types de notifications autorisées
const ALLOWED_NOTIFICATION_TYPES = [
  'professional_interested',
  'project_accepted',
  'new_project_admin',
  'new_professional_admin',
  'match_completed',
  'project_validated',
  'project_rejected',
];

// Rate limiting configuration
const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // Max 10 notifications par minute
};

// Stockage en mémoire pour le rate limiting (en production, utiliser Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Vérifier le rate limiting
 */
function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const key = `notification_${identifier}`;
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT.windowMs,
    });
    return true;
  }

  if (record.count >= RATE_LIMIT.maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Valider les données de notification
 */
function validateNotificationData(data: any): {
  valid: boolean;
  error?: string;
} {
  if (!data.type || !data.recipients) {
    return { valid: false, error: 'Type et recipients requis' };
  }

  if (!ALLOWED_NOTIFICATION_TYPES.includes(data.type)) {
    return { valid: false, error: `Type non autorisé: ${data.type}` };
  }

  if (!Array.isArray(data.recipients) || data.recipients.length === 0) {
    return { valid: false, error: 'Recipients invalide' };
  }

  // Valider les emails
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  for (const email of data.recipients) {
    if (!emailRegex.test(email)) {
      return { valid: false, error: `Email invalide: ${email}` };
    }
  }

  return { valid: true };
}

// Initialisation Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Middleware principal pour les notifications sécurisées
 */
export async function secureNotificationMiddleware(req: NextRequest) {
  try {
    // Vérifier la méthode HTTP
    if (req.method !== 'POST') {
      return NextResponse.json(
        { error: 'Méthode non autorisée' },
        { status: 405 }
      );
    }

    // Parse request body
    let body = null;
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    // Vérifier l'authentification via Supabase
    const authHeader = req.headers.get('authorization');
    let user = null;
    let userId = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data } = await supabase.auth.getUser(token);
      user = data.user;
      userId = user?.id;
    }

    const sensitiveTypes = [
      'professional_interested',
      'project_accepted',
      'match_completed',
    ];

    if (sensitiveTypes.includes(body?.type) && !user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    // Rate limiting par IP
    const clientIP =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'Trop de requêtes - Veuillez réessayer plus tard' },
        { status: 429 }
      );
    }

    // Rate limiting par utilisateur si authentifié
    if (userId && !checkRateLimit(userId)) {
      return NextResponse.json(
        { error: 'Trop de notifications - Veuillez réessayer plus tard' },
        { status: 429 }
      );
    }

    // Valider les données
    const validation = validateNotificationData(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Ajouter des headers de sécurité
    const response = NextResponse.next();
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;
  } catch (error) {
    console.error('❌ Erreur middleware notification:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * Wrapper pour sécuriser les handlers de notification
 */
export function withSecureNotification(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const middlewareResult = await secureNotificationMiddleware(req);

    // Si le middleware bloque la requête
    if (middlewareResult.status !== 200) {
      return middlewareResult;
    }

    // Sinon, exécuter le handler
    return handler(req);
  };
}
