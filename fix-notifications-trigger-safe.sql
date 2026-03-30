-- Correction SÉCURISÉE du trigger notifications
-- Problème: record "new" has no field "updated_at"
-- Solution: Supprimer uniquement le trigger notifications, pas la fonction partagée

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

-- 5. Vérifier que tout est correct
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table, 
    action_timing,
    action_condition
FROM information_schema.triggers 
WHERE event_object_table = 'notifications' 
AND trigger_schema = 'public';

-- 6. Test du trigger (sans affecter les autres tables)
DO $$
DECLARE
    test_id UUID;
    test_read_at TIMESTAMP;
BEGIN
    -- Créer une notification de test
    INSERT INTO notifications (user_id, title, message, type, is_read)
    VALUES (
        gen_random_uuid(), 
        'Test trigger sécurisé', 
        'Test après correction SÉCURISÉE du trigger', 
        'test', 
        false
    ) 
    RETURNING id INTO test_id;
    
    RAISE NOTICE '🔍 Notification test créée: %', test_id;
    
    -- Tester la mise à jour (ne devrait plus générer d'erreur updated_at)
    UPDATE notifications 
    SET is_read = true 
    WHERE id = test_id;
    
    -- Vérifier que read_at a été mis à jour
    SELECT read_at INTO test_read_at FROM notifications WHERE id = test_id;
    
    IF test_read_at IS NOT NULL THEN
        RAISE NOTICE '✅ Trigger fonctionnel - read_at mis à jour: %', test_read_at;
    ELSE
        RAISE NOTICE '❌ Problème avec le trigger - read_at non mis à jour';
    END IF;
    
    -- Nettoyer
    DELETE FROM notifications WHERE id = test_id;
    RAISE NOTICE '🧹 Notification de test supprimée';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Erreur lors du test: %', SQLERRM;
    -- Nettoyer en cas d'erreur
    BEGIN
        DELETE FROM notifications WHERE id = test_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
END $$;

-- 7. Afficher l'état final des triggers notifications
SELECT '📊 État final des triggers notifications:' as info;
SELECT 
    trigger_name || ' (' || event_manipulation || ' sur ' || event_object_table || ')' as trigger_info
FROM information_schema.triggers 
WHERE event_object_table = 'notifications' 
AND trigger_schema = 'public';

-- 8. Confirmer que les autres triggers sont intactes
SELECT '🛡️ Autres triggers préservés (vérification):' as info;
SELECT COUNT(*) as nb_triggers_autres_tables
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table != 'notifications';
