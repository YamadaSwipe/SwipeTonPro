-- Correction du trigger notifications - problème updated_at manquant
-- L'erreur: record "new" has no field "updated_at"

-- 1. Supprimer l'ancien trigger qui cause l'erreur
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;

-- 2. Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS update_updated_at_column();

-- 3. Créer un trigger simple pour read_at (colonne qui existe)
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

-- 4. Créer le trigger pour read_at
CREATE TRIGGER update_notifications_read_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_read_at();

-- 5. Vérifier que tout est correct
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table, 
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'notifications' 
AND trigger_schema = 'public';

-- 6. Test du trigger
DO $$
DECLARE
    test_id UUID;
BEGIN
    -- Créer une notification de test
    INSERT INTO notifications (user_id, title, message, type, is_read)
    VALUES (
        gen_random_uuid(), 
        'Test trigger', 
        'Test après correction du trigger', 
        'test', 
        false
    ) 
    RETURNING id INTO test_id;
    
    -- Tester la mise à jour (ne devrait plus générer d'erreur)
    UPDATE notifications 
    SET is_read = true 
    WHERE id = test_id;
    
    -- Vérifier que read_at a été mis à jour
    SELECT read_at INTO test_id FROM notifications WHERE id = test_id;
    
    IF test_id IS NOT NULL THEN
        RAISE NOTICE '✅ Trigger fonctionnel - read_at mis à jour: %', test_id;
    ELSE
        RAISE NOTICE '❌ Problème avec le trigger';
    END IF;
    
    -- Nettoyer
    DELETE FROM notifications WHERE id = test_id;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Erreur lors du test: %', SQLERRM;
END $$;
