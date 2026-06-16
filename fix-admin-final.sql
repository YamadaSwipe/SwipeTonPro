-- 🔧 CORRECTION FINALE - Profil orphelin existe déjà
-- Le profil existe mais l'utilisateur auth a été supprimé

-- ÉTAPE 1: Identifier le profil orphelin
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  CASE 
    WHEN au.id IS NULL THEN '❌ PROFIL ORPHELIN - Utilisateur auth supprimé'
    ELSE '✅ OK'
  END as status
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.role = 'admin';

-- ÉTAPE 2: Recréer l'utilisateur auth pour le profil orphelin existant
-- ⚠️ IMPORTANT: Remplacez l'email et le mot de passe ci-dessous
DO $$
DECLARE
  orphan_profile_id UUID;
  orphan_email TEXT;
  admin_password TEXT := 'Admin123!SecurePass'; -- ← CHANGEZ ICI votre mot de passe
BEGIN
  -- Récupérer l'ID et l'email du profil orphelin
  SELECT id, email INTO orphan_profile_id, orphan_email
  FROM profiles
  WHERE role = 'admin'
  AND id NOT IN (SELECT id FROM auth.users)
  LIMIT 1;
  
  IF orphan_profile_id IS NULL THEN
    RAISE EXCEPTION 'Aucun profil orphelin trouvé';
  END IF;
  
  RAISE NOTICE 'Profil orphelin trouvé: ID=%, Email=%', orphan_profile_id, orphan_email;
  
  -- Créer l'utilisateur auth avec le MÊME ID que le profil
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
    orphan_profile_id, -- ← Utilise le MÊME ID que le profil
    'authenticated',
    'authenticated',
    orphan_email,
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
  
  RAISE NOTICE '✅ Utilisateur auth recréé avec succès!';
  RAISE NOTICE 'Email: %', orphan_email;
  RAISE NOTICE 'ID: %', orphan_profile_id;
  RAISE NOTICE 'Mot de passe: (celui que vous avez défini)';
END $$;

-- ÉTAPE 3: Vérifier que tout est synchronisé
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  au.email_confirmed_at,
  au.last_sign_in_at,
  CASE 
    WHEN au.id IS NOT NULL THEN '✅ ADMIN VALIDE - Synchronisé'
    ELSE '❌ PROBLÈME'
  END as status
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.role = 'admin';

-- ÉTAPE 4: Compter les admins valides
SELECT 
  COUNT(*) as total_admins_valides,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Au moins un admin existe'
    ELSE '❌ AUCUN ADMIN'
  END as status
FROM profiles p
INNER JOIN auth.users au ON p.id = au.id
WHERE p.role = 'admin';
