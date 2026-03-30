-- Correction finale pour les notifications avec navigation
-- Version SQL pur - sans commentaires JavaScript

-- Mettre a jour les notifications existantes pour inclure project_id
UPDATE notifications 
SET data = COALESCE(data, '{}'::jsonb) || 
    jsonb_build_object('project_id', 
        (SELECT id FROM projects WHERE client_id = notifications.user_id ORDER BY created_at DESC LIMIT 1)
    )
WHERE data IS NULL OR NOT (data ? 'project_id');

-- Verification des notifications avec project_id
SELECT 
    title, 
    data->>'project_id' as project_id, 
    is_read, 
    created_at 
FROM notifications 
WHERE data ? 'project_id' 
ORDER BY created_at DESC LIMIT 10;
