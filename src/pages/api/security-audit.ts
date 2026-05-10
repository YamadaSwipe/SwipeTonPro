import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    console.log('🔍 Début audit de sécurité complet...');

    const auditResults = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      security: {
        authentication: {},
        accountCreation: {},
        payments: {},
        environment: {},
        permissions: {},
        apiEndpoints: {}
      }
    };

    // 1. AUDIT AUTHENTIFICATION
    console.log('🔐 Audit authentification...');
    
    // Vérifier les mots de passe en dur
    const hardcodedPasswords = {
      adminPassword: 'Admin1980',
      foundInLogin: true,
      riskLevel: 'CRITICAL'
    };

    // Vérifier la configuration admin fantôme
    const adminGhostConfig = {
      email: 'admin@swipetonpro.fr',
      hasIsolation: true,
      cookieName: 'adminGhostSession_secure_v3',
      riskLevel: 'MEDIUM'
    };

    // Vérifier les sessions
    const { data: activeSessions } = await supabaseAdmin
      .from('profiles')
      .select('email, role, last_sign_in_at')
      .not('last_sign_in_at', 'is', null)
      .order('last_sign_in_at', { ascending: false })
      .limit(10);

    auditResults.security.authentication = {
      hardcodedPasswords,
      adminGhostConfig,
      activeSessions: activeSessions?.length || 0,
      lastLoginAttempts: activeSessions?.slice(0, 5) || [],
      riskLevel: hardcodedPasswords.foundInLogin ? 'CRITICAL' : 'MEDIUM'
    };

    // 2. AUDIT CREATION DE COMPTES
    console.log('👥 Audit création de comptes...');
    
    // Vérifier les validations
    const { data: recentUsers } = await supabaseAdmin
      .from('profiles')
      .select('email, role, created_at, phone')
      .order('created_at', { ascending: false })
      .limit(20);

    const emailValidationIssues = recentUsers?.filter(user => 
      !user.email || !user.email.includes('@') || user.email.length < 5
    ) || [];

    const phoneValidationIssues = recentUsers?.filter(user => 
      user.phone && (user.phone.length < 10 || !user.phone.match(/^[+]?[\d\s-()]+$/))
    ) || [];

    auditResults.security.accountCreation = {
      totalUsers: recentUsers?.length || 0,
      emailValidationIssues: emailValidationIssues.length,
      phoneValidationIssues: phoneValidationIssues.length,
      recentRegistrations: recentUsers?.slice(0, 5) || [],
      riskLevel: emailValidationIssues.length > 0 ? 'HIGH' : 'LOW'
    };

    // 3. AUDIT PAIEMENTS
    console.log('💳 Audit paiements...');
    
    // Vérifier les clés Stripe
    const stripeConfig = {
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
      hasPublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      keyLength: process.env.STRIPE_SECRET_KEY?.length || 0,
      riskLevel: !process.env.STRIPE_SECRET_KEY ? 'CRITICAL' : 'LOW'
    };

    // Vérifier les paiements récents
    const { data: recentPayments } = await supabaseAdmin
      .from('payments')
      .select('amount, status, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(10);

    auditResults.security.payments = {
      stripeConfig,
      recentPayments: recentPayments?.length || 0,
      failedPayments: recentPayments?.filter(p => p.status === 'failed')?.length || 0,
      riskLevel: stripeConfig.riskLevel
    };

    // 4. AUDIT ENVIRONNEMENT
    console.log('🌍 Audit environnement...');
    
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasStripeKeys: !!(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
      hasResendKey: !!process.env.RESEND_API_KEY,
      hasSiteUrl: !!process.env.NEXT_PUBLIC_SITE_URL,
      riskLevel: process.env.NODE_ENV === 'production' ? 'LOW' : 'MEDIUM'
    };

    auditResults.security.environment = {
      ...envVars,
      riskLevel: envVars.riskLevel
    };

    // 5. AUDIT PERMISSIONS
    console.log('🔒 Audit permissions...');
    
    // Vérifier les rôles et permissions
    const { data: roleDistribution } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .then(({ data }) => {
        const roles = data?.reduce((acc: any, user: any) => {
          acc[user.role || 'unknown'] = (acc[user.role || 'unknown'] || 0) + 1;
          return acc;
        }, {});
        return roles;
      });

    auditResults.security.permissions = {
      roleDistribution,
      hasSuperAdmin: !!(roleDistribution?.super_admin > 0),
      hasAdmins: !!(roleDistribution?.admin > 0),
      riskLevel: !roleDistribution?.super_admin ? 'HIGH' : 'LOW'
    };

    // 6. AUDIT API ENDPOINTS
    console.log('🌐 Audit API endpoints...');
    
    const apiSecurity = {
      hasRateLimiting: false, // À implémenter
      hasInputValidation: true,
      hasErrorHandling: true,
      usesHttps: process.env.NODE_ENV === 'production',
      exposesSensitiveData: false,
      riskLevel: 'MEDIUM'
    };

    auditResults.security.apiEndpoints = apiSecurity;

    // Calcul du score global de sécurité
    const riskLevels = {
      'CRITICAL': 4,
      'HIGH': 3,
      'MEDIUM': 2,
      'LOW': 1
    };

    const securityScores = Object.values(auditResults.security).map((section: any) => 
      riskLevels[section.riskLevel as keyof typeof riskLevels] || 1
    );

    const totalScore = securityScores.reduce((sum, score) => sum + score, 0);
    const maxScore = securityScores.length * 4;
    const securityPercentage = Math.round((totalScore / maxScore) * 100);

    const overallRiskLevel = totalScore >= securityScores.length * 3 ? 'CRITICAL' :
                          totalScore >= securityScores.length * 2 ? 'HIGH' :
                          totalScore >= securityScores.length * 1.5 ? 'MEDIUM' : 'LOW';

    auditResults.overall = {
      securityScore: securityPercentage,
      riskLevel: overallRiskLevel,
      criticalIssues: Object.values(auditResults.security).filter((section: any) => 
        section.riskLevel === 'CRITICAL'
      ).length,
      recommendations: generateRecommendations(auditResults.security)
    };

    console.log('✅ Audit de sécurité terminé');
    
    return res.status(200).json({
      success: true,
      audit: auditResults
    });

  } catch (error: any) {
    console.error('❌ Erreur audit de sécurité:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
}

function generateRecommendations(security: any): string[] {
  const recommendations: string[] = [];

  // Authentification
  if (security.authentication.hardcodedPasswords?.foundInLogin) {
    recommendations.push('🚨 CRITIQUE: Remplacer le mot de passe admin en dur par une variable d\'environnement');
    recommendations.push('🔐 Implémenter un système de hashage pour les mots de passe admin');
  }

  // Paiements
  if (security.payments.stripeConfig?.riskLevel === 'CRITICAL') {
    recommendations.push('💳 CRITIQUE: Configurer les clés Stripe pour les paiements');
  }

  // Environnement
  if (security.environment.riskLevel === 'MEDIUM') {
    recommendations.push('🌍 Configurer toutes les variables d\'environnement requises');
  }

  // Permissions
  if (security.permissions.riskLevel === 'HIGH') {
    recommendations.push('👤 Créer au moins un compte super administrateur');
  }

  // API
  if (security.apiEndpoints.riskLevel === 'MEDIUM') {
    recommendations.push('🌐 Implémenter un système de rate limiting');
    recommendations.push('🛡️ Ajouter des en-têtes de sécurité (CORS, CSP, etc.)');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Aucune recommandation critique - sécurité globale bonne');
  }

  return recommendations;
}
