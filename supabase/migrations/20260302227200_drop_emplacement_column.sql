-- Migration pour supprimer la colonne emplacement
-- Date: 2026-03-02

-- Vérifier si la colonne emplacement existe
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name = 'emplacement';

-- Supprimer la colonne emplacement si elle existe
ALTER TABLE projects 
DROP COLUMN IF EXISTS emplacement;

-- Vérifier que la colonne a été supprimée
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name = 'emplacement';
