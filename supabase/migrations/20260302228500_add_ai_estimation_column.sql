-- Ajouter la colonne ai_estimation pour les estimations IA
-- Date: 2026-03-02

-- Ajouter la colonne ai_estimation
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS ai_estimation TEXT;

-- Vérifier la structure mise à jour
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name = 'ai_estimation';
