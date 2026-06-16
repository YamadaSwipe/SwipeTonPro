import { useEffect, useRef } from 'react';

interface UseAutosaveOptions {
  data: any;
  onSave: (data: any) => void | Promise<void>;
  interval?: number; // en millisecondes
  enabled?: boolean;
}

/**
 * Hook personnalisé pour la sauvegarde automatique
 * @param data - Les données à sauvegarder
 * @param onSave - Fonction de sauvegarde
 * @param interval - Intervalle de sauvegarde (défaut: 30 secondes)
 * @param enabled - Activer/désactiver la sauvegarde auto
 */
export function useAutosave({
  data,
  onSave,
  interval = 30000,
  enabled = true,
}: UseAutosaveOptions) {
  const savedDataRef = useRef<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const currentData = JSON.stringify(data);

    // Ne sauvegarder que si les données ont changé
    if (currentData !== savedDataRef.current) {
      // Annuler le timeout précédent
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Créer un nouveau timeout
      timeoutRef.current = setTimeout(async () => {
        try {
          await onSave(data);
          savedDataRef.current = currentData;
          console.log('✅ Sauvegarde automatique effectuée');
        } catch (error) {
          console.error('❌ Erreur lors de la sauvegarde automatique:', error);
        }
      }, interval);
    }

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, onSave, interval, enabled]);

  // Sauvegarder avant de quitter la page
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = async () => {
      const currentData = JSON.stringify(data);
      if (currentData !== savedDataRef.current) {
        try {
          await onSave(data);
        } catch (error) {
          console.error('❌ Erreur lors de la sauvegarde avant fermeture:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [data, onSave, enabled]);
}
