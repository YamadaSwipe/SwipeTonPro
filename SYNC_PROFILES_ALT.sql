-- Version alternative si le type user_role pose problème
-- Exécuter cette version si la première échoue

-- 1. D'abord vérifier les types de la table profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'role';

-- 2. Version simplifiée sans COALESCE sur role
INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', 
           au.raw_user_meta_data->>'name', 
           'Utilisateur ' || LEFT(au.email, POSITION('@' IN au.email) - 1)
  ) as full_name,
  'client',
  au.created_at,
  au.created_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
AND au.email NOT LIKE '%@example.com'
AND au.email NOT LIKE '%test%';
