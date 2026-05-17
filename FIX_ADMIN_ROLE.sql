-- =====================================================
-- CORRECTION DU RÔLE ADMIN -> SUPER_ADMIN
-- =====================================================

-- 1. Vérifier l'état actuel
SELECT 
  'ÉTAT ACTUEL' as section,
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.created_at
FROM profiles p
WHERE p.email = 'admin@swipetonpro.fr';

-- 2. Mettre à jour le rôle en super_admin
UPDATE profiles
SET 
  role = 'super_admin',
  full_name = 'Super Admin',
  updated_at = NOW()
WHERE email = 'admin@swipetonpro.fr';

-- 3. Vérification après mise à jour
SELECT 
  '✅ RÔLE MIS À JOUR' as status,
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.updated_at
FROM profiles p
WHERE p.email = 'admin@swipetonpro.fr';

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ RÔLE ADMIN MIS À JOUR';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📧 Email: admin@swipetonpro.fr';
  RAISE NOTICE '👤 Rôle: super_admin';
  RAISE NOTICE '========================================';
END;
$$;
