import { NextApiRequest, NextApiResponse } from 'next';

// Interface pour les événements de sécurité
interface SecurityEvent {
  timestamp: string;
  ip: string;
  userAgent?: string;
  method: string;
  url: string;
  type: 'LOGIN_ATTEMPT' | 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'SIGNUP_ATTEMPT' | 'PAYMENT_ATTEMPT' | 'SUSPICIOUS_ACTIVITY';
  details: any;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// Stockage en mémoire des événements (en production, utiliser une base de données)
const securityEvents: SecurityEvent[] = [];
const MAX_EVENTS = 1000; // Limiter la mémoire

// Fonction pour logger les événements de sécurité
export function logSecurityEvent(
  req: NextApiRequest,
  type: SecurityEvent['type'],
  details: any,
  riskLevel: SecurityEvent['riskLevel'] = 'LOW'
) {
  const event: SecurityEvent = {
    timestamp: new Date().toISOString(),
    ip: getClientIP(req),
    userAgent: req.headers['user-agent'],
    method: req.method || 'UNKNOWN',
    url: req.url || req.path || 'UNKNOWN',
    type,
    details,
    riskLevel
  };

  // Ajouter l'événement
  securityEvents.push(event);

  // Limiter la taille du stockage
  if (securityEvents.length > MAX_EVENTS) {
    securityEvents.shift();
  }

  // Logger en console
  const logLevel = riskLevel === 'CRITICAL' ? 'error' : 
                  riskLevel === 'HIGH' ? 'warn' : 
                  riskLevel === 'MEDIUM' ? 'info' : 'log';
  
  console[logLevel](`🔒 Security [${riskLevel}] ${type}:`, {
    ip: event.ip,
    url: event.url,
    details: event.details
  });

  // Alertes pour les événements critiques
  if (riskLevel === 'CRITICAL') {
    // Envoyer une alerte (email, Slack, etc.)
    sendSecurityAlert(event);
  }
}

// Obtenir l'IP du client
function getClientIP(req: NextApiRequest): string {
  return req.headers['x-forwarded-for'] as string || 
         req.headers['x-real-ip'] as string || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         'unknown';
}

// Envoyer une alerte de sécurité
async function sendSecurityAlert(event: SecurityEvent) {
  try {
    // Implémenter l'envoi d'alerte (email, Slack, etc.)
    console.error('🚨 CRITICAL SECURITY ALERT:', event);
    
    // TODO: Intégrer avec un service d'alerte
    // - Email via Resend
    // - Webhook Slack
    // - SMS pour les alertes critiques
    
  } catch (error) {
    console.error('❌ Failed to send security alert:', error);
  }
}

// Middleware de monitoring de sécurité
export function securityMonitoring(req: NextApiRequest, res: NextApiResponse, next: () => void) {
  // Logger toutes les requêtes API
  if (req.url?.startsWith('/api/')) {
    logSecurityEvent(req, 'LOGIN_ATTEMPT', {
      endpoint: req.url,
      method: req.method
    }, 'LOW');
  }

  // Détecter les activités suspectes
  detectSuspiciousActivity(req);

  next();
}

// Détection d'activités suspectes
function detectSuspiciousActivity(req: NextApiRequest) {
  const ip = getClientIP(req);
  const userAgent = req.headers['user-agent'] || '';
  
  // Vérifier les user agents suspects
  const suspiciousUserAgents = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i
  ];
  
  if (suspiciousUserAgents.some(pattern => pattern.test(userAgent))) {
    logSecurityEvent(req, 'SUSPICIOUS_ACTIVITY', {
      reason: 'Suspicious user agent',
      userAgent
    }, 'MEDIUM');
  }

  // Vérifier les requêtes anormales
  if (req.method === 'POST' && !req.headers['content-type']?.includes('application/json')) {
    logSecurityEvent(req, 'SUSPICIOUS_ACTIVITY', {
      reason: 'POST without JSON content type',
      contentType: req.headers['content-type']
    }, 'MEDIUM');
  }

  // Vérifier les tentatives d'injection SQL
  const sqlInjectionPatterns = [
    /union\s+select/i,
    /drop\s+table/i,
    /insert\s+into/i,
    /delete\s+from/i,
    /update\s+set/i
  ];

  const requestBody = JSON.stringify(req.body);
  if (sqlInjectionPatterns.some(pattern => pattern.test(requestBody))) {
    logSecurityEvent(req, 'SUSPICIOUS_ACTIVITY', {
      reason: 'Potential SQL injection',
      body: requestBody.substring(0, 200) // Limiter la taille
    }, 'HIGH');
  }
}

// Obtenir les événements de sécurité récents
export function getRecentEvents(limit: number = 50, riskLevel?: SecurityEvent['riskLevel']): SecurityEvent[] {
  let events = [...securityEvents].reverse(); // Plus récents d'abord
  
  if (riskLevel) {
    events = events.filter(event => event.riskLevel === riskLevel);
  }
  
  return events.slice(0, limit);
}

// Obtenir les statistiques de sécurité
export function getSecurityStats() {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last1h = new Date(now.getTime() - 60 * 60 * 1000);
  
  const eventsLast24h = securityEvents.filter(event => new Date(event.timestamp) > last24h);
  const eventsLast1h = securityEvents.filter(event => new Date(event.timestamp) > last1h);
  
  const riskDistribution = {
    LOW: eventsLast24h.filter(e => e.riskLevel === 'LOW').length,
    MEDIUM: eventsLast24h.filter(e => e.riskLevel === 'MEDIUM').length,
    HIGH: eventsLast24h.filter(e => e.riskLevel === 'HIGH').length,
    CRITICAL: eventsLast24h.filter(e => e.riskLevel === 'CRITICAL').length
  };
  
  const typeDistribution = eventsLast24h.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topIPs = eventsLast24h.reduce((acc, event) => {
    if (event.ip !== 'unknown') {
      acc[event.ip] = (acc[event.ip] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  
  return {
    totalEvents: securityEvents.length,
    eventsLast24h: eventsLast24h.length,
    eventsLast1h: eventsLast1h.length,
    riskDistribution,
    typeDistribution,
    topIPs: Object.entries(topIPs)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count })),
    criticalEvents: securityEvents.filter(e => e.riskLevel === 'CRITICAL').length,
    lastCriticalEvent: securityEvents.filter(e => e.riskLevel === 'CRITICAL')[0]?.timestamp || null
  };
}

// Nettoyer les anciens événements
export function cleanupOldEvents(maxAge: number = 7 * 24 * 60 * 60 * 1000) { // 7 jours par défaut
  const cutoff = new Date(Date.now() - maxAge);
  const initialLength = securityEvents.length;
  
  for (let i = securityEvents.length - 1; i >= 0; i--) {
    if (new Date(securityEvents[i].timestamp) < cutoff) {
      securityEvents.splice(i, 1);
    }
  }
  
  const cleaned = initialLength - securityEvents.length;
  if (cleaned > 0) {
    console.log(`🧹 Cleaned ${cleaned} old security events`);
  }
}

// Nettoyage automatique toutes les heures
setInterval(cleanupOldEvents, 60 * 60 * 1000);

export default {
  logSecurityEvent,
  securityMonitoring,
  getRecentEvents,
  getSecurityStats,
  cleanupOldEvents
};
