-- Vérifier si la colonne ai_estimation existe
-- Date: 2026-03-02

-- Vérifier la structure actuelle de la table projects
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
ORDER BY ordinal_position;

-- Vérifier spécifiquement si ai_estimation existe
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name = 'ai_estimation';

-- Ajouter la colonne si elle n'existe pas
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS ai_estimation TEXT;

-- Vérifier après ajout
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name = 'ai_estimation';
