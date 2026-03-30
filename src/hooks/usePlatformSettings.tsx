import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { supabaseQueue } from "@/utils/supabaseQueue";

interface PlatformSettings {
  creditsEnabled: boolean;
  matchPaymentEnabled: boolean;
  loading: boolean;
}

/**
 * Hook pour récupérer les paramètres de la plateforme
 * Permet de savoir si le système de crédits est activé
 * 
 * CORRECTION: Protection contre boucles infinies avec useCallback et flag
 */
export function usePlatformSettings(): PlatformSettings {
  const [settings, setSettings] = useState<PlatformSettings>({
    creditsEnabled: false,
    matchPaymentEnabled: true,
    loading: true,
  });

  // Protection contre appels multiples
  const isFetching = useRef(false);
  const hasFetched = useRef(false);

  // Stabiliser la fonction avec useCallback
  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("setting_key, setting_value")
        .in("setting_key", ["credits_enabled", "match_payment_enabled"]);

      if (error) {
        console.error("❌ Erreur fetch platform_settings:", error);
        throw error;
      }

      const settingsMap: Record<string, boolean> = {};
      data?.forEach((setting) => {
        settingsMap[setting.setting_key] = setting.setting_value === "true";
      });

      setSettings({
        creditsEnabled: settingsMap.credits_enabled ?? false,
        matchPaymentEnabled: settingsMap.match_payment_enabled ?? true,
        loading: false,
      });

      hasFetched.current = true;
      console.log("✅ Platform settings chargés:", settingsMap);
    } catch (error) {
      console.error("❌ Erreur fetching platform settings:", error);
      setSettings((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    // Éviter fetch multiple si déjà fait
    if (hasFetched.current) {
      console.log("✅ Settings déjà chargés, skip initial fetch");
      return;
    }

    fetchSettings();

    // Écouter les changements en temps réel
    const subscription = supabase
      .channel("platform_settings_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "platform_settings",
        },
        (payload) => {
          console.log("🔄 Platform settings changés:", payload);
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      console.log("🧹 Cleanup usePlatformSettings subscription");
      subscription.unsubscribe();
    };
  }, [fetchSettings]);

  return settings;
}