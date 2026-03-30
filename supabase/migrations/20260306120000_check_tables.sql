-- Vérifier les tables existantes dans la base de données
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'profiles', 'professionals', 'professional_documents', 'professional_references', 'professional_certifications', 'storage.objects')
ORDER BY table_name;

-- Vérifier si la table users existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'users'
) AS users_table_exists;

-- Vérifier les colonnes de la table users si elle existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;
