-- Fix pour le problème de schéma notifications
-- Problème: record "new" has no field "updated_at" dans le trigger

-- 1. D'abord, vérifier si la table notifications existe et sa structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;

-- 3. Supprimer l'ancienne fonction si elle existe
DROP FUNCTION IF EXISTS update_updated_at_column();

-- 4. Créer la fonction correcte pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier si la colonne updated_at existe avant de la mettre à jour
  IF TG_OP = 'UPDATE' THEN
    -- Mettre à jour updated_at seulement si la colonne existe
    EXECUTE format('UPDATE %I SET updated_at = NOW() WHERE ctid = $1.ctid', TG_TABLE_NAME) USING NEW;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Recréer le trigger seulement si la colonne updated_at existe
DO $$
BEGIN
  -- Vérifier si la colonne updated_at existe dans la table notifications
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND table_schema = 'public' 
    AND column_name = 'updated_at'
  ) THEN
    -- Créer le trigger seulement si la colonne existe
    CREATE TRIGGER update_notifications_updated_at
      BEFORE UPDATE ON notifications
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    
    RAISE NOTICE 'Trigger pour updated_at créé sur notifications';
  ELSE
    RAISE NOTICE 'Colonne updated_at non trouvée dans notifications - trigger non créé';
  END IF;
END $$;

-- 6. Alternative: Créer une version simplifiée du trigger sans dépendance updated_at
CREATE OR REPLACE FUNCTION update_notifications_read_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour read_at quand is_read change à true
  IF NEW.is_read = true AND (OLD.is_read IS NULL OR OLD.is_read = false) THEN
    NEW.read_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Créer le trigger pour read_at (plus utile)
CREATE TRIGGER update_notifications_read_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_read_at();

-- 8. Vérifier le résultat
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table, 
    action_timing, 
    action_condition, 
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'notifications' 
AND trigger_schema = 'public';

-- 9. Tester le trigger avec une mise à jour
DO $$
DECLARE
    test_notification_id UUID;
BEGIN
    -- Créer une notification de test
    INSERT INTO notifications (user_id, title, message, type, is_read)
    VALUES (
        gen_random_uuid(), 
        'Test trigger', 
        'Test du trigger updated_at', 
        'test', 
        false
    ) 
    RETURNING id INTO test_notification_id;
    
    -- Tester la mise à jour
    UPDATE notifications 
    SET is_read = true 
    WHERE id = test_notification_id;
    
    -- Vérifier le résultat
    RAISE NOTICE 'Trigger testé avec succès pour notification ID: %', test_notification_id;
    
    -- Nettoyer
    DELETE FROM notifications WHERE id = test_notification_id;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erreur lors du test du trigger: %', SQLERRM;
END $$;
