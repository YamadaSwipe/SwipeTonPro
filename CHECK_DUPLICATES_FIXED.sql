-- VÉRIFICATION COMPLÈTE DES DOUBLONS ET PROBLÈMES (VERSION CORRIGÉE)
-- On vérifie tout ce qui pourrait bloquer la connexion

-- 1. Vérification des doublons dans profiles
SELECT 
  email,
  COUNT(*) as count,
  STRING_AGG(id::text, ', ') as ids
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

-- 4. Vérification simple des profils existants
SELECT COUNT(*) as total_profiles FROM profiles;
SELECT COUNT(*) as total_auth_users FROM auth.users;

-- 5. Vérification des RLS policies (version simple)
SELECT COUNT(*) as rls_policies_count 
FROM pg_policies 
WHERE tablename = 'profiles';

-- MESSAGE
DO $$
BEGIN
    RAISE NOTICE '✅ Script de vérification exécuté !';
    RAISE NOTICE '🔍 Regardez les résultats ci-dessus';
    RAISE NOTICE '🚀 Maintenant testez la connexion avec les logs';
END $$;
