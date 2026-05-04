/**
 * @fileoverview Middleware d'Authentification Backend - Sécurité des Rôles
 * @author Senior Architect
 * @version 1.0.0
 *
 * Middleware pour sécuriser les routes API avec validation des rôles
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Types
interface User {
  id: string;
  email?: string;
  created_at: string;
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role?: 'client' | 'professional' | 'admin' | 'super_admin';
}

interface Professional {
  id: string;
  user_id: string;
  company_name: string;
  status: 'pending' | 'verified' | 'suspended';
}

interface AuthResult {
  user: User | null;
  profile: Profile | null;
  professional: Professional | null;
  role: 'client' | 'professional' | 'admin' | 'super_admin' | null;
  error?: string;
}

// Initialisation Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Middleware d'authentification centralisé
 */
export class AuthMiddleware {
  /**
   * Extraire et valider le token Bearer
   */
  static extractToken(request: NextRequest): string | null {
    try {
      const authHeader = request.headers.get('authorization');

      if (!authHeader) {
        console.log('❌ AuthMiddleware: No authorization header');
        return null;
      }

      const token = authHeader.replace('Bearer ', '');

      if (!token || token.length === 0) {
        console.log('❌ AuthMiddleware: Invalid token format');
        return null;
      }

      return token;
    } catch (error) {
      console.error('❌ AuthMiddleware: Error extracting token:', error);
      return null;
    }
  }

  /**
   * Vérifier l'utilisateur via le token
   */
  static async verifyUser(
    token: string
  ): Promise<{ user: User | null; error?: string }> {
    try {
      console.log('🔍 AuthMiddleware: Verifying user token...');

      const { data: userData, error } = await supabase.auth.getUser(token);

      if (error) {
        console.error('❌ AuthMiddleware: Supabase auth error:', error);
        return { user: null, error: 'Token invalide ou expiré' };
      }

      const user = userData?.user;
      if (!user) {
        console.error('❌ AuthMiddleware: No user found for token');
        return { user: null, error: 'Utilisateur non trouvé' };
      }

      console.log('✅ AuthMiddleware: User verified:', user.email);
      return { user, error: undefined };
    } catch (error) {
      console.error('❌ AuthMiddleware: Exception verifying user:', error);
      return { user: null, error: 'Erreur système' };
    }
  }

  /**
   * Récupérer le profil de l'utilisateur
   */
  static async getUserProfile(
    userId: string
  ): Promise<{ profile: Profile | null; error?: string }> {
    try {
      console.log('🔍 AuthMiddleware: Getting user profile for:', userId);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ AuthMiddleware: Profile error:', error);
        return { profile: null, error: 'Erreur profil utilisateur' };
      }

      console.log('✅ AuthMiddleware: Profile found:', data?.full_name);
      return { profile: data, error: undefined };
    } catch (error) {
      console.error('❌ AuthMiddleware: Exception getting profile:', error);
      return { profile: null, error: 'Erreur système' };
    }
  }

  /**
   * Récupérer le profil professionnel
   */
  static async getProfessionalProfile(
    userId: string
  ): Promise<{ professional: Professional | null; error?: string }> {
    try {
      console.log(
        '🔍 AuthMiddleware: Getting professional profile for:',
        userId
      );

      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ AuthMiddleware: Professional error:', error);
        return { professional: null, error: 'Erreur profil professionnel' };
      }

      console.log('✅ AuthMiddleware: Professional found:', data?.company_name);
      return { professional: data, error: undefined };
    } catch (error) {
      console.error(
        '❌ AuthMiddleware: Exception getting professional:',
        error
      );
      return { professional: null, error: 'Erreur système' };
    }
  }

  /**
   * Déterminer le rôle de l'utilisateur
   */
  static async determineUserRole(userId: string): Promise<{
    role: 'client' | 'professional' | 'admin' | 'super_admin' | null;
    error?: string;
  }> {
    try {
      console.log('🔍 AuthMiddleware: Determining role for user:', userId);

      // 1. Vérifier si admin en premier (priorité haute)
      const { data: adminProfile, error: adminError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', userId)
        .in('role', ['admin', 'super_admin'])
        .single();

      if (adminError && adminError.code !== 'PGRST116') {
        console.error('❌ AuthMiddleware: Admin check error:', adminError);
        return { role: null, error: 'Erreur vérification rôle admin' };
      }

      if (adminProfile?.role) {
        console.log('✅ AuthMiddleware: User is', adminProfile.role);
        return {
          role: adminProfile.role as 'admin' | 'super_admin',
          error: undefined,
        };
      }

      // 2. Vérifier si professionnel
      const { data: professionalData, error: proError } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (proError && proError.code !== 'PGRST116') {
        console.error('❌ AuthMiddleware: Professional check error:', proError);
        return { role: null, error: 'Erreur vérification rôle professionnel' };
      }

      if (professionalData) {
        console.log('✅ AuthMiddleware: User is professional');
        return { role: 'professional', error: undefined };
      }

      // 3. Par défaut, c'est un client
      console.log('✅ AuthMiddleware: User is client');
      return { role: 'client', error: undefined };
    } catch (error) {
      console.error('❌ AuthMiddleware: Exception determining role:', error);
      return { role: null, error: 'Erreur système' };
    }
  }

  /**
   * Authentification complète avec récupération de toutes les données
   */
  static async authenticate(request: NextRequest): Promise<AuthResult> {
    try {
      console.log('🔐 AuthMiddleware: Starting authentication...');

      // 1. Extraire le token
      const token = this.extractToken(request);

      if (!token) {
        return {
          user: null,
          profile: null,
          professional: null,
          role: null,
          error: "Token d'authentification manquant",
        };
      }

      // 2. Vérifier l'utilisateur
      const { user, error: userError } = await this.verifyUser(token);

      if (userError || !user) {
        return {
          user: null,
          profile: null,
          professional: null,
          role: null,
          error: userError || 'Utilisateur non trouvé',
        };
      }

      // 3. Récupérer le profil
      const { profile, error: profileError } = await this.getUserProfile(
        user.id
      );

      if (profileError) {
        console.warn(
          '⚠️ AuthMiddleware: Profile error, continuing...',
          profileError
        );
      }

      // 4. Récupérer le profil professionnel
      const { professional, error: proError } =
        await this.getProfessionalProfile(user.id);

      if (proError) {
        console.warn(
          '⚠️ AuthMiddleware: Professional error, continuing...',
          proError
        );
      }

      // 5. Déterminer le rôle
      const { role, error: roleError } = await this.determineUserRole(user.id);

      if (roleError) {
        console.warn('⚠️ AuthMiddleware: Role error, continuing...', roleError);
      }

      const result: AuthResult = {
        user,
        profile,
        professional,
        role,
        error: undefined,
      };

      console.log('✅ AuthMiddleware: Authentication complete:', {
        userId: user.id,
        role: role,
        hasProfile: !!profile,
        hasProfessional: !!professional,
      });

      return result;
    } catch (error) {
      console.error(
        '❌ AuthMiddleware: Exception during authentication:',
        error
      );
      return {
        user: null,
        profile: null,
        professional: null,
        role: null,
        error: "Erreur système d'authentification",
      };
    }
  }

  /**
   * Vérifier si l'utilisateur a un rôle spécifique
   */
  static hasRole(role: string | null, requiredRole: string): boolean {
    if (!role) return false;

    // Gestion des hiérarchies de rôles
    if (
      requiredRole === 'admin' &&
      (role === 'admin' || role === 'super_admin')
    ) {
      return true;
    }

    return role === requiredRole;
  }

  /**
   * Vérifier si l'utilisateur est le propriétaire d'une ressource
   */
  static isOwner(user: User | null, resourceUserId: string): boolean {
    if (!user) return false;
    return user.id === resourceUserId;
  }

  /**
   * Vérifier si l'utilisateur peut accéder à une ressource professionnelle
   */
  static canAccessProfessional(
    authResult: AuthResult,
    resourceUserId?: string
  ): boolean {
    const { user, role, professional } = authResult;

    if (!user) return false;

    // Admin peut tout voir
    if (role === 'admin' || role === 'super_admin') {
      return true;
    }

    // Seul un professionnel peut accéder aux ressources professionnelles
    if (role !== 'professional') {
      return false;
    }

    // Vérifier l'ownership si nécessaire
    if (resourceUserId && professional) {
      return professional.user_id === resourceUserId;
    }

    return true;
  }

  /**
   * Vérifier si l'utilisateur peut accéder à une ressource client
   */
  static canAccessClient(
    authResult: AuthResult,
    resourceUserId?: string
  ): boolean {
    const { user, role } = authResult;

    if (!user) return false;

    // Admin peut tout voir
    if (role === 'admin' || role === 'super_admin') {
      return true;
    }

    // Seul un client peut accéder aux ressources client
    if (role !== 'client') {
      return false;
    }

    // Vérifier l'ownership si nécessaire
    if (resourceUserId) {
      return this.isOwner(user, resourceUserId);
    }

    return true;
  }

  /**
   * Créer une réponse d'erreur standardisée
   */
  static createErrorResponse(
    error: string,
    status: number = 401
  ): NextResponse {
    return NextResponse.json(
      {
        error: 'Authentication failed',
        message: error,
      },
      { status }
    );
  }

  /**
   * Créer une réponse d'erreur de permissions
   */
  static createPermissionError(
    message: string = 'Accès non autorisé'
  ): NextResponse {
    return NextResponse.json(
      {
        error: 'Permission denied',
        message,
      },
      { status: 403 }
    );
  }
}

export default AuthMiddleware;
