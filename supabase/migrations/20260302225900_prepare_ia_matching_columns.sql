-- Migration préparatoire pour les fonctionnalités IA Matching
-- Date: 2026-03-02
-- À appliquer quand les fonctionnalités IA Matching seront développées

-- Colonnes pour le système de matching IA
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS matching_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS matched_professionals UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS matching_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS last_matching_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS matching_algorithm_version TEXT DEFAULT 'v1.0';

-- Colonnes pour l'analyse avancée
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS priority_level TEXT DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS complexity_level TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS estimated_duration INTEGER, -- en jours
ADD COLUMN IF NOT EXISTS required_skills TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS location_coordinates POINT;

-- Contraintes de validation
DO $$ 
BEGIN
    -- Contrainte pour matching_score
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'projects' 
        AND constraint_name = 'check_matching_score_range'
    ) THEN
        ALTER TABLE projects 
        ADD CONSTRAINT check_matching_score_range CHECK (matching_score >= 0 AND matching_score <= 100);
    END IF;

    -- Contrainte pour matching_status
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'projects' 
        AND constraint_name = 'check_matching_status_valid'
    ) THEN
        ALTER TABLE projects 
        ADD CONSTRAINT check_matching_status_valid CHECK (matching_status IN ('pending', 'processing', 'completed', 'failed'));
    END IF;

    -- Contrainte pour priority_level
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'projects' 
        AND constraint_name = 'check_priority_level_valid'
    ) THEN
        ALTER TABLE projects 
        ADD CONSTRAINT check_priority_level_valid CHECK (priority_level IN ('low', 'normal', 'high', 'urgent'));
    END IF;

    -- Contrainte pour complexity_level
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'projects' 
        AND constraint_name = 'check_complexity_level_valid'
    ) THEN
        ALTER TABLE projects 
        ADD CONSTRAINT check_complexity_level_valid CHECK (complexity_level IN ('simple', 'medium', 'complex', 'expert'));
    END IF;
END $$;

-- Index pour optimisation
CREATE INDEX IF NOT EXISTS idx_projects_matching_score ON projects(matching_score);
CREATE INDEX IF NOT EXISTS idx_projects_matching_status ON projects(matching_status);
CREATE INDEX IF NOT EXISTS idx_projects_priority_level ON projects(priority_level);
CREATE INDEX IF NOT EXISTS idx_projects_complexity_level ON projects(complexity_level);
CREATE INDEX IF NOT EXISTS idx_projects_location ON projects USING GIST (location_coordinates);

-- Extensions PostgreSQL nécessaires
CREATE EXTENSION IF NOT EXISTS postgis;

-- Commentaires pour documentation
COMMENT ON COLUMN projects.matching_score IS 'Score de compatibilité calculé par l''IA (0-100)';
COMMENT ON COLUMN projects.matched_professionnels IS 'Liste des IDs des professionnels matchés';
COMMENT ON COLUMN projects.matching_status IS 'Statut du processus de matching';
COMMENT ON COLUMN projects.last_matching_at IS 'Date du dernier matching effectué';
COMMENT ON COLUMN projects.matching_algorithm_version IS 'Version de l''algorithme de matching utilisé';
COMMENT ON COLUMN projects.priority_level IS 'Niveau de priorité du projet';
COMMENT ON COLUMN projects.complexity_level IS 'Niveau de complexité estimé';
COMMENT ON COLUMN projects.estimated_duration IS 'Durée estimée en jours';
COMMENT ON COLUMN projects.required_skills IS 'Compétences requises pour le projet';
COMMENT ON COLUMN projects.location_coordinates IS 'Coordonnées géographiques pour le matching géolocalisé';
