-- Corriger le type de la colonne ai_estimation de numeric vers TEXT
-- Date: 2026-03-02

-- Vérifier le type actuel de la colonne
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name = 'ai_estimation';

-- Supprimer la colonne si elle existe avec le mauvais type
ALTER TABLE projects 
DROP COLUMN IF EXISTS ai_estimation;

-- Recréer la colonne avec le bon type TEXT
ALTER TABLE projects 
ADD COLUMN ai_estimation TEXT;

-- Vérifier après correction
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name = 'ai_estimation';
