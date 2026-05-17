-- =====================================================
-- CORRECTION DU USER_ID POUR ADMIN@SWIPETONPRO.FR
-- =====================================================

-- 1. Récupérer l'ID de l'utilisateur dans auth.users
DO $$
DECLARE
  user_uuid UUID;
BEGIN
  SELECT id INTO user_uuid
  FROM auth.users
  WHERE email = 'admin@swipetonpro.fr'
  LIMIT 1;
  
  RAISE NOTICE 'User UUID: %', user_uuid;
  
  -- 2. Mettre à jour le profil avec le bon user_id
  UPDATE profiles
  SET user_id = user_uuid,
      updated_at = NOW()
  WHERE email = 'admin@swipetonpro.fr';
  
  RAISE NOTICE '✅ user_id mis à jour pour admin@swipetonpro.fr';
END $$;

-- 3. Vérification
SELECT 
  '✅ VÉRIFICATION' as status,
  p.id,
  p.user_id,
  p.email,
  p.role,
  au.id as auth_user_id
FROM profiles p
LEFT JOIN auth.users au ON p.email = au.email
WHERE p.email = 'admin@swipetonpro.fr';
