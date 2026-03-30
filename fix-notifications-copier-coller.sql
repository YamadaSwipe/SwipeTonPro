-- COPIER-COLLER DIRECT dans Supabase SQL Editor
-- Correction du trigger notifications sans casser les autres tables

-- 1. Supprimer UNIQUEMENT le trigger notifications qui cause l'erreur
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;

-- 2. NE PAS supprimer la fonction update_updated_at_column()
--    Car elle est utilisée par d'autres tables (profiles, projects, bids, etc.)

-- 3. Créer une fonction dédiée pour notifications (sans conflit)
CREATE OR REPLACE FUNCTION update_notifications_read_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour read_at quand is_read change à true
  IF NEW.is_read = true AND (OLD.is_read IS NULL OR OLD.is_read = false) THEN
    NEW.read_at = NOW();
  END IF;
  
  -- NE PAS essayer de mettre à jour updated_at (colonne inexistante)
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Créer le trigger spécifique pour notifications
CREATE TRIGGER update_notifications_read_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_read_at();

-- 5. Vérification
SELECT 'Trigger notifications corrigé avec succès' as status;
