-- Vérifier les adresses emails SwipeTonPro
-- Date: 2026-03-02

-- Vérifier les emails SwipeTonPro dans les profils
SELECT 
  id,
  email,
  role,
  created_at,
  CASE 
    WHEN email LIKE '%@swipetonpro.fr' THEN 'Email SwipeTonPro'
    ELSE 'Email externe'
  END as email_category
FROM profiles 
WHERE email LIKE '%@swipetonpro.fr'
ORDER BY created_at DESC;

-- Vérifier les emails SwipeTonPro dans les projets
SELECT 
  p.id as project_id,
  p.title,
  p.client_id,
  p.created_at as project_created,
  pr.email as client_email,
  pr.role as client_role,
  CASE 
    WHEN pr.email LIKE '%@swipetonpro.fr' THEN 'Email SwipeTonPro'
    ELSE 'Email externe'
  END as email_category
FROM projects p
JOIN profiles pr ON p.client_id = pr.id
WHERE pr.email LIKE '%@swipetonpro.fr'
ORDER BY p.created_at DESC;

-- Compter les projets par email SwipeTonPro
SELECT 
  pr.email,
  pr.role,
  COUNT(p.id) as project_count,
  MAX(p.created_at) as last_project_date
FROM profiles pr
LEFT JOIN projects p ON pr.id = p.client_id
WHERE pr.email LIKE '%@swipetonpro.fr'
GROUP BY pr.id, pr.email, pr.role
ORDER BY project_count DESC;
