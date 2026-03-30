import { useState, useEffect } from "react";

interface PlatformSettings {
  creditsEnabled: boolean;
  matchPaymentEnabled: boolean;
  loading: boolean;
}

export function usePlatformSettings(): PlatformSettings {
  const [settings, setSettings] = useState<PlatformSettings>({
    creditsEnabled: false,
    matchPaymentEnabled: false,
    loading: true
  });

  useEffect(() => {
    // Simuler le chargement des paramètres
    const loadSettings = async () => {
      try {
        // TODO: Charger depuis la base de données
        setTimeout(() => {
          setSettings({
            creditsEnabled: true,
            matchPaymentEnabled: false,
            loading: false
          });
        }, 1000);
      } catch (error) {
        console.error('Erreur chargement settings:', error);
        setSettings({
          creditsEnabled: false,
          matchPaymentEnabled: false,
          loading: false
        });
      }
    };

    loadSettings();
  }, []);

  return settings;
}
