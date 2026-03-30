-- Vérification détaillée de toutes les colonnes de la table projects
-- Date: 2026-03-02

-- Vérifier toutes les colonnes existantes
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default,
  ordinal_position
FROM information_schema.columns 
WHERE table_name = 'projects' 
ORDER BY ordinal_position;

-- Vérifier spécifiquement la colonne emplacement
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name = 'emplacement';

-- Vérifier les contraintes sur la table (syntaxe correcte)
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'projects';

-- Vérifier les contraintes CHECK avec pg_constraint (version moderne)
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  conbin as check_definition
FROM pg_constraint 
WHERE conrelid = 'projects'::regclass 
AND contype = 'c';
