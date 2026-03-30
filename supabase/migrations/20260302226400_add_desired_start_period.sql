-- Migration pour ajouter la colonne desired_start_period manquante
-- Date: 2026-03-02

-- Ajouter la colonne desired_start_period
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS desired_start_period TEXT;

-- Créer un index pour optimiser les recherches par période
CREATE INDEX IF NOT EXISTS idx_projects_desired_start_period ON projects(desired_start_period);

-- Commentaire pour documentation
COMMENT ON COLUMN projects.desired_start_period IS 'Période souhaitée pour le début des travaux';
