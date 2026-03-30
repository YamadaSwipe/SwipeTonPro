import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

/**
 * Hook pour gérer l'authentification utilisateur
 * 
 * CORRECTION: Protection contre appels multiples et cleanup proper
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Protection contre initialisation multiple
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) {
      console.log("✅ useAuth déjà initialisé, skip");
      return;
    }

    hasInitialized.current = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      console.log("🔐 Session initiale:", initialSession?.user?.id || "Aucune");
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      console.log("🔄 Auth state changed:", _event, newSession?.user?.id || "Déconnecté");
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      console.log("🧹 Cleanup useAuth subscription");
      subscription.unsubscribe();
    };
  }, []);

  return { user, session, loading };
}