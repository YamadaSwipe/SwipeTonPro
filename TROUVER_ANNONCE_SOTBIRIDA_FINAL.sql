-- 🔍 RECHERCHE DU COMPTE SOTBIRIDA ET DE SES ANNONCES
-- Exécuter dans Supabase SQL Editor

-- 1. Trouver l'utilisateur sotbirida (toutes les variantes d'email)
SELECT 
  'AUTH USERS' as table_name,
  u.id::text,
  u.email,
  u.created_at,
  u.email_confirmed_at,
  CASE 
    WHEN u.email_confirmed_at IS NOT NULL THEN '✅ Confirmé'
    ELSE '❌ Non confirmé'
  END as status
FROM auth.users u
WHERE u.email ILIKE '%sotbirida%';

-- 2. Vérifier dans profiles
SELECT 
  'PROFILES' as table_name,
  p.id::text,
  p.email,
  p.created_at,
  p.updated_at as email_confirmed_at,
  p.role::text as status
FROM profiles p
WHERE p.email ILIKE '%sotbirida%';

-- 3. Vérifier dans professionals
SELECT 
  'PROFESSIONALS' as table_name,
  pr.id::text,
  pr.company_name as email,
  pr.created_at,
  pr.updated_at as email_confirmed_at,
  pr.status::text as status
FROM professionals pr
WHERE pr.company_name ILIKE '%sotbirida%' OR pr.user_id IN (
  SELECT u.id FROM auth.users u WHERE u.email ILIKE '%sotbirida%'
);

-- 4. TROUVER TOUS LES PROJETS/ANNONCES DE SOTBIRIDA
SELECT 
  'PROJECTS' as table_name,
  p.id::text,
  p.title,
  p.description,
  p.status::text as project_status,
  p.client_id::text,
  p.created_at,
  p.updated_at,
  CASE 
    WHEN p.status = 'published' THEN '📢 Publié'
    WHEN p.status = 'draft' THEN '📝 Brouillon'
    WHEN p.status = 'cancelled' THEN '🔒 Annulé'
    WHEN p.status = 'completed' THEN '✅ Terminé'
    WHEN p.status = 'in_progress' THEN '🚧 En cours'
    WHEN p.status = 'pending_validation' THEN '⏳ En validation'
    WHEN p.status = 'rejected' THEN '❌ Rejeté'
    ELSE p.status::text
  END as display_status
FROM projects p
WHERE p.client_id IN (
  SELECT u.id FROM auth.users u WHERE u.email ILIKE '%sotbirida%'
)
ORDER BY p.created_at DESC;

-- 5. TROUVER TOUTES LES CANDIDATURES/INTERESTS DE SOTBIRIDA
SELECT 
  'PROJECT INTERESTS' as table_name,
  pi.id::text,
  pi.project_id::text,
  pi.professional_id::text,
  pi.status::text,
  pi.created_at,
  proj.title as project_title,
  pr.company_name as professional_name
FROM project_interests pi
LEFT JOIN projects proj ON pi.project_id = proj.id
LEFT JOIN professionals pr ON pi.professional_id = pr.id
WHERE pi.professional_id IN (
  SELECT pr.id FROM professionals pr 
  WHERE pr.user_id IN (SELECT u.id FROM auth.users u WHERE u.email ILIKE '%sotbirida%')
)
ORDER BY pi.created_at DESC;

-- 6. RÉCAPITULATIF COMPLET
WITH user_info AS (
  SELECT u.id, u.email, u.created_at
  FROM auth.users u 
  WHERE u.email ILIKE '%sotbirida%'
  LIMIT 1
)
SELECT 
  'RÉCAPITULATIF' as info_type,
  'Email' as label,
  u.email as value
FROM user_info u
UNION ALL
SELECT 
  'RÉCAPITULATIF' as info_type,
  'User ID' as label,
  u.id::text as value
FROM user_info u
UNION ALL
SELECT 
  'RÉCAPITULATIF' as info_type,
  'Nombre de projets' as label,
  COUNT(p.id)::text as value
FROM projects p
WHERE p.client_id IN (SELECT u.id FROM user_info u)
UNION ALL
SELECT 
  'RÉCAPITULATIF' as info_type,
  'Nombre de candidatures' as label,
  COUNT(pi.id)::text as value
FROM project_interests pi
WHERE pi.professional_id IN (
  SELECT pr.id FROM professionals pr 
  WHERE pr.user_id IN (SELECT u.id FROM user_info u)
);
