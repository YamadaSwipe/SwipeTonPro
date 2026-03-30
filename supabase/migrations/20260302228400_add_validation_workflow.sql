-- Ajouter le workflow de validation des projets
-- Date: 2026-03-02

-- Ajouter les colonnes pour le workflow de validation (sans valeur par défaut)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS validation_status TEXT,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS featured_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS urgent_at TIMESTAMP;

-- Créer un type ENUM pour validation_status (si n'existe pas déjà)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_validation_status') THEN
    CREATE TYPE project_validation_status AS ENUM (
      'pending',
      'in_review', 
      'approved',
      'rejected',
      'published',
      'featured',
      'urgent'
    );
  END IF;
END $$;

-- Mettre à jour la colonne validation_status pour utiliser le nouveau type (avec conversion explicite)
ALTER TABLE projects 
ALTER COLUMN validation_status TYPE project_validation_status 
USING 
  CASE 
    WHEN validation_status IS NULL THEN 'pending'::project_validation_status
    WHEN validation_status = 'pending' THEN 'pending'::project_validation_status
    WHEN validation_status = 'in_review' THEN 'in_review'::project_validation_status
    WHEN validation_status = 'approved' THEN 'approved'::project_validation_status
    WHEN validation_status = 'rejected' THEN 'rejected'::project_validation_status
    WHEN validation_status = 'published' THEN 'published'::project_validation_status
    WHEN validation_status = 'featured' THEN 'featured'::project_validation_status
    WHEN validation_status = 'urgent' THEN 'urgent'::project_validation_status
    ELSE 'pending'::project_validation_status
  END;

-- Mettre à jour les valeurs par défaut
UPDATE projects 
SET validation_status = 'pending'::project_validation_status 
WHERE validation_status IS NULL;

-- Créer un index pour les projets mis en avant
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(is_featured, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_urgent ON projects(is_urgent, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_validation_status ON projects(validation_status, created_at DESC);

-- Vérifier la structure mise à jour
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name IN ('validation_status', 'is_featured', 'is_urgent', 'validated_at', 'validated_by', 'featured_at', 'urgent_at')
ORDER BY ordinal_position;
