-- CRÉATION DU PROFIL ADMIN
-- Remplacez 'ID_COPIÉ_ICI' par l'ID que vous avez copié

INSERT INTO profiles (
  id, 
  email, 
  full_name, 
  role, 
  created_at, 
  updated_at
) VALUES (
  'ID_COPIÉ_ICI',  <-- REMPLACEZ CECI avec l'ID copié
  'admin@swipetonpro.fr',
  'Super Admin',
  'super_admin',
  NOW(),
  NOW()
);

-- Vérification
SELECT id, email, full_name, role, created_at 
FROM profiles 
WHERE email = 'admin@swipetonpro.fr';
