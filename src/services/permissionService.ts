import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["user_role"];
type Permission = Database["public"]["Tables"]["permissions"]["Row"];
type RolePermission = Database["public"]["Tables"]["role_permissions"]["Row"];

/**
 * Vérifie si l'utilisateur actuel a une permission spécifique
 */
export async function checkUserPermission(permissionName: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase.rpc("user_has_permission", {
    user_id: user.id,
    permission_name: permissionName,
  });

  if (error) {
    console.error("Error checking permission:", error);
    return false;
  }

  return data || false;
}

/**
 * Récupère toutes les permissions de l'utilisateur actuel
 */
export async function getUserPermissions(): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase.rpc("get_user_permissions", {
    user_id: user.id,
  });

  if (error) {
    console.error("Error getting permissions:", error);
    return [];
  }

  // Mapper le résultat (tableau d'objets) vers un tableau de chaînes
  return data ? data.map((p: any) => p.permission_name) : [];
}

/**
 * Récupère toutes les permissions disponibles (pour l'admin)
 */
export async function getAllPermissions(): Promise<Permission[]> {
  const { data, error } = await supabase
    .from("permissions")
    .select("*")
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching permissions:", error);
    return [];
  }

  return data || [];
}

/**
 * Récupère les permissions d'un rôle spécifique
 */
export async function getRolePermissions(role: UserRole): Promise<string[]> {
  const { data, error } = await supabase
    .from("role_permissions")
    .select(`
      permission:permissions(name)
    `)
    .eq("role", role);

  if (error) {
    console.error("Error fetching role permissions:", error);
    return [];
  }

  return data.map((rp: any) => rp.permission.name);
}

/**
 * Attribue des permissions à un rôle (admin uniquement)
 */
export async function assignPermissionsToRole(
  role: UserRole,
  permissionIds: string[]
): Promise<boolean> {
  // Supprimer les anciennes permissions
  const { error: deleteError } = await supabase
    .from("role_permissions")
    .delete()
    .eq("role", role);

  if (deleteError) {
    console.error("Error deleting old permissions:", deleteError);
    return false;
  }

  // Ajouter les nouvelles permissions
  const inserts = permissionIds.map((permissionId) => ({
    role,
    permission_id: permissionId,
  }));

  const { error: insertError } = await supabase
    .from("role_permissions")
    .insert(inserts);

  if (insertError) {
    console.error("Error inserting new permissions:", insertError);
    return false;
  }

  return true;
}

/**
 * Change le rôle d'un utilisateur (super_admin uniquement)
 */
export async function updateUserRole(
  userId: string,
  newRole: UserRole
): Promise<boolean> {
  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);

  if (error) {
    console.error("Error updating user role:", error);
    return false;
  }

  // Logger l'action admin
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { error: logError } = await supabase.from("admin_actions").insert({
      admin_id: user.id,
      action_type: "user_role_change",
      target_user_id: userId,
      details: { new_role: newRole },
    });
    
    if (logError) {
      console.error("Warning: Could not log admin action:", logError);
      // Ne pas bloquer - l'action a été effectuée, le log est optionnel
    }
  }

  return true;
}

/**
 * Vérifie si l'utilisateur actuel a un des rôles spécifiés
 */
export async function hasRole(roles: UserRole[]): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !data) return false;

  return roles.includes(data.role);
}