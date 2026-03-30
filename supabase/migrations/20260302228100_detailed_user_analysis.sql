-- Analyse détaillée des utilisateurs et projets
-- Date: 2026-03-02

-- Vérifier tous les utilisateurs avec leurs détails
SELECT 
  id,
  email,
  role,
  created_at,
  CASE 
    WHEN email LIKE '%swipetonpro%' THEN 'Compte interne'
    WHEN email LIKE '%gmail%' THEN 'Gmail'
    WHEN email LIKE '%yahoo%' THEN 'Yahoo'
    WHEN email LIKE '%outlook%' THEN 'Outlook'
    ELSE 'Autre'
  END as email_type
FROM profiles 
ORDER BY created_at DESC;

-- Vérifier les projets par utilisateur
SELECT 
  p.id as project_id,
  p.title,
  p.client_id,
  p.status,
  p.created_at as project_created,
  pr.email as client_email,
  pr.role as client_role
FROM projects p
LEFT JOIN profiles pr ON p.client_id = pr.id
ORDER BY p.created_at DESC;

-- Compter les projets par utilisateur
SELECT 
  pr.email,
  pr.role,
  COUNT(p.id) as project_count,
  MAX(p.created_at) as last_project_date
FROM profiles pr
LEFT JOIN projects p ON pr.id = p.client_id
GROUP BY pr.id, pr.email, pr.role
ORDER BY project_count DESC, last_project_date DESC;
