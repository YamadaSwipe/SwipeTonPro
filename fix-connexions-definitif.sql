-- 🔧 CORRECTION DÉFINITIVE DES PROBLÈMES DE CONNEXION
-- Basé sur le diagnostic réel

-- PROBLÈME IDENTIFIÉ:
-- 1. admin@swipetonpro.fr: ❌ PAS DE PROFIL (utilisateur auth existe mais pas de profil)
-- 2. sotbirida@gmail.com: ✅ Compte complet (professional)
-- 3. sotbirida@yahoo.fr: ✅ Compte complet (client)

-- ========================================
-- PARTIE 1: CRÉER LE PROFIL ADMIN MANQUANT
-- ========================================

-- Récupérer l'ID de l'utilisateur admin@swipetonpro.fr
DO $$
DECLARE
  admin_user_id UUID;
  admin_email TEXT := 'admin@swipetonpro.fr';
BEGIN
  -- Récupérer l'ID de l'utilisateur
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email;
  
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur % non trouvé dans auth.users', admin_email;
  END IF;
  
  RAISE NOTICE 'Utilisateur trouvé: ID=%', admin_user_id;
  
  -- Créer le profil admin
  INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
  ) VALUES (
    admin_user_id,
    admin_email,
    'Administrateur Principal',
    'admin',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    email = admin_email,
    updated_at = NOW();
  
  RAISE NOTICE '✅ Profil admin créé/mis à jour avec succès!';
  RAISE NOTICE 'Email: %', admin_email;
  RAISE NOTICE 'ID: %', admin_user_id;
END $$;

-- ========================================
-- PARTIE 2: VÉRIFIER LES COMPTES SOTBIRIDA
-- ========================================

-- Vérifier pourquoi les connexions échouent malgré "Compte complet"
SELECT 
  au.id,
  au.email,
  au.email_confirmed_at,
  au.last_sign_in_at,
  au.encrypted_password IS NOT NULL as has_password,
  p.role,
  p.full_name,
  CASE 
    WHEN au.banned_until IS NOT NULL AND au.banned_until > NOW() THEN '❌ Compte banni'
    WHEN au.email_confirmed_at IS NULL THEN '❌ Email non confirmé'
    WHEN au.encrypted_password IS NULL THEN '❌ Pas de mot de passe'
    ELSE '✅ Devrait fonctionner'
  END as status_connexion
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.email IN ('sotbirida@gmail.com', 'sotbirida@yahoo.fr')
ORDER BY au.email;

-- ========================================
-- PARTIE 3: FORCER LA CONFIRMATION EMAIL (si nécessaire)
-- ========================================

-- Si les emails ne sont pas confirmés, les confirmer
UPDATE auth.users
SET 
  email_confirmed_at = NOW(),
  confirmation_token = '',
  updated_at = NOW()
WHERE email IN ('admin@swipetonpro.fr', 'sotbirida@gmail.com', 'sotbirida@yahoo.fr')
AND email_confirmed_at IS NULL;

-- ========================================
-- PARTIE 4: CRÉER/METTRE À JOUR LES IDENTITÉS
-- ========================================

-- S'assurer que les identités existent pour chaque utilisateur
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  au.id,
  jsonb_build_object(
    'sub', au.id::text,
    'email', au.email,
    'email_verified', true,
    'provider', 'email'
  ),
  'email',
  NOW(),
  NOW(),
  NOW()
FROM auth.users au
WHERE au.email IN ('admin@swipetonpro.fr', 'sotbirida@gmail.com', 'sotbirida@yahoo.fr')
AND NOT EXISTS (
  SELECT 1 FROM auth.identities i 
  WHERE i.user_id = au.id AND i.provider = 'email'
);

-- ========================================
-- PARTIE 5: NETTOYER LES SESSIONS EXPIRÉES
-- ========================================

-- Supprimer les anciennes sessions qui pourraient causer des problèmes
DELETE FROM auth.sessions
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('admin@swipetonpro.fr', 'sotbirida@gmail.com', 'sotbirida@yahoo.fr')
)
AND not_after < NOW();

-- ========================================
-- PARTIE 6: VÉRIFICATION FINALE
-- ========================================

SELECT 
  au.email,
  au.email_confirmed_at IS NOT NULL as email_confirmed,
  au.encrypted_password IS NOT NULL as has_password,
  p.id IS NOT NULL as has_profile,
  p.role,
  i.provider IS NOT NULL as has_identity,
  CASE 
    WHEN au.email_confirmed_at IS NULL THEN '❌ Email non confirmé'
    WHEN au.encrypted_password IS NULL THEN '❌ Pas de mot de passe'
    WHEN p.id IS NULL THEN '❌ Pas de profil'
    WHEN i.provider IS NULL THEN '❌ Pas d''identité'
    ELSE '✅ TOUT EST OK - Connexion devrait fonctionner'
  END as status_final
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
LEFT JOIN auth.identities i ON au.id = i.user_id AND i.provider = 'email'
WHERE au.email IN ('admin@swipetonpro.fr', 'sotbirida@gmail.com', 'sotbirida@yahoo.fr')
ORDER BY au.email;

-- ========================================
-- PARTIE 7: AFFICHER LES INFORMATIONS DE CONNEXION
-- ========================================

SELECT 
  email,
  'Utilisez ce mot de passe: ' || 
  CASE 
    WHEN email = 'admin@swipetonpro.fr' THEN 'Admin1980'
    WHEN email = 'sotbirida@gmail.com' THEN 'Votre mot de passe actuel'
    WHEN email = 'sotbirida@yahoo.fr' THEN 'Le nouveau mot de passe après réinitialisation'
  END as instruction
FROM auth.users
WHERE email IN ('admin@swipetonpro.fr', 'sotbirida@gmail.com', 'sotbirida@yahoo.fr')
ORDER BY email;
