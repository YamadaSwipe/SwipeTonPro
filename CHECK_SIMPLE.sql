-- VÉRIFICATION SIMPLE SANS ERREURS
-- Version qui fonctionne à coup sûr

-- 1. Vérification des doublons dans profiles
SELECT 
  email,
  COUNT(*) as count
FROM profiles 
GROUP BY email 
HAVING COUNT(*) > 1;

-- 2. Vérification spécifique pour admin@swipotonpro.fr dans profiles
SELECT id, email, full_name, role, created_at, updated_at
FROM profiles 
WHERE email = 'admin@swipotonpro.fr';

-- 3. Vérification spécifique pour admin@swipotonpro.fr dans auth
SELECT id, email, created_at, last_sign_in_at, confirmed_at
FROM auth.users 
WHERE email = 'admin@swipotonpro.fr';

-- 4. Comptage total
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'auth_users' as table_name, COUNT(*) as count FROM auth.users;

-- MESSAGE
DO $$
BEGIN
    RAISE NOTICE '✅ Script simple exécuté !';
    RAISE NOTICE '🔍 Maintenant testez la connexion';
END $$;
