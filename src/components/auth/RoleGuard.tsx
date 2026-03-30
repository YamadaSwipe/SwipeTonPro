/**
 * @fileoverview Composant de protection des routes par rôle
 * @author Senior Architect
 * @version 2.0.0
 *
 * Composants pour sécuriser l'accès aux pages selon les rôles
 * - Protection SSR intégrée
 * - Optimisation des re-renders avec useMemo
 * - Logs de débogage uniquement en développement
 * - Logique de redirection unifiée
 */

import React, { ReactNode, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
  fallback?: ReactNode;
}

/**
 * Composant pour protéger l'accès selon les rôles
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  redirectTo = '/auth/login',
  fallback,
}) => {
  // Protection SSR : si côté serveur, retourner fallback ou loading
  if (typeof window === 'undefined') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('🚪 RoleGuard: SSR detected, returning fallback');
    }
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  const { user, role, loading, initialized } = useAuth();
  const router = useRouter();

  // Mémoiser la vérification d'autorisation pour optimiser les re-renders
  const isAuthorized = useMemo(() => {
    return user && role && allowedRoles.includes(role);
  }, [user, role, allowedRoles]);

  // Mémoiser l'état de chargement
  const isLoading = useMemo(() => {
    return loading || !initialized;
  }, [loading, initialized]);

  useEffect(() => {
    // Ne rien faire pendant le chargement
    if (isLoading) return;

    // Si pas d'utilisateur, rediriger vers login
    if (!user) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('🚪 RoleGuard: No user, redirecting to login');
      }
      router.push(redirectTo);
      return;
    }

    // Si rôle non autorisé, rediriger selon le rôle actuel
    if (!isAuthorized) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('🚪 RoleGuard: Role not authorized', {
          userRole: role,
          allowedRoles,
        });
      }

      // Redirection intelligente selon le rôle
      const redirectMap = {
        admin: '/admin/dashboard',
        super_admin: '/admin/dashboard',
        professional: '/professionnel/dashboard',
        client: '/particulier/dashboard',
      };

      const targetRoute =
        redirectMap[role as keyof typeof redirectMap] || redirectTo;
      router.push(targetRoute);
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ RoleGuard: Access granted', { userRole: role });
    }
  }, [user, role, isLoading, isAuthorized, allowedRoles, redirectTo, router]);

  // Afficher le loader pendant le chargement
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification des autorisations...</p>
        </div>
      </div>
    );
  }

  // Afficher le fallback si fourni et accès non autorisé
  if (!isAuthorized) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Accès non autorisé
          </h1>
          <p className="text-gray-600 mb-4">
            Vous n'avez pas les permissions nécessaires pour accéder à cette
            page.
          </p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  // Afficher les enfants si accès autorisé
  return <>{children}</>;
};

/**
 * Composant spécifique pour les pages admin
 */
export const AdminGuard: React.FC<{ children: ReactNode }> = ({ children }) => (
  <RoleGuard allowedRoles={['admin', 'super_admin']} redirectTo="/auth/login">
    {children}
  </RoleGuard>
);

/**
 * Composant spécifique pour les pages professionnelles
 */
export const ProfessionalGuard: React.FC<{ children: ReactNode }> = ({
  children,
}) => (
  <RoleGuard allowedRoles={['professional']} redirectTo="/auth/login">
    {children}
  </RoleGuard>
);

/**
 * Composant spécifique pour les pages clients
 */
export const ClientGuard: React.FC<{ children: ReactNode }> = ({
  children,
}) => (
  <RoleGuard allowedRoles={['client']} redirectTo="/auth/login">
    {children}
  </RoleGuard>
);

/**
 * Composant pour les pages accessibles à plusieurs rôles
 */
export const MultiRoleGuard: React.FC<{
  children: ReactNode;
  roles: string[];
}> = ({ children, roles }) => (
  <RoleGuard allowedRoles={roles} redirectTo="/auth/login">
    {children}
  </RoleGuard>
);

/**
 * Hook pour vérifier les permissions rapidement
 */
export const usePermissions = () => {
  const { user, role, hasRole, isOwner } = useAuth();

  return {
    // Permissions de base
    canAccessAdmin: hasRole('admin'),
    canAccessProfessional: hasRole('professional'),
    canAccessClient: hasRole('client'),

    // Permissions étendues
    canManageUsers: hasRole('admin'),
    canManageProjects: role === 'client' || hasRole('admin'),
    canBidOnProjects: hasRole('professional'),
    canViewAllProjects: hasRole('admin'),

    // Ownership
    isResourceOwner: isOwner,

    // Utilisateur connecté
    isAuthenticated: !!user,
    isLoading: !user,

    // Rôle actuel
    currentRole: role,
    currentUser: user,
  };
};

export default RoleGuard;
