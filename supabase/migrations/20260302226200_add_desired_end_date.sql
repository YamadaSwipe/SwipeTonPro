-- Migration pour ajouter la colonne desired_end_date manquante
-- Date: 2026-03-02

-- Ajouter la colonne desired_end_date
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS desired_end_date DATE;

-- Créer un index pour optimiser les recherches par date de fin
CREATE INDEX IF NOT EXISTS idx_projects_desired_end_date ON projects(desired_end_date);

-- Commentaire pour documentation
COMMENT ON COLUMN projects.desired_end_date IS 'Date de fin souhaitée pour le projet';
