/**
 * @fileoverview Service Centralisé d'Authentification - Source Unique de Vérité
 * @author Senior Architect
 * @version 1.0.0
 *
 * Service pour centraliser l'accès aux données d'authentification
 * et éviter les appels directs à Supabase
 */

import { createClient } from '@supabase/supabase-js';

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
  phone?: string;
  avatar_url?: string;
  city?: string;
  postal_code?: string;
  role?: 'client' | 'professional' | 'admin' | 'super_admin';
}

interface Professional {
  id: string;
  user_id: string;
  company_name: string;
  status: 'pending' | 'verified' | 'suspended';
  specialties: string[];
  experience_years?: number;
  rating_average?: number;
}

// Initialisation Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Service centralisé d'authentification
 */
export class CentralAuthService {
  private static instance: CentralAuthService;

  static getInstance(): CentralAuthService {
    if (!CentralAuthService.instance) {
      CentralAuthService.instance = new CentralAuthService();
    }
    return CentralAuthService.instance;
  }

  /**
   * Récupérer l'utilisateur actuel depuis Supabase
   */
  async getCurrentUser(): Promise<{ user: User | null; error: any }> {
    try {
      console.log('🔍 CentralAuthService: Getting current user...');

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('❌ CentralAuthService: Session error:', error);
        return { user: null, error };
      }

      if (session?.user) {
        console.log('✅ CentralAuthService: User found:', session.user.email);
        return { user: session.user, error: null };
      }

      console.log('ℹ️ CentralAuthService: No active session');
      return { user: null, error: null };
    } catch (error) {
      console.error('❌ CentralAuthService: Exception getting user:', error);
      return { user: null, error };
    }
  }

  /**
   * Récupérer le profil de l'utilisateur
   */
  async getUserProfile(
    userId: string
  ): Promise<{ profile: Profile | null; error: any }> {
    try {
      console.log('🔍 CentralAuthService: Getting user profile for:', userId);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ CentralAuthService: Profile error:', error);
        return { profile: null, error };
      }

      console.log('✅ CentralAuthService: Profile found:', data?.full_name);
      return { profile: data, error: null };
    } catch (error) {
      console.error('❌ CentralAuthService: Exception getting profile:', error);
      return { profile: null, error };
    }
  }

  /**
   * Récupérer le profil professionnel
   */
  async getProfessionalProfile(
    userId: string
  ): Promise<{ professional: Professional | null; error: any }> {
    try {
      console.log(
        '🔍 CentralAuthService: Getting professional profile for:',
        userId
      );

      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ CentralAuthService: Professional error:', error);
        return { professional: null, error };
      }

      console.log(
        '✅ CentralAuthService: Professional found:',
        data?.company_name
      );
      return { professional: data, error: null };
    } catch (error) {
      console.error(
        '❌ CentralAuthService: Exception getting professional:',
        error
      );
      return { professional: null, error };
    }
  }

  /**
   * Déterminer le rôle de l'utilisateur
   */
  async determineUserRole(userId: string): Promise<{
    role: 'client' | 'professional' | 'admin' | 'super_admin' | null;
    error: any;
  }> {
    try {
      console.log('🔍 CentralAuthService: Determining role for user:', userId);

      // 1. Vérifier si admin en premier (priorité haute)
      const { data: adminProfile, error: adminError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', userId)
        .in('role', ['admin', 'super_admin'])
        .maybeSingle();

      if (adminError && adminError.code !== 'PGRST116') {
        console.error('❌ CentralAuthService: Admin check error:', adminError);
        return { role: null, error: adminError };
      }

      if (adminProfile?.role) {
        console.log('✅ CentralAuthService: User is', adminProfile.role);
        return {
          role: adminProfile.role as 'admin' | 'super_admin',
          error: null,
        };
      }

      // 2. Vérifier si professionnel
      const { data: professionalData, error: proError } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (proError && proError.code !== 'PGRST116') {
        console.error(
          '❌ CentralAuthService: Professional check error:',
          proError
        );
        return { role: null, error: proError };
      }

      if (professionalData) {
        console.log('✅ CentralAuthService: User is professional');
        return { role: 'professional', error: null };
      }

      // 3. Par défaut, c'est un client
      console.log('✅ CentralAuthService: User is client');
      return { role: 'client', error: null };
    } catch (error) {
      console.error(
        '❌ CentralAuthService: Exception determining role:',
        error
      );
      return { role: null, error };
    }
  }

  /**
   * Récupérer toutes les données d'authentification
   */
  async getAuthData(): Promise<{
    user: User | null;
    profile: Profile | null;
    professional: Professional | null;
    role: 'client' | 'professional' | 'admin' | 'super_admin' | null;
    error: any;
  }> {
    try {
      console.log('🔄 CentralAuthService: Getting complete auth data...');

      // 1. Récupérer l'utilisateur
      const { user, error: userError } = await this.getCurrentUser();

      if (userError) {
        return {
          user: null,
          profile: null,
          professional: null,
          role: null,
          error: userError,
        };
      }

      if (!user) {
        console.log('ℹ️ CentralAuthService: No user logged in');
        return {
          user: null,
          profile: null,
          professional: null,
          role: null,
          error: null,
        };
      }

      // 2. Récupérer le profil
      const { profile, error: profileError } = await this.getUserProfile(
        user.id
      );

      if (profileError) {
        console.warn(
          '⚠️ CentralAuthService: Profile error, continuing...',
          profileError
        );
      }

      // 3. Récupérer le profil professionnel
      const { professional, error: proError } =
        await this.getProfessionalProfile(user.id);

      if (proError) {
        console.warn(
          '⚠️ CentralAuthService: Professional error, continuing...',
          proError
        );
      }

      // 4. Déterminer le rôle
      const { role, error: roleError } = await this.determineUserRole(user.id);

      if (roleError) {
        console.warn(
          '⚠️ CentralAuthService: Role error, continuing...',
          roleError
        );
      }

      const authData = {
        user,
        profile,
        professional,
        role,
        error: null,
      };

      console.log('✅ CentralAuthService: Auth data loaded:', {
        userId: user.id,
        role: role,
        hasProfile: !!profile,
        hasProfessional: !!professional,
      });

      return authData;
    } catch (error) {
      console.error(
        '❌ CentralAuthService: Exception getting auth data:',
        error
      );
      return {
        user: null,
        profile: null,
        professional: null,
        role: null,
        error,
      };
    }
  }

  /**
   * Vérifier si l'utilisateur a un rôle spécifique
   */
  hasRole(userRole: string | null, requiredRole: string): boolean {
    if (!userRole) return false;

    // Gestion des hiérarchies de rôles
    if (
      requiredRole === 'admin' &&
      (userRole === 'admin' || userRole === 'super_admin')
    ) {
      return true;
    }

    return userRole === requiredRole;
  }

  /**
   * Vérifier si l'utilisateur est le propriétaire d'une ressource
   */
  isOwner(user: User | null, resourceUserId: string): boolean {
    if (!user) return false;
    return user.id === resourceUserId;
  }

  /**
   * Vérifier les permissions pour les ressources
   */
  checkPermissions(
    authData: {
      user: User | null;
      role: string | null;
      professional: Professional | null;
    },
    resourceUserId?: string
  ): {
    canAccessAdmin: boolean;
    canAccessProfessional: boolean;
    canAccessClient: boolean;
    canManageUsers: boolean;
    canManageProjects: boolean;
    canBidOnProjects: boolean;
    canViewAllProjects: boolean;
    isResourceOwner: boolean;
    isAuthenticated: boolean;
  } {
    const { user, role, professional } = authData;

    return {
      // Permissions de base
      canAccessAdmin: this.hasRole(role, 'admin'),
      canAccessProfessional: this.hasRole(role, 'professional'),
      canAccessClient: this.hasRole(role, 'client'),

      // Permissions étendues
      canManageUsers: this.hasRole(role, 'admin'),
      canManageProjects: role === 'client' || this.hasRole(role, 'admin'),
      canBidOnProjects: this.hasRole(role, 'professional'),
      canViewAllProjects: this.hasRole(role, 'admin'),

      // Ownership
      isResourceOwner: resourceUserId
        ? this.isOwner(user, resourceUserId)
        : false,

      // Utilisateur connecté
      isAuthenticated: !!user,
    };
  }

  /**
   * Rafraîchir les données d'authentification
   */
  async refreshAuthData(): Promise<{
    user: User | null;
    profile: Profile | null;
    professional: Professional | null;
    role: string | null;
    error: any;
  }> {
    console.log('🔄 CentralAuthService: Refreshing auth data...');

    // Forcer la rafraîchissement de la session
    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession();

    if (error) {
      console.error('❌ CentralAuthService: Refresh error:', error);
      return {
        user: null,
        profile: null,
        professional: null,
        role: null,
        error,
      };
    }

    // Récupérer les données fraîches
    return await this.getAuthData();
  }
}

export default CentralAuthService;
