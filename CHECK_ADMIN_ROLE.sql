-- =====================================================
-- VÉRIFICATION DU RÔLE ADMIN@SWIPETONPRO.FR
-- =====================================================

-- 1. Vérifier l'utilisateur dans auth.users
SELECT 
  'AUTH USERS' as section,
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'admin@swipetonpro.fr';

-- 2. Vérifier le profil dans profiles
SELECT 
  'PROFILES' as section,
  id,
  user_id,
  email,
  full_name,
  role,
  created_at,
  updated_at
FROM profiles 
WHERE email = 'admin@swipetonpro.fr';

-- 3. Vérifier s'il y a d'autres profils avec le même user_id
SELECT 
  'PROFILES PAR USER_ID' as section,
  id,
  user_id,
  email,
  role
FROM profiles 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'admin@swipetonpro.fr'
);

-- 4. Vérifier tous les profils admin/super_admin
SELECT 
  'TOUS LES ADMINS' as section,
  id,
  user_id,
  email,
  role,
  created_at
FROM profiles 
WHERE role IN ('admin', 'super_admin')
ORDER BY created_at;
