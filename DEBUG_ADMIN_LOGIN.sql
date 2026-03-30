-- VERIFICATION COMPLETE DU PROFIL ADMIN
-- Exécutez ce script pour voir exactement ce qu'il y a

-- 1. Vérification du profil dans profiles
SELECT 'PROFILES TABLE' as source, id, email, full_name, role, created_at, updated_at
FROM profiles 
WHERE email = 'admin@swipotonpro.fr';

-- 2. Vérification dans auth.users
SELECT 'AUTH USERS' as source, id, email, 
       raw_user_meta_data->>'role' as meta_role,
       raw_user_meta_data->>'full_name' as meta_name,
       created_at, last_sign_in_at
FROM auth.users 
WHERE email = 'admin@swipotonpro.fr';

-- 3. Vérification croisée
SELECT 
  p.id as profile_id,
  p.email as profile_email,
  p.role as profile_role,
  au.id as auth_id,
  au.email as auth_email,
  au.raw_user_meta_data->>'role' as auth_meta_role,
  CASE 
    WHEN p.id IS NULL THEN 'PROFILE MANQUANT'
    WHEN p.role IS NULL THEN 'ROLE MANQUANT'
    WHEN p.role != 'super_admin' THEN 'ROLE INCORRECT: ' || p.role
    ELSE 'OK'
  END as status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.email = 'admin@swipotonpro.fr';
