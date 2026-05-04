-- =====================================================
-- CRÉATION PROFIL ADMIN (après création manuelle utilisateur)
-- À exécuter SEULEMENT après avoir créé l'utilisateur dans l'interface
-- =====================================================

-- 1. Vérifier que l'utilisateur existe dans auth.users
SELECT 'UTILISATEUR AUTH' as section, id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'admin@swipetonpro.fr';

-- 2. Créer le profil admin correspondant
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

-- 3. Vérification finale
SELECT 
  '✅ PROFIL ADMIN CRÉÉ' as status,
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.created_at,
  au.email_confirmed_at is not null as email_confirme
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE p.email = 'admin@swipetonpro.fr';

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ PROFIL ADMIN CONFIGURÉ';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📧 Email: admin@swipetonpro.fr';
  RAISE NOTICE '👤 Rôle: super_admin';
  RAISE NOTICE '🔑 Mot de passe: Admin123!';
  RAISE NOTICE '🌐 URL connexion: http://localhost:3000/auth/login';
  RAISE NOTICE '========================================';
END;
$$;
