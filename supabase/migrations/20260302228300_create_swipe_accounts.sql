-- Créer les comptes SwipeTonPro manquants
-- Date: 2026-03-02

-- Vérifier d'abord si les comptes existent déjà
SELECT 'Vérification des comptes existants...' as status;

-- Créer le compte contact@swipetonpro.fr s'il n'existe pas
INSERT INTO profiles (id, email, role, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'contact@swipetonpro.fr',
  'admin',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE email = 'contact@swipetonpro.fr'
);

-- Créer le compte team@swipetonpro.fr s'il n'existe pas
INSERT INTO profiles (id, email, role, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'team@swipetonpro.fr',
  'admin',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE email = 'team@swipetonpro.fr'
);

-- Créer le compte support@swipetonpro.fr s'il n'existe pas
INSERT INTO profiles (id, email, role, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'support@swipetonpro.fr',
  'admin',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE email = 'support@swipetonpro.fr'
);

-- Créer le compte noreply@swipetonpro.fr s'il n'existe pas
INSERT INTO profiles (id, email, role, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'noreply@swipetonpro.fr',
  'admin',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE email = 'noreply@swipetonpro.fr'
);

-- Vérifier les comptes créés
SELECT 
  id,
  email,
  role,
  created_at
FROM profiles 
WHERE email LIKE '%@swipetonpro.fr'
ORDER BY created_at DESC;
