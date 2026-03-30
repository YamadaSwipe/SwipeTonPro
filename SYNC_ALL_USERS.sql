-- SCRIPT POUR VERIFIER ET CORRIGER TOUS LES UTILISATEURS EXISTANTS
-- Compare auth.users avec profiles et crée les profils manquants

-- 1. D'abord, voyons tous les profils existants
SELECT id, email, full_name, role, created_at 
FROM profiles 
ORDER BY created_at DESC;

-- 2. Maintenant, vérifions les utilisateurs Auth qui n'ont pas de profil
-- Cette requête va nous montrer qui manque
SELECT 
  au.id as auth_id,
  au.email as auth_email,
  au.created_at as auth_created,
  p.id as profile_id,
  p.email as profile_email,
  p.role as profile_role
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC;

-- 3. Pour chaque utilisateur manquant trouvé, créons son profil
-- Adaptez ces commandes selon les utilisateurs trouvés ci-dessus

-- Exemple 1: Pour support@swipetonpro.fr (s'il manque)
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email),
  CASE 
    WHEN email = 'admin@swipetonpro.fr' THEN 'super_admin'
    WHEN email = 'support@swipotonpro.fr' THEN 'support'
    WHEN email LIKE '%admin%' THEN 'admin'
    WHEN email LIKE '%support%' THEN 'support'
    ELSE 'client'
  END,
  created_at,
  NOW()
FROM auth.users 
WHERE email = 'support@swipotonpro.fr'
AND id NOT IN (SELECT id FROM profiles);

-- Exemple 2: Pour team@swipetonpro.fr (s'il manque)
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email),
  CASE 
    WHEN email = 'admin@swipotonpro.fr' THEN 'super_admin'
    WHEN email = 'support@swipotonpro.fr' THEN 'support'
    WHEN email LIKE '%admin%' THEN 'admin'
    WHEN email LIKE '%support%' THEN 'support'
    ELSE 'client'
  END,
  created_at,
  NOW()
FROM auth.users 
WHERE email = 'team@swipotonpro.fr'
AND id NOT IN (SELECT id FROM profiles);

-- 4. Script automatique pour TOUS les utilisateurs manquants
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  CASE 
    WHEN au.email = 'admin@swipotonpro.fr' THEN 'super_admin'
    WHEN au.email = 'support@swipotonpro.fr' THEN 'support'
    WHEN au.email LIKE '%admin%' THEN 'admin'
    WHEN au.email LIKE '%support%' THEN 'support'
    ELSE 'client'
  END,
  au.created_at,
  NOW()
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM profiles);

-- 5. Vérification finale
SELECT 
  'Utilisateurs totaux dans Auth' as type,
  COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
  'Profils totaux créés' as type,
  COUNT(*) as count
FROM profiles
UNION ALL
SELECT 
  'Profils manquants' as type,
  COUNT(*) as count
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM profiles);

-- MESSAGE
DO $$
BEGIN
    RAISE NOTICE '✅ Script de synchronisation exécuté !';
    RAISE NOTICE '🔄 Les utilisateurs manquants ont été créés automatiquement';
    RAISE NOTICE '📋 Vérifiez les résultats ci-dessus';
END $$;
