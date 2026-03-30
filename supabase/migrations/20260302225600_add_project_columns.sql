-- Migration pour ajouter les colonnes manquantes à la table projects
-- Date: 2026-03-02

-- Ajouter les colonnes surface et property_type
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS surface DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS property_type TEXT;

-- Ajouter des contraintes pour validation (syntaxe PostgreSQL correcte)
DO $$ 
BEGIN
    -- Vérifier si la contrainte existe déjà
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'projects' 
        AND constraint_name = 'check_surface_positive'
    ) THEN
        -- Ajouter la contrainte surface > 0
        ALTER TABLE projects 
        ADD CONSTRAINT check_surface_positive CHECK (surface > 0);
    END IF;

    -- Vérifier si la contrainte existe déjà
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'projects' 
        AND constraint_name = 'check_property_type_not_empty'
    ) THEN
        -- Ajouter la contrainte property_type non vide
        ALTER TABLE projects 
        ADD CONSTRAINT check_property_type_not_empty CHECK (property_type IS NOT NULL AND property_type != '');
    END IF;
END $$;

-- Créer un index pour optimiser les recherches par type de bien
CREATE INDEX IF NOT EXISTS idx_projects_property_type ON projects(property_type);

-- Créer un index pour optimiser les recherches par surface
CREATE INDEX IF NOT EXISTS idx_projects_surface ON projects(surface);

-- Commentaire pour documentation
COMMENT ON COLUMN projects.surface IS 'Surface du projet en mètres carrés';
COMMENT ON COLUMN projects.property_type IS 'Type de bien (Appartement, Maison, Studio, etc.)';
