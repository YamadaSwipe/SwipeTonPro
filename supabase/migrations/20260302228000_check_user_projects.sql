-- Vérifier les projets de l'utilisateur courant
-- Date: 2026-03-02

-- Vérifier tous les projets avec leur client_id
SELECT 
  id,
  title,
  client_id,
  status,
  created_at,
  city,
  category
FROM projects 
ORDER BY created_at DESC 
LIMIT 10;

-- Vérifier les profils utilisateurs
SELECT 
  id,
  email,
  role,
  created_at
FROM profiles 
ORDER BY created_at DESC 
LIMIT 5;
