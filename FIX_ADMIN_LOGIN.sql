-- =====================================================
-- FIX IMMÉDIAT - Réinitialisation mot de passe Admin
-- Exécutez ce script dans Supabase SQL Editor
-- =====================================================

-- 1. VÉRIFIER si l'utilisateur existe
SELECT 'UTILISATEUR AUTH' as section, id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'admin@swipetonpro.fr';

-- 2. VÉRIFIER le profil
SELECT 'PROFIL' as section, id, email, full_name, role, created_at 
FROM profiles 
WHERE email = 'admin@swipetonpro.fr';

-- 3. RÉINITIALISER le mot de passe (à exécuter si l'utilisateur existe)
-- Mot de passe: Admin123!
UPDATE auth.users 
SET 
  password_hash = crypt('Admin123!', gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at = NOW()
WHERE email = 'admin@swipetonpro.fr';

-- 4. Créer/mettre à jour le profil si manquant
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
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'admin@swipetonpro.fr')
ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  full_name = 'Super Admin',
  updated_at = NOW();

-- 5. CONFIRMATION
SELECT 
  '✅ CONFIGURATION TERMINÉE' as status,
  au.email,
  au.email_confirmed_at is not null as email_confirmed,
  p.role,
  p.full_name
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.email = 'admin@swipetonpro.fr';

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ ADMIN CONFIGURÉ AVEC SUCCÈS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📧 Email: admin@swipetonpro.fr';
  RAISE NOTICE '🔑 Mot de passe: Admin123!';
  RAISE NOTICE '🌐 URL connexion: http://localhost:3000/auth/login';
  RAISE NOTICE '========================================';
END $$;
