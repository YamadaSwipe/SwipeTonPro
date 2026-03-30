-- SOLUTION RADICALE : SUPPRIMER ET RECRÉER LE PROFIL ADMIN
-- On repart à zéro pour le compte admin

-- 1. D'abord, supprimons le profil admin existant
DELETE FROM profiles 
WHERE email = 'admin@swipotonpro.fr';

-- 2. Vérifions qu'il est bien supprimé
SELECT 'PROFIL SUPPRIMÉ' as status, COUNT(*) as count
FROM profiles 
WHERE email = 'admin@swipotonpro.fr';

-- 3. Recréons le profil admin proprement
INSERT INTO profiles (
  id, 
  email, 
  full_name, 
  role, 
  created_at, 
  updated_at
) VALUES (
  '55101558-7c22-45be-baff-4688b1419b3d',
  'admin@swipotonpro.fr',
  'Super Admin',
  'super_admin',
  '2026-02-25 02:54:04.864449+00',
  NOW()
);

-- 4. Vérifions que le profil est bien créé
SELECT 'PROFIL RECRÉÉ' as status, id, email, full_name, role, created_at, updated_at
FROM profiles 
WHERE email = 'admin@swipotonpro.fr';

-- 5. Vérifions aussi l'utilisateur Auth
SELECT 'AUTH USER' as status, id, email, confirmed_at, last_sign_in_at
FROM auth.users 
WHERE email = 'admin@swipotonpro.fr';

-- MESSAGE
DO $$
BEGIN
    RAISE NOTICE '✅ Profil admin supprimé et recréé !';
    RAISE NOTICE '🔄 Testez la connexion maintenant';
    RAISE NOTICE '🎯 Le problème devrait être résolu';
END $$;
