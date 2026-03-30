-- Migration pour corriger la valeur par défaut de location
-- Date: 2026-03-02

-- Mettre à jour les valeurs nulles en utilisant city + postal_code
UPDATE projects 
SET location = city || 'Non spécifié'
WHERE location IS NULL OR location = '';

-- Ajouter une contrainte NOT NULL si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'projects' 
        AND constraint_name = 'projects_location_check'
    ) THEN
        ALTER TABLE projects 
        ADD CONSTRAINT projects_location_check CHECK (location IS NOT NULL AND location != '');
    END IF;
END $$;
