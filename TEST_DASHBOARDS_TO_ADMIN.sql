-- VÉRIFICATION DOUBLE SENS DASHBOARDS → ADMIN
-- Test que les données des dashboards sont bien visibles en admin

-- 1. Vérifier que tous les champs sont récupérés par l'admin
SELECT 
  'ADMIN_FETCH_TEST' as source,
  COUNT(*) as total_users,
  COUNT(first_name) as users_with_first_name,
  COUNT(last_name) as users_with_last_name,
  COUNT(company_name) as users_with_company_name,
  COUNT(CASE WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN 1 END) as complete_names
FROM profiles;

-- 2. Test de la requête exacte utilisée dans l'admin
SELECT 
  'ADMIN_QUERY_EXACT' as source,
  id,
  email,
  first_name,
  last_name,
  full_name,
  company_name,
  role,
  created_at,
  -- Simulation de la jointure avec professionals
  (SELECT json_build_object(
    'company_name', company_name,
    'status', status,
    'credits_balance', credits_balance
  ) FROM professionals WHERE id = profiles.id) as professional
FROM profiles 
ORDER BY created_at DESC
LIMIT 5;

-- 3. Vérifier la cohérence des données entre tables
SELECT 
  'DATA_CONSISTENCY' as source,
  p.id,
  p.company_name as profile_company,
  pr.company_name as professional_company,
  CASE 
    WHEN p.company_name IS NOT NULL AND pr.company_name IS NOT NULL AND p.company_name != pr.company_name THEN 'INCONSISTENT'
    WHEN p.company_name IS NULL AND pr.company_name IS NOT NULL THEN 'PROFILE_MISSING'
    WHEN p.company_name IS NOT NULL AND pr.company_name IS NULL THEN 'PROFESSIONAL_MISSING'
    ELSE 'CONSISTENT'
  END as consistency_status
FROM profiles p
LEFT JOIN professionals pr ON p.id = pr.id
WHERE p.role = 'professional';

-- 4. Test des messages de bienvenue générés
SELECT 
  'WELCOME_MESSAGES' as source,
  role,
  first_name,
  last_name,
  company_name,
  -- Message pour dashboard particulier
  CASE 
    WHEN role = 'client' THEN '👋 Bienvenue, ' || COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') || ' !'
    ELSE NULL
  END as particulier_message,
  -- Message pour dashboard professionnel
  CASE 
    WHEN role = 'professional' THEN 'Bienvenue, ' || COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') || ' "' || COALESCE(company_name, '') || '"'
    ELSE NULL
  END as professionnel_message
FROM profiles
WHERE first_name IS NOT NULL OR last_name IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- 5. Vérifier que les modifications en admin se répercutent
-- Simulation d'une modification
UPDATE profiles 
SET 
  first_name = 'JeanUpdated',
  last_name = 'DupontUpdated',
  company_name = 'Entreprise Updated'
WHERE email = 'test@exemple.com'
AND EXISTS (SELECT 1 FROM profiles WHERE email = 'test@exemple.com');

-- Vérifier après modification
SELECT 
  'AFTER_UPDATE' as source,
  first_name,
  last_name,
  company_name,
  full_name
FROM profiles 
WHERE email = 'test@exemple.com';
