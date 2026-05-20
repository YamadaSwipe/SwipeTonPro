-- =====================================================
-- VÉRIFICATION COMPLÈTE DU COMPTE ADMIN
-- =====================================================

-- 1. Vérifier l'utilisateur dans auth.users
SELECT 
  'AUTH USERS' as section,
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
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

-- 3. Vérifier s'il y a des profils avec user_id NULL
SELECT 
  'PROFILES NULL USER_ID' as section,
  id,
  user_id,
  email,
  role,
  created_at
FROM profiles 
WHERE user_id IS NULL AND email = 'admin@swipetonpro.fr';

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

-- 5. Compter les profils avec l'email admin
SELECT 
  'COUNT ADMIN PROFILES' as section,
  COUNT(*) as count,
  email
FROM profiles 
WHERE email = 'admin@swipetonpro.fr'
GROUP BY email;

-- 6. Vérifier s'il y a des duplicats
SELECT 
  email,
  COUNT(*) as count,
  STRING_AGG(id::text, ', ') as ids,
  STRING_AGG(role::text, ', ') as roles
FROM profiles 
WHERE email = 'admin@swipetonpro.fr'
GROUP BY email
HAVING COUNT(*) > 1;
