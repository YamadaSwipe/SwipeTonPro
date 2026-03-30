-- Vérification complète de toutes les colonnes de la table projects
-- Date: 2026-03-02

-- Vérifier toutes les colonnes existantes
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
ORDER BY ordinal_position;

-- Vérifier les contraintes NOT NULL
SELECT 
  column_name,
  constraint_name,
  constraint_type
FROM information_schema.column_constraints 
WHERE table_name = 'projects' 
AND constraint_type = 'CHECK';
