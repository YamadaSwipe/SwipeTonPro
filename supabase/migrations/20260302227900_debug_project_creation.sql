-- Debug de la création de projet
-- Date: 2026-03-02

-- Vérifier la structure de la table projects
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
ORDER BY ordinal_position;

-- Vérifier les contraintes sur la table
SELECT 
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint 
WHERE conrelid = 'projects'::regclass;

-- Vérifier les derniers projets créés
SELECT 
  id, 
  title, 
  description, 
  client_id, 
  status, 
  created_at
FROM projects 
ORDER BY created_at DESC 
LIMIT 5;
