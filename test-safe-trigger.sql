-- Test simple pour vérifier que le trigger notifications fonctionne
-- Sans affecter les autres tables

-- 1. Vérifier l'état actuel
SELECT 'Triggers actuels sur notifications:' as info;
SELECT trigger_name, event_manipulation, action_timing 
FROM information_schema.triggers 
WHERE event_object_table = 'notifications' 
AND trigger_schema = 'public';

-- 2. Test simple de mise à jour
DO $$
DECLARE
    test_notification_id UUID;
    old_read BOOLEAN;
    new_read BOOLEAN;
    test_read_at TIMESTAMP;
BEGIN
    -- Créer une notification simple
    INSERT INTO notifications (user_id, title, message, type, is_read)
    VALUES (
        gen_random_uuid(), 
        'Test simple', 
        'Test du trigger', 
        'test', 
        false
    ) 
    RETURNING id, is_read INTO test_notification_id, old_read;
    
    RAISE NOTICE '📝 Notification créée: ID=%, is_read=%', test_notification_id, old_read;
    
    -- Attendre un peu pour voir la différence de timestamp
    PERFORM pg_sleep(0.1);
    
    -- Tester la mise à jour
    UPDATE notifications 
    SET is_read = true 
    WHERE id = test_notification_id
    RETURNING is_read, read_at INTO new_read, test_read_at;
    
    RAISE NOTICE '✅ Mise à jour réussie: is_read=%, read_at=%', new_read, test_read_at;
    
    -- Nettoyer
    DELETE FROM notifications WHERE id = test_notification_id;
    RAISE NOTICE '🧹 Nettoyage terminé';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Erreur: %', SQLERRM;
    -- Nettoyer en cas d'erreur
    BEGIN
        DELETE FROM notifications WHERE id = test_notification_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
END $$;
