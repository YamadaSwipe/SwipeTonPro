-- Migration pour ajouter la colonne matched_professionnels manquante
-- Date: 2026-03-02

-- Ajouter la colonne matched_professionnels
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS matched_professionnels UUID[] DEFAULT '{}';

-- Créer un index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_projects_matched_professionnels ON projects USING GIN (matched_professionnels);

-- Commentaire pour documentation
COMMENT ON COLUMN projects.matched_professionnels IS 'Liste des IDs des professionnels matchés pour ce projet';
