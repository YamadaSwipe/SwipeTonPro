-- Script pour créer les profils manquants dans la table profiles
-- À exécuter dans l'éditeur SQL Supabase

-- 1. Trouver les utilisateurs qui existent dans auth.users mais pas dans profiles
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
  'client' as role,
  au.created_at,
  au.created_at as updated_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
AND au.email NOT LIKE '%@example.com'
AND au.email NOT LIKE '%test%';

-- 2. Vérifier le résultat
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN role = 'client' THEN 1 END) as clients,
  COUNT(CASE WHEN role = 'professional' THEN 1 END) as professionals,
  COUNT(CASE WHEN role IN ('admin', 'super_admin') THEN 1 END) as admins
FROM profiles;

-- 3. Lister les nouveaux profils créés
SELECT 
  email,
  full_name,
  role,
  created_at
FROM profiles 
WHERE id IN (
  SELECT au.id
  FROM auth.users au
  LEFT JOIN profiles p ON au.id = p.id
  WHERE p.id IS NULL
  AND au.email NOT LIKE '%@example.com'
  AND au.email NOT LIKE '%test%'
)
ORDER BY created_at DESC;
