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
