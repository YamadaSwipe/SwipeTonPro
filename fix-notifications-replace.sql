-- CORRECTION FINALE - Remplacer le trigger existant
-- Pour le cas où le trigger existe déjà

-- 1. Supprimer le trigger existant
DROP TRIGGER IF EXISTS update_notifications_read_at ON notifications;

-- 2. Supprimer aussi l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;

-- 3. Créer la fonction dédiée (si elle n'existe pas déjà)
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
SELECT 'Trigger notifications remplacé avec succès' as status;
