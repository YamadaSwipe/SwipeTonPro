-- Script SQL pour vérifier si l'email existe dans la base de données
-- À exécuter directement dans l'éditeur SQL Supabase

-- 1. Vérifier dans la table auth.users (nécessite les droits admin)
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  raw_user_meta_data
FROM auth.users 
WHERE email = 'sotbirida@yahoo.fr';

-- 2. Vérifier dans la table profiles
SELECT 
  id,
  email,
  full_name,
  role,
  phone,
  created_at
FROM profiles 
WHERE email = 'sotbirida@yahoo.fr';

-- 3. Vérifier s'il y a des entrées partielles avec cet email
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles 
WHERE email ILIKE '%sotbirida%';

-- 4. Compter le nombre total d'utilisateurs par rôle
SELECT 
  role,
  COUNT(*) as count
FROM profiles 
GROUP BY role;

-- 5. Lister tous les utilisateurs récents (derniers 10)
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles 
ORDER BY created_at DESC 
LIMIT 10;
