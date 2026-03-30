-- Vérification finale : la colonne emplacement existe-t-elle ?
-- Date: 2026-03-02

-- Vérifier si la colonne emplacement existe réellement
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name = 'emplacement';

-- Si la colonne existe, la supprimer
-- Décommenter la ligne suivante si la colonne existe
-- ALTER TABLE projects DROP COLUMN IF EXISTS emplacement;
