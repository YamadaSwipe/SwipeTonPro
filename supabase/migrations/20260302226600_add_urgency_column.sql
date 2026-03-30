-- Migration pour ajouter la colonne urgency manquante
-- Date: 2026-03-02

-- Ajouter la colonne urgency
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT 'normal';

-- Créer un index pour optimiser les recherches par urgence
CREATE INDEX IF NOT EXISTS idx_projects_urgency ON projects(urgency);

-- Commentaire pour documentation
COMMENT ON COLUMN projects.urgency IS 'Niveau d''urgence du projet (low, normal, high)';
