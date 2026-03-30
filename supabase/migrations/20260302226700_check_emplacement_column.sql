-- Vérification de la colonne location (pas emplacement)
-- Date: 2026-03-02

-- Vérifier si la colonne location existe et ses contraintes
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name = 'location';

-- Vérifier les contraintes sur la colonne location
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'projects'
AND constraint_name LIKE '%location%';
