-- Migration pour ajouter la colonne ai_estimation manquante
-- Date: 2026-03-02

-- Ajouter la colonne ai_estimation
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS ai_estimation DECIMAL(10,2);

-- Ajouter une contrainte pour validation (optionnel)
DO $$ 
BEGIN
    -- Vérifier si la contrainte existe déjà
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'projects' 
        AND constraint_name = 'check_ai_estimation_positive'
    ) THEN
        -- Ajouter la contrainte ai_estimation >= 0
        ALTER TABLE projects 
        ADD CONSTRAINT check_ai_estimation_positive CHECK (ai_estimation >= 0);
    END IF;
END $$;

-- Créer un index pour optimiser les recherches par ai_estimation
CREATE INDEX IF NOT EXISTS idx_projects_ai_estimation ON projects(ai_estimation);

-- Commentaire pour documentation
COMMENT ON COLUMN projects.ai_estimation IS 'Estimation IA du coût du projet en euros';
