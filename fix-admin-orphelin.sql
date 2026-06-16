-- CORRECTION DU PROBLÈME DE PROFIL ORPHELIN ADMIN
-- Ce script corrige le problème causé par la suppression d'un compte admin en double

-- ÉTAPE 1: Supprimer les profils orphelins (profils sans utilisateur auth correspondant)
-- Cela évite la boucle infinie car le système cherche un utilisateur qui n'existe plus
DELETE FROM profiles
WHERE id NOT IN (SELECT id FROM auth.users)
AND role = 'admin';

-- ÉTAPE 2: Vérifier qu'il reste au moins un admin valide
DO $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count
  FROM profiles p
  INNER JOIN auth.users au ON p.id = au.id
  WHERE p.role = 'admin';
  
  IF admin_count = 0 THEN
    RAISE EXCEPTION 'ATTENTION: Aucun admin valide trouvé! Ne pas exécuter ce script sans créer un admin d''abord.';
  ELSE
    RAISE NOTICE 'OK: % admin(s) valide(s) trouvé(s)', admin_count;
  END IF;
END $$;

-- ÉTAPE 3: Afficher les admins restants
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  au.email_confirmed_at,
  au.last_sign_in_at,
  '✅ Admin valide' as status
FROM profiles p
INNER JOIN auth.users au ON p.id = au.id
WHERE p.role = 'admin'
ORDER BY p.created_at DESC;

-- ÉTAPE 4: Si vous avez besoin de créer un nouvel admin, utilisez ce template:
/*
-- Remplacer les valeurs ci-dessous
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  role,
  aud,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin@swipetonpro.com',
  crypt('VotreMotDePasseSecurise123!', gen_salt('bf')),
  NOW(),
  '{"role": "admin"}'::jsonb,
  'authenticated',
  'authenticated',
  NOW(),
  NOW()
) RETURNING id;

-- Puis créer le profil correspondant avec l'ID retourné ci-dessus
INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
) VALUES (
  'ID_RETOURNÉ_CI_DESSUS',
  'admin@swipetonpro.com',
  'Administrateur',
  'admin',
  NOW(),
  NOW()
);
*/
