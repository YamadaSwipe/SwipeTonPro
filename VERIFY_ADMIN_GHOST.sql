-- =====================================================
-- VÉRIFICATION ADMIN FANTÔME
-- =====================================================

-- 1. Vérifier si l'admin fantôme existe
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM profiles WHERE id = '00000000-0000-0000-0000-000000000001')
    THEN '✅ ADMIN FANTÔME EXISTE'
    ELSE '❌ ADMIN FANTÔME MANQUANT'
  END as status;

-- 2. Détails de l'admin fantôme
SELECT 
  'DÉTAILS ADMIN' as section,
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 3. Créer l'admin fantôme s'il n'existe pas
INSERT INTO profiles (
  id, 
  email, 
  full_name, 
  role, 
  created_at, 
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@swipetonpro.fr',
  'Super Admin',
  'super_admin',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = 'admin@swipetonpro.fr',
  full_name = 'Super Admin',
  role = 'super_admin',
  updated_at = NOW();

-- 4. Confirmation finale
SELECT 
  '✅ CONFIGURATION TERMINÉE' as status,
  id,
  email,
  role
FROM profiles 
WHERE id = '00000000-0000-0000-0000-000000000001';
