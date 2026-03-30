-- SCRIPT CORRIGÉ POUR SYNCHRONISER TOUS LES UTILISATEURS
-- Avec les bons types de données pour la colonne role

-- 1. D'abord, vérifions le type exact de la colonne role
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'role';

-- 2. Vérifions les valeurs possibles de l'enum user_role
SELECT unnest(enumrange(NULL::user_role)) as possible_roles;

-- 3. Script de synchronisation CORRIGÉ
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  CASE 
    WHEN au.email = 'admin@swipotonpro.fr' THEN 'super_admin'::user_role
    WHEN au.email LIKE '%admin%' THEN 'admin'::user_role
    WHEN au.email LIKE '%support%' THEN 'support'::user_role
    ELSE 'client'::user_role
  END,
  au.created_at,
  NOW()
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM profiles);

-- 4. Version alternative si l'enum ne fonctionne pas
-- D'abord créons les profils avec role 'client' par défaut
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  'client',
  au.created_at,
  NOW()
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM profiles);

-- 5. Puis mettons à jour les rôles spécifiques
UPDATE profiles 
SET role = 'super_admin'::user_role 
WHERE email = 'admin@swipotonpro.fr';

UPDATE profiles 
SET role = 'admin'::user_role 
WHERE email LIKE '%admin%' AND email != 'admin@swipotonpro.fr';

UPDATE profiles 
SET role = 'support'::user_role 
WHERE email LIKE '%support%';

-- 6. Vérification finale
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

-- 7. Liste des profils avec rôles
SELECT id, email, full_name, role, created_at 
FROM profiles 
ORDER BY created_at DESC;

-- MESSAGE
DO $$
BEGIN
    RAISE NOTICE '✅ Script de synchronisation corrigé exécuté !';
    RAISE NOTICE '🔄 Les types de données ont été corrigés';
    RAISE NOTICE '📋 Vérifiez les résultats ci-dessus';
END $$;
