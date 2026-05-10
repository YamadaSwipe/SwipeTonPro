import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Interface pour les résultats du diagnostic
interface DiagnosticResults {
  timestamp: string;
  environment: string;
  supabase: {
    url: string;
    hasAnonKey: boolean;
    hasServiceKey: boolean;
  };
  users: any;
  admin: {
    exists: boolean;
    profile: any;
    error: string | null;
    authUser: any;
    signInTest?: any;
  };
  issues: any[];
  environment?: any;
  health?: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    console.log('🔍 Début diagnostic authentification...');

    const results: DiagnosticResults = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
      users: {},
      admin: {
        exists: false,
        profile: null,
        error: null,
        authUser: null,
      },
      issues: [],
    };

    // 1. Vérifier les comptes utilisateurs
    console.log('👥 Vérification comptes utilisateurs...');
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select(
        'id, email, role, created_at, last_sign_in_at, email_confirmed_at'
      )
      .order('created_at', { ascending: false })
      .limit(10);

    if (profilesError) {
      results.issues.push({
        type: 'PROFILES_ERROR',
        message: profilesError.message,
        severity: 'HIGH',
      });
    } else {
      results.users = {
        total: profiles?.length || 0,
        recent: profiles?.slice(0, 5) || [],
        unconfirmed: profiles?.filter((p) => !p.email_confirmed_at).length || 0,
        byRole:
          profiles?.reduce((acc: any, user) => {
            acc[user.role || 'unknown'] =
              (acc[user.role || 'unknown'] || 0) + 1;
            return acc;
          }, {}) || {},
      };
    }

    // 2. Vérifier le compte admin
    console.log('🔐 Vérification compte admin...');
    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', 'admin@swipetonpro.fr')
      .single();

    if (adminError && adminError.code !== 'PGRST116') {
      results.issues.push({
        type: 'ADMIN_ERROR',
        message: adminError.message,
        severity: 'HIGH',
      });
    }

    results.admin.exists = !!adminProfile;
    results.admin.profile = adminProfile
      ? {
          id: adminProfile.id,
          email: adminProfile.email,
          role: adminProfile.role,
          created_at: adminProfile.created_at,
          last_sign_in_at: adminProfile.last_sign_in_at,
          email_confirmed_at: adminProfile.email_confirmed_at,
        }
      : null;
    results.admin.error = adminError?.message || null;

    // 3. Vérifier les utilisateurs auth.users (Supabase Auth)
    console.log('🔑 Vérification auth.users...');
    try {
      const { data: authUsers, error: authError } =
        await supabaseAdmin.auth.admin.listUsers();

      if (authError) {
        results.issues.push({
          type: 'AUTH_USERS_ERROR',
          message: authError.message,
          severity: 'HIGH',
        });
      } else if (authUsers && authUsers.users) {
        const adminAuthUser = authUsers.users.find(
          (u: any) => u.email === 'admin@swipetonpro.fr'
        );
        const bgreenAuthUser = authUsers.users.find(
          (u: any) => u.email === 'bgreen.rs@gmail.com'
        );

        results.admin.authUser = adminAuthUser
          ? {
              id: adminAuthUser.id,
              email: adminAuthUser.email,
              email_confirmed: adminAuthUser.email_confirmed_at,
              last_sign_in: adminAuthUser.last_sign_in_at,
              created_at: adminAuthUser.created_at,
              user_metadata: adminAuthUser.user_metadata,
            }
          : null;

        results.users.authUsers = {
          total: authUsers.users.length,
          admin: adminAuthUser ? 'found' : 'not_found',
          bgreen: bgreenAuthUser
            ? {
                id: bgreenAuthUser.id,
                email: bgreenAuthUser.email,
                email_confirmed: bgreenAuthUser.email_confirmed_at,
                last_sign_in: bgreenAuthUser.last_sign_in_at,
                created_at: bgreenAuthUser.created_at,
              }
            : 'not_found',
        };
      }
    } catch (listUsersError: any) {
      results.issues.push({
        type: 'LIST_USERS_ERROR',
        message: listUsersError.message,
        severity: 'HIGH',
      });
    }

    // 4. Tester la connexion admin
    console.log('🧪 Test connexion admin...');
    try {
      const { data: adminSignIn, error: adminSignInError } =
        await supabaseAdmin.auth.signInWithPassword({
          email: 'admin@swipetonpro.fr',
          password: process.env.ADMIN_SECURE_PASSWORD || 'Admin1980',
        });

      results.admin.signInTest = {
        success: !adminSignInError,
        error: adminSignInError?.message || null,
        user: adminSignIn?.user
          ? {
              id: adminSignIn.user.id,
              email: adminSignIn.user.email,
            }
          : null,
      };

      if (adminSignIn?.session) {
        await supabaseAdmin.auth.signOut();
      }
    } catch (adminTestError: any) {
      results.issues.push({
        type: 'ADMIN_SIGNIN_ERROR',
        message: adminTestError.message,
        severity: 'CRITICAL',
      });
    }

    // 5. Tester la connexion bgreen.rs@gmail.com
    console.log('🧪 Test connexion bgreen.rs@gmail.com...');
    try {
      const { data: bgreenSignIn, error: bgreenSignInError } =
        await supabaseAdmin.auth.signInWithPassword({
          email: 'bgreen.rs@gmail.com',
          password: 'Test1234!', // Mot de passe de test courant
        });

      results.users.bgreenTest = {
        success: !bgreenSignInError,
        error: bgreenSignInError?.message || null,
        user: bgreenSignIn?.user
          ? {
              id: bgreenSignIn.user.id,
              email: bgreenSignIn.user.email,
            }
          : null,
      };

      if (bgreenSignIn?.session) {
        await supabaseAdmin.auth.signOut();
      }
    } catch (bgreenTestError: any) {
      results.issues.push({
        type: 'BGREEN_SIGNIN_ERROR',
        message: bgreenTestError.message,
        severity: 'HIGH',
      });
    }

    // 6. Vérifier les variables d'environnement
    console.log('🌍 Vérification environnement...');
    results.environment = {
      NODE_ENV: process.env.NODE_ENV,
      hasAdminPassword: !!process.env.ADMIN_SECURE_PASSWORD,
      adminPasswordLength: process.env.ADMIN_SECURE_PASSWORD?.length || 0,
      NEXT_PUBLIC_SUPABASE_URL:
        process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
      hasSupabaseKeys: !!(
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        process.env.SUPABASE_SERVICE_ROLE_KEY
      ),
    };

    // 7. Calculer le score de santé
    const issues = results.issues;
    const criticalIssues = issues.filter(
      (i) => i.severity === 'CRITICAL'
    ).length;
    const highIssues = issues.filter((i) => i.severity === 'HIGH').length;

    results.health = {
      score: Math.max(0, 100 - criticalIssues * 30 - highIssues * 15),
      status:
        criticalIssues > 0
          ? 'CRITICAL'
          : highIssues > 0
            ? 'WARNING'
            : 'HEALTHY',
      issuesCount: issues.length,
      criticalIssues,
      highIssues,
    };

    console.log('✅ Diagnostic authentification terminé');

    return res.status(200).json({
      success: true,
      results,
    });
  } catch (error: any) {
    console.error('❌ Erreur diagnostic authentification:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      message: error.message,
    });
  }
}
