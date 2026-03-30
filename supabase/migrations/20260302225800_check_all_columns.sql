-- Vérification complète de toutes les colonnes de la table projects
-- Date: 2026-03-02

-- Vérifier les colonnes actuelles
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
ORDER BY ordinal_position;

-- Vérifier les contraintes
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'projects';

-- Vérifier les index
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'projects';

-- Vérifier les contraintes CHECK avec pg_constraint (version moderne)
SELECT 
  conname as constraint_name,
  conbin as check_definition
FROM pg_constraint 
WHERE conrelid = 'projects'::regclass 
AND contype = 'c';
