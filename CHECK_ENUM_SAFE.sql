-- SCRIPT SIMPLE POUR VERIFIER L'ENUM SANS ERREUR
-- Utilise une méthode qui ne cause pas d'erreurs d'enum

-- 1. Vérification directe de l'enum (méthode sûre)
SELECT 
  t.typname as enum_name,
  e.enumlabel as enum_value,
  e.enumsortorder as sort_order
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'user_role'
ORDER BY e.enumsortorder;

-- 2. Vérification de votre profil admin (sans tester l'enum)
SELECT id, email, full_name, role, created_at, updated_at
FROM profiles 
WHERE email = 'admin@swipetonpro.fr';

-- 3. Test simple sans utiliser l'enum dans le CASE
SELECT 
  p.role as current_role,
  'ROLE_ACTUEL' as status
FROM profiles p
WHERE email = 'admin@swipotonpro.fr';
