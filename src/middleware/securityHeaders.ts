import { NextApiRequest, NextApiResponse } from 'next';

export function addSecurityHeaders(req: NextApiRequest, res: NextApiResponse, next: () => void) {
  // Headers de sécurité OWASP
  const headers = {
    // Protection contre le clickjacking
    'X-Frame-Options': 'DENY',
    
    // Protection contre le MIME sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Protection XSS
    'X-XSS-Protection': '1; mode=block',
    
    // Politique de sécurité de contenu
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.stripe.com https://*.supabase.co",
      "frame-src 'self' https://js.stripe.com https://checkout.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; '),
    
    // HSTS (HTTPS Strict Transport Security)
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    
    // Politique de référent
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions policy
    'Permissions-Policy': [
      'geolocation=()',
      'microphone=()',
      'camera=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()',
      'ambient-light-sensor=()',
      'autoplay=()',
      'encrypted-media=()',
      'fullscreen=()',
      'picture-in-picture=()'
    ].join(', '),
    
    // Cache control pour les endpoints sensibles
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };

  // Appliquer les headers
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Headers CORS si nécessaire
  if (req.headers.origin) {
    const allowedOrigins = [
      'https://www.swipetonpro.fr',
      'https://swipetonpro.fr',
      'http://localhost:3000'
    ];
    
    if (allowedOrigins.includes(req.headers.origin)) {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', '86400'); // 24 heures
    }
  }

  next();
}

// Validation email stricte (RFC 5322)
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!emailRegex.test(email)) {
    return false;
  }

  // Vérifications supplémentaires
  const [localPart, domain] = email.split('@');
  
  // Partie locale : max 64 caractères
  if (localPart.length > 64) {
    return false;
  }
  
  // Domaine : max 253 caractères
  if (domain.length > 253) {
    return false;
  }
  
  // Pas de points consécutifs
  if (email.includes('..')) {
    return false;
  }
  
  // Pas de points au début ou à la fin
  if (email.startsWith('.') || email.endsWith('.')) {
    return false;
  }
  
  // Domaine doit avoir au moins un point
  if (!domain.includes('.')) {
    return false;
  }
  
  return true;
}

// Validation téléphone international (E.164)
export function validatePhone(phone: string): boolean {
  // Format E.164: +[code pays][numéro] (max 15 chiffres)
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
}

// Validation SIRET (France)
export function validateSIRET(siret: string): boolean {
  // SIRET : 14 chiffres
  const siretRegex = /^\d{14}$/;
  if (!siretRegex.test(siret)) {
    return false;
  }
  
  // Algorithme de Luhn pour la validation
  let sum = 0;
  let alternate = false;
  
  for (let i = siret.length - 1; i >= 0; i--) {
    let digit = parseInt(siret[i], 10);
    
    if (alternate) {
      digit *= 2;
      if (digit > 9) {
        digit = (digit % 10) + 1;
      }
    }
    
    sum += digit;
    alternate = !alternate;
  }
  
  return sum % 10 === 0;
}

// Validation montant (protection contre les montants arbitraires)
export function validateAmount(amount: number | string, maxAmount: number = 100000): boolean {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return false;
  }
  
  if (numAmount <= 0) {
    return false;
  }
  
  if (numAmount > maxAmount) {
    return false;
  }
  
  // Pas plus de 2 décimales
  if (numAmount * 100 !== Math.round(numAmount * 100)) {
    return false;
  }
  
  return true;
}

// Sanitisation des entrées
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>]/g, '') // Remove remaining brackets
    .substring(0, 1000); // Limit length
}

export default {
  addSecurityHeaders,
  validateEmail,
  validatePhone,
  validateSIRET,
  validateAmount,
  sanitizeInput
};
