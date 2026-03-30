-- Migration pour supprimer de force la colonne emplacement
-- Date: 2026-03-02

-- Supprimer la contrainte NOT NULL si elle existe
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'projects' 
        AND constraint_name LIKE '%emplacement%'
    ) THEN
        ALTER TABLE projects 
        DROP CONSTRAINT IF EXISTS projects_emplacement_not_null;
    END IF;
END $$;

-- Supprimer la colonne emplacement
ALTER TABLE projects 
DROP COLUMN IF EXISTS emplacement;

-- Mettre à jour les valeurs nulles dans location (au cas où)
UPDATE projects 
SET location = COALESCE(city, 'Non spécifié') || ' ' || COALESCE(postal_code, '')
WHERE location IS NULL OR location = '';

-- Vérifier que la colonne emplacement n'existe plus
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name = 'emplacement';
