-- Vérification simple de la colonne matched_professionnels
-- Date: 2026-03-02

-- Vérifier si la colonne existe
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name = 'matched_professionnels';
