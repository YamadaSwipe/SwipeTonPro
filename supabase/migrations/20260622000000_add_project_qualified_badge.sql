-- Migration: Ajout du badge "Projet Qualifié" pour les projets validés
-- Date: 2026-06-22
-- Description: Ajoute un champ booléen is_project_qualified pour marquer les projets vérifiés par les admins/modérateurs

-- Ajouter la colonne is_project_qualified à la table projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS is_project_qualified BOOLEAN DEFAULT FALSE;

-- Ajouter un commentaire pour documenter le champ
COMMENT ON COLUMN projects.is_project_qualified IS 
'Badge de qualification du projet. TRUE si le projet a été vérifié et validé par un admin/modérateur après sa mise en ligne. Ce badge rassure les professionnels sur la véracité du projet.';

-- Créer un index pour optimiser les requêtes filtrant par projets qualifiés
CREATE INDEX IF NOT EXISTS idx_projects_qualified 
ON projects(is_project_qualified) 
WHERE is_project_qualified = TRUE;

-- Ajouter une colonne pour tracer qui a qualifié le projet et quand
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS qualified_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS qualified_at TIMESTAMPTZ;

-- Commentaires pour la traçabilité
COMMENT ON COLUMN projects.qualified_by IS 'ID du modérateur/admin qui a qualifié le projet';
COMMENT ON COLUMN projects.qualified_at IS 'Date et heure de qualification du projet';

-- Fonction pour qualifier automatiquement un projet lors de sa publication
-- Note: Les valeurs possibles de l'enum project_status sont: 
-- 'draft', 'pending', 'published', 'in_progress', 'completed', 'cancelled'
CREATE OR REPLACE FUNCTION auto_qualify_project_on_validation()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le statut passe à 'published' et que le projet n'est pas encore qualifié
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    NEW.is_project_qualified := TRUE;
    NEW.qualified_at := NOW();
    -- Note: qualified_by devra être défini manuellement par l'admin lors de la validation
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour auto-qualification
DROP TRIGGER IF EXISTS trigger_auto_qualify_project ON projects;
CREATE TRIGGER trigger_auto_qualify_project
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION auto_qualify_project_on_validation();

-- Mettre à jour les projets déjà publiés pour les marquer comme qualifiés
UPDATE projects 
SET 
  is_project_qualified = TRUE,
  qualified_at = updated_at
WHERE 
  status = 'published' 
  AND is_project_qualified = FALSE;
