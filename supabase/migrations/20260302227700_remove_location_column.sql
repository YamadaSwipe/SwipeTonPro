-- Migration pour supprimer complètement la colonne location
-- Date: 2026-03-02

-- Supprimer la colonne location et toutes ses contraintes
ALTER TABLE projects 
DROP COLUMN IF EXISTS location;

-- Vérifier que la colonne n'existe plus
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name = 'location';
