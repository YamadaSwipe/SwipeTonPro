-- Correction pour les notifications avec navigation
-- Ajout de project_id dans les données de notification

-- Mettre à jour les notifications existantes pour inclure project_id
UPDATE notifications 
SET data = COALESCE(data, '{}'::jsonb) || 
    CASE 
        WHEN title LIKE '%intéressé%' OR title LIKE '%professionnel%' 
        THEN jsonb_build_object('project_id', 
            (SELECT id FROM projects ORDER BY created_at DESC LIMIT 1)
        )
        WHEN title LIKE '%matching%' OR title LIKE '%match%'
        THEN jsonb_build_object('project_id', 
            (SELECT id FROM projects ORDER BY created_at DESC LIMIT 1)
        )
        ELSE data
    END
WHERE data IS NULL OR NOT (data ? 'project_id');

-- Vérifier les notifications avec project_id
SELECT title, data, created_at 
FROM notifications 
WHERE data ? 'project_id' 
ORDER BY created_at DESC LIMIT 10;
