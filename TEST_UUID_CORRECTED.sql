-- SCRIPT DE TEST CORRIGÉ POUR UUID
-- Version corrigée qui utilise gen_random_uuid() au lieu de texte

-- 1. Créer un utilisateur test valide
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
) ON CONFLICT (email) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  company_name = EXCLUDED.company_name,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- 2. Créer l'entrée professionnelle correspondante
INSERT INTO professionals (
  id, 
  user_id, 
  siret, 
  company_name, 
  status, 
  credits_balance
) SELECT 
  p.id,
  p.id,
  'TEST_' || EXTRACT(EPOCH FROM NOW()),
  p.company_name,
  'verified',
  10
FROM profiles p
WHERE p.email = 'test@exemple.com'
AND NOT EXISTS (SELECT 1 FROM professionals WHERE user_id = p.id);

-- 3. Vérification simple
SELECT 
  'TEST_RESULT' as source,
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.company_name,
  p.full_name,
  p.role,
  CASE 
    WHEN p.role = 'client' THEN '👋 Bienvenue, ' || COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '') || ' !'
    WHEN p.role = 'professional' THEN 'Bienvenue, ' || COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '') || ' "' || COALESCE(p.company_name, '') || '"'
    ELSE 'Bienvenue, ' || COALESCE(p.full_name, p.email, '')
  END as message_bienvenue
FROM profiles p
LEFT JOIN professionals pr ON p.id = pr.id
WHERE p.email = 'test@exemple.com';

-- 4. Nettoyage (optionnel)
-- DELETE FROM profiles WHERE email = 'test@exemple.com';
