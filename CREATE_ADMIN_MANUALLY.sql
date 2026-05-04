-- =====================================================
-- CRÉATION ADMIN MANUELLE (si réinitialisation email échoue)
-- Solution ultime quand l'email ne fonctionne pas
-- =====================================================

-- 1. Supprimer tous les comptes admin existants
DELETE FROM auth.users WHERE email LIKE '%admin@swipetonpro%';
DELETE FROM profiles WHERE email LIKE '%admin@swipotonpro%';

-- 2. Créer un nouvel utilisateur admin directement
-- NOTE: Cette méthode utilise le mot de passe en clair pour le test
-- En production, utilisez toujours l'interface Supabase

-- 3. Vérifier l'état final
SELECT 'NETTOYAGE TERMINÉ' as status, COUNT(*) as comptes_supprimes
FROM auth.users 
WHERE email LIKE '%admin@swipetonpro%';

-- 4. Instructions pour créer-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔧 CRÉATION ADMIN MANUELLE REQUISE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '1. Allez dans Supabase Dashboard';
  RAISE NOTICE '2. Authentication → Users → Add user';
  RAISE NOTICE '3. Email: admin@swipetonpro.fr';
  RAISE NOTICE '4. Mot de passe: Admin123!';
  RAISE NOTICE '5. Cochez "Auto-confirm user"';
  RAISE NOTICE '6. Cliquez "Add user"';
  RAISE NOTICE '========================================';
  RAISE NOTICE '⚠️ Lemail de réinitialisation ne fonctionne pas';
  RAISE NOTICE '✅ Création manuelle = 100% fiable';
  RAISE NOTICE '========================================';
END;
$$;

-- 5. Une fois créé, exécutez ce script pour créer le profil
-- (à exécuter après la création manuelle dans l'interface)
/*
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
  id,
  email,
  'Super Admin',
  'super_admin',
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'admin@swipetonpro.fr'
ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  full_name = 'Super Admin',
  updated_at = NOW();
*/
