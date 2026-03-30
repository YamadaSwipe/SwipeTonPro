-- VÉRIFICATION DOUBLE SENS ADMIN → DASHBOARDS
-- Test que les données créées/modifiées en admin apparaissent dans les dashboards

-- 1. Créer un utilisateur test depuis l'admin (simulation)
INSERT INTO profiles (
  id, 
  email, 
  first_name, 
  last_name, 
  company_name, 
  full_name, 
  role, 
  created_at
) VALUES (
  gen_random_uuid(),
  'test@exemple.com',
  'Jean',
  'Dupont',
  'Entreprise Test',
  'Jean Dupont',
  'professional',
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- 2. Créer l'entrée professionnelle correspondante
INSERT INTO professionals (
  id, 
  user_id, 
  siret, 
  company_name, 
  status, 
  credits_balance
) SELECT 
  id,
  id,
  'TEST_' || EXTRACT(EPOCH FROM NOW()),
  'Entreprise Test',
  'verified',
  10
FROM profiles 
WHERE email = 'test@exemple.com'
AND NOT EXISTS (SELECT 1 FROM professionals WHERE user_id = profiles.id);

-- 3. Vérifier que l'utilisateur apparaît correctement
SELECT 
  'ADMIN_VIEW' as source,
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.company_name,
  p.full_name,
  p.role,
  pr.company_name as pro_company_name,
  pr.status as pro_status
FROM profiles p
LEFT JOIN professionals pr ON p.id = pr.id
WHERE p.email = 'test@exemple.com';

-- 4. Simuler la requête du dashboard particulier
SELECT 
  'PARTICULIER_DASHBOARD' as source,
  id,
  email,
  first_name,
  last_name,
  full_name,
  role,
  company_name
FROM profiles
WHERE role = 'client'
LIMIT 3;

-- 5. Simuler la requête du dashboard professionnel
SELECT 
  'PROFESSIONNEL_DASHBOARD' as source,
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.company_name,
  p.full_name,
  pr.company_name as professional_company,
  pr.status
FROM profiles p
LEFT JOIN professionals pr ON p.id = pr.id
WHERE p.role = 'professional'
LIMIT 3;

-- 6. Test de personnalisation des messages
SELECT 
  'MESSAGE_PERSONALISATION' as source,
  role,
  CASE 
    WHEN role = 'client' THEN 'Bienvenue, ' || COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') || ' !'
    WHEN role = 'professional' THEN 'Bienvenue, ' || COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') || ' "' || COALESCE(company_name, pr.company_name, '') || '"'
    ELSE 'Bienvenue, ' || COALESCE(full_name, email, '')
  END as message_bienvenue
FROM profiles p
LEFT JOIN professionals pr ON p.id = pr.id
WHERE p.email = 'test@exemple.com';
