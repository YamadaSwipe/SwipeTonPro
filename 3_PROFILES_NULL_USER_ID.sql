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
