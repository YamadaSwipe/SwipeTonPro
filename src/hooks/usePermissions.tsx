import { useEffect, useState, useCallback, useRef } from "react";
import { getUserPermissions } from "@/services/permissionService";
import type { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["user_role"];

/**
 * Hook pour gérer les permissions utilisateur
 * 
 * CORRECTION: Protection contre appels multiples avec useCallback et flag
 */
export function usePermissions() {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Protection contre appels multiples
  const isLoading = useRef(false);
  const hasLoaded = useRef(false);

  const loadPermissions = useCallback(async () => {
    if (isLoading.current) {
      console.log("⏳ usePermissions - Load déjà en cours, skip");
      return;
    }

    isLoading.current = true;
    setLoading(true);

    try {
      const perms = await getUserPermissions();
      setPermissions(perms);
      hasLoaded.current = true;
      console.log("✅ Permissions chargées:", perms.length);
    } catch (error) {
      console.error("❌ Erreur chargement permissions:", error);
      setPermissions([]);
    } finally {
      setLoading(false);
      isLoading.current = false;
    }
  }, []);

  useEffect(() => {
    if (hasLoaded.current) {
      console.log("✅ Permissions déjà chargées, skip");
      return;
    }

    loadPermissions();
  }, [loadPermissions]);

  const hasPermission = useCallback((permissionName: string): boolean => {
    return permissions.includes(permissionName);
  }, [permissions]);

  const hasAnyPermission = useCallback((permissionNames: string[]): boolean => {
    return permissionNames.some((perm) => permissions.includes(perm));
  }, [permissions]);

  const hasAllPermissions = useCallback((permissionNames: string[]): boolean => {
    return permissionNames.every((perm) => permissions.includes(perm));
  }, [permissions]);

  return {
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refresh: loadPermissions,
  };
}

/**
 * Hook pour vérifier le rôle de l'utilisateur
 * 
 * CORRECTION: Protection contre appels multiples
 */
export function useRole() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Protection contre appels multiples
  const isLoading = useRef(false);
  const hasLoaded = useRef(false);

  const loadRole = useCallback(async () => {
    if (isLoading.current) {
      console.log("⏳ useRole - Load déjà en cours, skip");
      return;
    }

    isLoading.current = true;
    setLoading(true);

    try {
      const { supabase: supabaseClient } = await import("@/integrations/supabase/client");
      const { data: { user } } = await supabaseClient.auth.getUser();

      if (user) {
        const { data, error } = await supabaseClient
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("❌ Erreur récupération rôle:", error);
          // Fallback sur user_metadata si table profiles inaccessible
          const metadataRole = user.user_metadata?.role as UserRole | undefined;
          if (metadataRole) {
            console.log("✅ Rôle récupéré depuis user_metadata:", metadataRole);
            setRole(metadataRole);
          }
        } else if (data) {
          console.log("✅ Rôle récupéré depuis profiles:", data.role);
          setRole(data.role);
        }
      }

      hasLoaded.current = true;
    } catch (error) {
      console.error("❌ Erreur chargement rôle:", error);
    } finally {
      setLoading(false);
      isLoading.current = false;
    }
  }, []);

  useEffect(() => {
    if (hasLoaded.current) {
      console.log("✅ Rôle déjà chargé, skip");
      return;
    }

    loadRole();
  }, [loadRole]);

  const isRole = useCallback((checkRole: UserRole): boolean => {
    return role === checkRole;
  }, [role]);

  const isAnyRole = useCallback((roles: UserRole[]): boolean => {
    return role ? roles.includes(role) : false;
  }, [role]);

  const isAdmin = useCallback((): boolean => {
    return role ? ["admin", "super_admin"].includes(role) : false;
  }, [role]);

  const isSuperAdmin = useCallback((): boolean => {
    return role === "super_admin";
  }, [role]);

  return {
    role,
    loading,
    isRole,
    isAnyRole,
    isAdmin,
    isSuperAdmin,
    refresh: loadRole,
  };
}