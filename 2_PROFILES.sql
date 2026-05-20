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
