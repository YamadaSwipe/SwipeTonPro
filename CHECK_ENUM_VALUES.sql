-- SCRIPT POUR VERIFIER L'ENUM USER_ROLE
-- Vérifions les valeurs exactes autorisées

-- 1. Vérification du type enum
SELECT 
  t.typname as enum_name,
  e.enumlabel as enum_value,
  e.enumsortorder as sort_order
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'user_role'
ORDER BY e.enumsortorder;

-- 2. Vérification de votre profil admin
SELECT id, email, full_name, role, created_at, updated_at
FROM profiles 
WHERE email = 'admin@swipotonpro.fr';

-- 3. Test avec seulement les valeurs valides
SELECT 
  p.role,
  CASE 
    WHEN p.role IN ('super_admin', 'admin', 'moderator') THEN '✅ AUTORISÉ'
    ELSE '❌ NON AUTORISÉ - Valeur: ' || COALESCE(p.role, 'NULL')
  END as middleware_status
FROM profiles p
WHERE email = 'admin@swipotonpro.fr';
