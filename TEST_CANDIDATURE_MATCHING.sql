-- 🧪 TEST DES CANDIDATURES ET MATCHING
-- Vérifier si le système de candidature fonctionne

-- 1. Vérifier les tables de candidature/matching
SELECT 
  'TABLES EXISTANTES' as info_type,
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
  table_name ILIKE '%interest%' OR 
  table_name ILIKE '%match%' OR
  table_name ILIKE '%candidature%'
)
ORDER BY table_name;

-- 2. Vérifier les colonnes de la table project_interests
SELECT 
  'COLONNES project_interests' as info_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'project_interests'
ORDER BY ordinal_position;

-- 3. Voir toutes les candidatures existantes
SELECT 
  'CANDIDATURES EXISTANTES' as info_type,
  pi.id,
  pi.project_id,
  pi.professional_id,
  pi.status,
  pi.created_at,
  p.title as project_title,
  pr.company_name as professional_name,
  cl.email as client_email
FROM project_interests pi
LEFT JOIN projects p ON pi.project_id = p.id
LEFT JOIN professionals pr ON pi.professional_id = pr.id
LEFT JOIN profiles cl ON p.client_id = cl.id
ORDER BY pi.created_at DESC
LIMIT 10;

-- 4. Vérifier les statuts utilisés dans les candidatures
SELECT 
  'STATUTS CANDIDATURES' as info_type,
  status,
  COUNT(*) as count
FROM project_interests
GROUP BY status
ORDER BY count DESC;

-- 5. Vérifier s'il y a des projets récents sans candidatures
SELECT 
  'PROJETS SANS CANDIDATURES' as info_type,
  p.id,
  p.title,
  p.status,
  p.created_at,
  COUNT(pi.id) as nb_candidatures
FROM projects p
LEFT JOIN project_interests pi ON p.id = pi.project_id
WHERE p.created_at >= NOW() - INTERVAL '7 days'
GROUP BY p.id, p.title, p.status, p.created_at
HAVING COUNT(pi.id) = 0
ORDER BY p.created_at DESC
LIMIT 5;

-- 6. Test créer une candidature (décommenter pour tester)
/*
INSERT INTO project_interests (
  project_id,
  professional_id,
  status,
  created_at,
  updated_at
) VALUES (
  'ID_PROJET_TEST',  -- Remplacer par un vrai ID de projet
  'ID_PROFESSIONNEL_TEST',  -- Remplacer par un vrai ID de professionnel
  'pending',
  NOW(),
  NOW()
);
*/

-- 7. Vérifier les webhooks et triggers
SELECT 
  'TRIGGERS/WEBHOOKS' as info_type,
  trigger_name,
  event_manipulation,
  action_timing,
  action_condition
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND (
  trigger_name ILIKE '%project%' OR
  trigger_name ILIKE '%interest%' OR
  trigger_name ILIKE '%match%'
)
ORDER BY trigger_name;
