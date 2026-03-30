-- ÉTAPE 4 : Vérifier la structure exacte de la table professionals
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'professionals'
ORDER BY ordinal_position;

-- Vérifier si la table professionals existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'professionals'
) AS professionals_table_exists;
