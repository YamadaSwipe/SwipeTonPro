-- 🚨 RECRÉATION COMPLÈTE D'UN COMPTE ADMIN
-- À utiliser quand AUCUN admin valide n'existe

-- ÉTAPE 1: Vérifier l'état actuel
SELECT 
  'Utilisateurs admin dans auth.users' as type,
  COUNT(*) as count
FROM auth.users
WHERE email LIKE '%admin%'
UNION ALL
SELECT 
  'Profils admin dans profiles' as type,
  COUNT(*) as count
FROM profiles
WHERE role = 'admin'
UNION ALL
SELECT 
  'Admins valides (auth + profil)' as type,
  COUNT(*) as count
FROM profiles p
INNER JOIN auth.users au ON p.id = au.id
WHERE p.role = 'admin';

-- ÉTAPE 2: Nettoyer les profils orphelins (profils sans utilisateur auth)
DELETE FROM profiles
WHERE id NOT IN (SELECT id FROM auth.users)
AND role = 'admin';

-- ÉTAPE 3: Créer un nouvel utilisateur admin dans auth.users
-- ⚠️ IMPORTANT: Remplacez l'email et le mot de passe ci-dessous
DO $$
DECLARE
  new_admin_id UUID;
  admin_email TEXT := 'admin@swipetonpro.com'; -- ← CHANGEZ ICI
  admin_password TEXT := 'Admin123!SecurePass'; -- ← CHANGEZ ICI
BEGIN
  -- Générer un nouvel ID
  new_admin_id := gen_random_uuid();
  
  -- Créer l'utilisateur dans auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_admin_id,
    'authenticated',
    'authenticated',
    admin_email,
    crypt(admin_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"admin"}'::jsonb,
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );
  
  -- Créer le profil correspondant
  INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
  ) VALUES (
    new_admin_id,
    admin_email,
    'Administrateur Principal',
    'admin',
    NOW(),
    NOW()
  );
  
  RAISE NOTICE '✅ Admin créé avec succès!';
  RAISE NOTICE 'Email: %', admin_email;
  RAISE NOTICE 'ID: %', new_admin_id;
  RAISE NOTICE 'Mot de passe: (celui que vous avez défini)';
END $$;

-- ÉTAPE 4: Vérifier que l'admin a bien été créé
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  au.email_confirmed_at,
  au.created_at,
  '✅ Admin créé avec succès' as status
FROM profiles p
INNER JOIN auth.users au ON p.id = au.id
WHERE p.role = 'admin'
ORDER BY p.created_at DESC
LIMIT 1;

-- ÉTAPE 5: Vérifier le nombre total d'admins
SELECT 
  COUNT(*) as total_admins_valides,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Au moins un admin existe'
    ELSE '❌ AUCUN ADMIN'
  END as status
FROM profiles p
INNER JOIN auth.users au ON p.id = au.id
WHERE p.role = 'admin';
