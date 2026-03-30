import { useEffect, useState, useRef, ReactNode } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { LoadingSpinner } from "./LoadingSpinner";

type UserRole = Database["public"]["Enums"]["user_role"];

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles = [], 
  redirectTo = "/" 
}: ProtectedRouteProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const hasChecked = useRef(false); // ✅ Empêche les vérifications multiples

  useEffect(() => {
    // ✅ Ne vérifier qu'une seule fois
    if (hasChecked.current) return;
    hasChecked.current = true;

    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      console.log("🔐 ProtectedRoute - Début vérification auth");

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("❌ Erreur session:", sessionError);
        router.push(redirectTo);
        return;
      }

      if (!session) {
        console.log("❌ Pas de session, redirection vers:", redirectTo);
        router.push(redirectTo);
        return;
      }

      console.log("✅ Session trouvée:", session.user.id);

      // Si des rôles sont requis, vérifier le rôle de l'utilisateur
      if (allowedRoles.length > 0) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();

          console.log("📊 ProtectedRoute - Profil:", { profile, profileError });

          if (profileError) {
            // ✅ Si 404 ou autre erreur, utiliser le rôle des user_metadata comme fallback
            console.warn("⚠️ Impossible de récupérer le profil depuis la table, utilisation des user_metadata");
            
            const userRole = session.user.user_metadata?.role as UserRole | undefined;
            
            if (!userRole || !allowedRoles.includes(userRole)) {
              console.log("❌ Rôle non autorisé (fallback):", userRole, "attendu:", allowedRoles);
              router.push(redirectTo);
              return;
            }

            console.log("✅ Accès autorisé via user_metadata:", userRole);
            setAuthorized(true);
            setLoading(false);
            return;
          }

          if (!profile || !allowedRoles.includes(profile.role)) {
            console.log("❌ Rôle non autorisé:", profile?.role, "attendu:", allowedRoles);
            router.push(redirectTo);
            return;
          }

          console.log("✅ Accès autorisé pour rôle:", profile.role);
        } catch (error) {
          console.error("❌ Erreur vérification rôle:", error);
          router.push(redirectTo);
          return;
        }
      }

      setAuthorized(true);
      setLoading(false);
    } catch (error) {
      console.error("❌ Erreur inattendue dans checkAuth:", error);
      router.push(redirectTo);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}