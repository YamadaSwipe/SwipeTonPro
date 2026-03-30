-- Ajouter le statut "pending" à l'enum project_status
-- Ce statut est nécessaire pour le workflow de validation

-- D'abord, supprimer la valeur par défaut de la colonne status
ALTER TABLE projects ALTER COLUMN status DROP DEFAULT;

-- Créer un type temporaire avec toutes les valeurs y compris "pending"
CREATE TYPE project_status_temp AS ENUM (
  'draft', 
  'pending', 
  'published', 
  'in_progress', 
  'completed', 
  'cancelled'
);

-- Mettre à jour la table projects pour utiliser le type temporaire
ALTER TABLE projects ALTER COLUMN status TYPE project_status_temp USING 
  CASE 
    WHEN status = 'draft' THEN 'draft'::project_status_temp
    WHEN status = 'published' THEN 'published'::project_status_temp
    WHEN status = 'in_progress' THEN 'in_progress'::project_status_temp
    WHEN status = 'completed' THEN 'completed'::project_status_temp
    WHEN status = 'cancelled' THEN 'cancelled'::project_status_temp
    ELSE 'draft'::project_status_temp
  END;

-- Supprimer l'ancien type
DROP TYPE project_status;

-- Renommer le type temporaire
ALTER TYPE project_status_temp RENAME TO project_status;

-- Remettre une valeur par défaut
ALTER TABLE projects ALTER COLUMN status SET DEFAULT 'draft';

-- Commentaire pour expliquer le workflow
COMMENT ON TYPE project_status IS 'Statuts des projets: draft=brouillon, pending=en attente validation, published=publié, in_progress=en cours, completed=terminé, cancelled=annulé';
