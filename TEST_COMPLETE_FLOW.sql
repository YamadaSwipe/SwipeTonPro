-- VÉRIFICATION COMPLÈTE INTERFACE DOUBLE SENS
-- Test complet de la circulation des données

-- 1. État actuel de toutes les tables
SELECT 
  'CURRENT_STATE' as source,
  'profiles' as table_name,
  COUNT(*) as total_records,
  COUNT(first_name) as with_first_name,
  COUNT(last_name) as with_last_name,
  COUNT(company_name) as with_company_name
FROM profiles

UNION ALL

SELECT 
  'CURRENT_STATE' as source,
  'professionals' as table_name,
  COUNT(*) as total_records,
  0 as with_first_name,
  0 as with_last_name,
  COUNT(company_name) as with_company_name
FROM professionals;

-- 2. Test de création → affichage → modification → suppression
-- Étape 1: Création (simulation admin)
WITH test_user AS (
  INSERT INTO profiles (
    id, email, first_name, last_name, company_name, full_name, role, created_at
  ) VALUES (
    gen_random_uuid(),
    'flowtest@exemple.com',
    'Test',
    'Flow',
    'Flow Company',
    'Test Flow',
    'professional',
    NOW()
  )
  RETURNING id, email, first_name, last_name, company_name, full_name, role
)
SELECT 
  'CREATE_STEP' as source,
  id,
  email,
  first_name,
  last_name,
  company_name,
  full_name,
  role
FROM test_user;

-- Étape 2: Lecture (dashboard)
SELECT 
  'READ_STEP_DASHBOARD' as source,
  id,
  email,
  first_name,
  last_name,
  company_name,
  full_name,
  role,
  'Bienvenue, ' || first_name || ' ' || last_name || ' "' || company_name || '"' as dashboard_message
FROM profiles
WHERE email = 'flowtest@exemple.com';

-- Étape 3: Modification (admin)
UPDATE profiles 
SET 
  first_name = 'TestModified',
  last_name = 'FlowModified',
  company_name = 'Flow Company Modified'
WHERE email = 'flowtest@exemple.com';

SELECT 
  'UPDATE_STEP' as source,
  first_name,
  last_name,
  company_name,
  full_name,
  'Bienvenue, ' || first_name || ' ' || last_name || ' "' || company_name || '"' as updated_message
FROM profiles
WHERE email = 'flowtest@exemple.com';

-- Étape 4: Suppression (admin)
DELETE FROM profiles WHERE email = 'flowtest@exemple.com';

SELECT 
  'DELETE_STEP' as source,
  COUNT(*) as remaining_records
FROM profiles
WHERE email = 'flowtest@exemple.com';

-- 3. Vérification finale de l'intégrité
SELECT 
  'FINAL_CHECK' as source,
  'Data integrity check completed' as status,
  NOW() as timestamp;
