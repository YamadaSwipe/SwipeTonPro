-- 🔍 RECHERCHE DU COMPTE SOTBIRIDA ET DE SES ANNONCES
-- Version SIMPLE avec uniquement les valeurs d'enum garanties
-- Exécuter dans Supabase SQL Editor

-- 1. Trouver l'utilisateur sotbirida
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

-- 4. TOUS LES PROJETS/ANNONCES (valeurs d'enum garanties)
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
    ELSE p.status::text || ' (⚠️ Inconnu)'
  END as display_status
FROM projects p
WHERE p.client_id IN (
  SELECT u.id FROM auth.users u WHERE u.email ILIKE '%sotbirida%'
)
ORDER BY p.created_at DESC;

-- 5. TOUTES LES CANDIDATURES
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

-- 6. RÉCAPITULATIF SIMPLE
SELECT 
  'RÉCAPITULATIF' as info_type,
  'Email trouvé' as label,
  COUNT(u.email)::text as value
FROM auth.users u 
WHERE u.email ILIKE '%sotbirida%'
UNION ALL
SELECT 
  'RÉCAPITULATIF' as info_type,
  'Nombre de projets' as label,
  COUNT(p.id)::text as value
FROM projects p
WHERE p.client_id IN (SELECT u.id FROM auth.users u WHERE u.email ILIKE '%sotbirida%')
UNION ALL
SELECT 
  'RÉCAPITULATIF' as info_type,
  'Nombre de candidatures' as label,
  COUNT(pi.id)::text as value
FROM project_interests pi
WHERE pi.professional_id IN (
  SELECT pr.id FROM professionals pr 
  WHERE pr.user_id IN (SELECT u.id FROM auth.users u WHERE u.email ILIKE '%sotbirida%')
);
