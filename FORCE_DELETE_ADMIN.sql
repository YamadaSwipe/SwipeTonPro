-- SUPPRESSION FORCÉE DU PROFIL ADMIN
-- On utilise une méthode plus agressive

-- 1. Vérifions d'abord ce qui existe
SELECT 'AVANT SUPPRESSION' as status, id, email, role, created_at
FROM profiles 
WHERE email = 'admin@swipotonpro.fr';

-- 2. Suppression explicite avec l'ID
DELETE FROM profiles 
WHERE id = '55101558-7c22-45be-baff-4688b1419b3d';

-- 3. Vérifions que c'est bien supprimé
SELECT 'APRÈS SUPPRESSION' as status, COUNT(*) as count
FROM profiles 
WHERE id = '55101558-7c22-45be-baff-4688b1419b3d';

-- 4. Maintenant recréons le profil
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

-- 5. Vérification finale
SELECT 'PROFIL RECRÉÉ' as status, id, email, full_name, role, created_at, updated_at
FROM profiles 
WHERE email = 'admin@swipotonpro.fr';

-- MESSAGE
DO $$
BEGIN
    RAISE NOTICE '✅ Suppression forcée effectuée !';
    RAISE NOTICE '🔄 Profil admin recréé proprement';
    RAISE NOTICE '🎯 Testez la connexion maintenant';
END $$;
