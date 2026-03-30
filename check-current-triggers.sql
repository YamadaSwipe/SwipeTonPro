-- Vérifier l'état actuel des triggers notifications
-- Pour comprendre ce qui existe déjà

-- 1. Voir tous les triggers sur la table notifications
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

-- 2. Voir les fonctions liées aux notifications
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%notification%';

-- 3. Vérifier si la fonction update_notifications_read_at existe
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'update_notifications_read_at';

-- 4. Test simple de mise à jour pour voir l'erreur actuelle
DO $$
DECLARE
    test_id UUID;
BEGIN
    -- Créer une notification de test
    INSERT INTO notifications (user_id, title, message, type, is_read)
    VALUES (
        gen_random_uuid(), 
        'Test état actuel', 
        'Vérification du trigger actuel', 
        'test', 
        false
    ) 
    RETURNING id INTO test_id;
    
    -- Tenter la mise à jour pour voir l'erreur
    UPDATE notifications 
    SET is_read = true 
    WHERE id = test_id;
    
    -- Nettoyer
    DELETE FROM notifications WHERE id = test_id;
    
    RAISE NOTICE '✅ Test réussi - pas d''erreur';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Erreur détectée: %', SQLERRM;
    -- Nettoyer en cas d'erreur
    BEGIN
        DELETE FROM notifications WHERE id = test_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
END $$;
