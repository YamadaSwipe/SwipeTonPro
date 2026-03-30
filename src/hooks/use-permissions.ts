import { useAuth } from './useAuth';
import { useMemo, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'client' | 'professional' | 'admin' | 'super_admin' | 'support' | 'moderator';

export interface Permission {
  canViewUsers: boolean;
  canCreateUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canPromoteToAdmin: boolean;
  canPromoteToSupport: boolean;
  canPromoteToModerator: boolean;
  canViewProjects: boolean;
  canCreateProjects: boolean;
  canEditProjects: boolean;
  canDeleteProjects: boolean;
  canValidateProjects: boolean;
  canViewAnalytics: boolean;
  canManageSystem: boolean;
}

export function usePermissions(): Permission {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  // Charger le profil de l'utilisateur
  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          setProfile(data);
        });
    }
  }, [user]);

  const permissions = useMemo(() => {
    if (loading || !user || !profile) {
      return {
        canViewUsers: false,
        canCreateUsers: false,
        canEditUsers: false,
        canDeleteUsers: false,
        canPromoteToAdmin: false,
        canPromoteToSupport: false,
        canPromoteToModerator: false,
        canViewProjects: false,
        canCreateProjects: false,
        canEditProjects: false,
        canDeleteProjects: false,
        canValidateProjects: false,
        canViewAnalytics: false,
        canManageSystem: false,
      };
    }

    const role = profile.role as UserRole;

    // Permissions par rôle
    const rolePermissions: Record<UserRole, Permission> = {
      client: {
        canViewUsers: false,
        canCreateUsers: false,
        canEditUsers: false,
        canDeleteUsers: false,
        canPromoteToAdmin: false,
        canPromoteToSupport: false,
        canPromoteToModerator: false,
        canViewProjects: false,
        canCreateProjects: true,
        canEditProjects: false,
        canDeleteProjects: false,
        canValidateProjects: false,
        canViewAnalytics: false,
        canManageSystem: false,
      },
      professional: {
        canViewUsers: false,
        canCreateUsers: false,
        canEditUsers: false,
        canDeleteUsers: false,
        canPromoteToAdmin: false,
        canPromoteToSupport: false,
        canPromoteToModerator: false,
        canViewProjects: true,
        canCreateProjects: false,
        canEditProjects: false,
        canDeleteProjects: false,
        canValidateProjects: false,
        canViewAnalytics: false,
        canManageSystem: false,
      },
      moderator: {
        canViewUsers: true,
        canCreateUsers: false,
        canEditUsers: true,
        canDeleteUsers: false,
        canPromoteToAdmin: false,
        canPromoteToSupport: false,
        canPromoteToModerator: false,
        canViewProjects: true,
        canCreateProjects: false,
        canEditProjects: false,
        canDeleteProjects: false,
        canValidateProjects: true,
        canViewAnalytics: true,
        canManageSystem: false,
      },
      support: {
        canViewUsers: true,
        canCreateUsers: false,
        canEditUsers: true,
        canDeleteUsers: false,
        canPromoteToAdmin: false,
        canPromoteToSupport: false,
        canPromoteToModerator: false,
        canViewProjects: true,
        canCreateProjects: true,
        canEditProjects: false,
        canDeleteProjects: false,
        canValidateProjects: true,
        canViewAnalytics: true,
        canManageSystem: false,
      },
      admin: {
        canViewUsers: true,
        canCreateUsers: true,
        canEditUsers: true,
        canDeleteUsers: true,
        canPromoteToAdmin: false,
        canPromoteToSupport: true,
        canPromoteToModerator: true,
        canViewProjects: true,
        canCreateProjects: true,
        canEditProjects: true,
        canDeleteProjects: true,
        canValidateProjects: true,
        canViewAnalytics: true,
        canManageSystem: false,
      },
      super_admin: {
        canViewUsers: true,
        canCreateUsers: true,
        canEditUsers: true,
        canDeleteUsers: true,
        canPromoteToAdmin: true,
        canPromoteToSupport: true,
        canPromoteToModerator: true,
        canViewProjects: true,
        canCreateProjects: true,
        canEditProjects: true,
        canDeleteProjects: true,
        canValidateProjects: true,
        canViewAnalytics: true,
        canManageSystem: true,
      },
    };

    return rolePermissions[role] || rolePermissions.client;
  }, [user, profile, loading]);

  return permissions;
}

// Hook pour vérifier une permission spécifique
export function useCan(permission: keyof Permission): boolean {
  const permissions = usePermissions();
  return permissions[permission];
}

// Hook pour vérifier si l'utilisateur est admin
export function useIsAdmin(): boolean {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          setProfile(data);
        });
    }
  }, [user]);

  return profile?.role === 'admin' || profile?.role === 'super_admin';
}

// Hook pour vérifier si l'utilisateur est super admin
export function useIsSuperAdmin(): boolean {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          setProfile(data);
        });
    }
  }, [user]);

  return profile?.role === 'super_admin';
}
