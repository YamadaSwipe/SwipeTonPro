-- VÉRIFICATION COMPLÈTE DES DOUBLONS ET PROBLÈMES
-- On vérifie tout ce qui pourrait bloquer la connexion

-- 1. Vérification des doublons dans profiles
SELECT 
  email,
  COUNT(*) as count,
  STRING_AGG(id, ', ') as ids
FROM profiles 
GROUP BY email 
HAVING COUNT(*) > 1;

-- 2. Vérification des doublons dans auth.users
SELECT 
  email,
  COUNT(*) as count,
  STRING_AGG(id::text, ', ') as ids
FROM auth.users 
GROUP BY email 
HAVING COUNT(*) > 1;

-- 3. Vérification spécifique pour admin@swipotonpro.fr
SELECT 'PROFILES TABLE' as source, id, email, full_name, role, created_at, updated_at
FROM profiles 
WHERE email = 'admin@swipotonpro.fr'
UNION ALL
SELECT 'AUTH USERS' as source, id::text, email, 
       raw_user_meta_data->>'full_name' as full_name,
       raw_user_meta_data->>'role' as role,
       created_at, last_sign_in_at
FROM auth.users 
WHERE email = 'admin@swipotonpro.fr';

-- 4. Vérification des ports et connexions actives
-- (Cette requête vérifie s'il y a des connexions bloquantes)
SELECT 
  datname as database,
  usename as user,
  application_name,
  state,
  query_start,
  state_change,
  query
FROM pg_stat_activity 
WHERE state != 'idle' 
AND datname = 'postgres'
ORDER BY query_start;

-- 5. Vérification des RLS policies qui pourraient bloquer
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';
