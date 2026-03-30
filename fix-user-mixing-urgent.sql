-- 🚨 URGENT: Vérification des comptes mélangés
-- Exécuter dans Supabase SQL Editor pour diagnostiquer

-- 1. Vérifier les incohérences user_id/email
SELECT 
  u.id as auth_user_id,
  u.email as auth_email,
  u.created_at as auth_created,
  p.id as profile_id,
  p.email as profile_email,
  p.created_at as profile_created,
  pr.id as professional_id,
  pr.user_id as professional_user_id,  -- professionals a bien user_id
  pr.company_name as professional_company,  -- professionals n'a PAS email directement
  CASE 
    WHEN u.email != p.email THEN 'PROFILE EMAIL MISMATCH'
    WHEN u.id != p.id THEN 'PROFILE ID MISMATCH'
    ELSE 'OK'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id  -- CORRIGÉ: profiles.id au lieu de user_id
LEFT JOIN public.professionals pr ON u.id = pr.user_id  -- CORRIGÉ: professionals.user_id (existe)
WHERE u.email IS NOT NULL
ORDER BY u.created_at DESC;

-- 2. Vérifier les doublons d'email dans profiles
SELECT 
  email,
  COUNT(*) as count,
  STRING_AGG(id::text, ', ') as profile_ids
FROM public.profiles
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 3. Vérifier les doublons dans professionals (par user_id)
SELECT 
  user_id,
  COUNT(*) as count,
  STRING_AGG(id::text, ', ') as professional_ids
FROM public.professionals
WHERE user_id IS NOT NULL
GROUP BY user_id
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 4. Vérifier les ID sans correspondance
SELECT 
  'auth_without_profile' as type,
  u.id,
  u.email,
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id  -- CORRIGÉ: profiles.id au lieu de user_id
WHERE p.id IS NULL
AND u.email IS NOT NULL

UNION ALL

SELECT 
  'profile_without_auth' as type,
  p.id,
  p.email,
  p.created_at
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id  -- CORRIGÉ: profiles.id au lieu de user_id
WHERE u.id IS NULL
AND p.email IS NOT NULL

UNION ALL

SELECT 
  'professional_without_auth' as type,
  pr.id,
  pr.user_id,
  pr.company_name
FROM public.professionals pr
LEFT JOIN auth.users u ON pr.user_id = u.id  -- CORRIGÉ: professionals.user_id
WHERE u.id IS NULL
AND pr.user_id IS NOT NULL

ORDER BY type, created_at DESC;

-- 5. Requête de test pour un email spécifique
-- Remplacer 'votre_email_test' par l'email qui pose problème
SELECT 
  u.id as auth_id,
  u.email as auth_email,
  u.phone as auth_phone,
  p.id as profile_id,
  p.id as profile_user_id,  -- CORRIGÉ: profiles.id au lieu de user_id
  p.email as profile_email,
  p.phone as profile_phone,
  p.full_name as profile_name,
  pr.id as professional_id,
  pr.user_id as professional_user_id,  -- CORRIGÉ: professionals.user_id
  pr.company_name as professional_company
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id  -- CORRIGÉ: profiles.id au lieu de user_id
LEFT JOIN public.professionals pr ON u.id = pr.user_id  -- CORRIGÉ: professionals.user_id
WHERE u.email = 'votre_email_test';  -- REMPLACER CET EMAIL
