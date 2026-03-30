-- 🚨 URGENT: Créer le profil professionnel manquant pour sotbirida@gmail.com
-- Exécuter dans Supabase SQL Editor

-- 1. Vérifier l'état actuel de sotbirida@gmail.com
SELECT 
  u.id as auth_id,
  u.email as auth_email,
  u.created_at as auth_created,
  p.id as profile_id,
  p.email as profile_email,
  p.role as profile_role,
  p.created_at as profile_created,
  pr.id as professional_id,
  pr.user_id as professional_user_id,
  pr.company_name as professional_company,
  pr.status as professional_status,
  CASE 
    WHEN p.id IS NULL THEN 'PROFILE MISSING'
    ELSE 'PROFILE EXISTS'
  END as profile_status,
  CASE 
    WHEN pr.id IS NULL THEN 'PROFESSIONAL MISSING'
    ELSE 'PROFESSIONAL EXISTS'
  END as professional_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.professionals pr ON u.id = pr.user_id
WHERE u.email = 'sotbirida@gmail.com';

-- 2. Créer le profil manquant si nécessaire
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  u.email as full_name,
  'professional' as role,
  u.created_at,
  NOW() as updated_at
FROM auth.users u
WHERE u.email = 'sotbirida@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- 3. Créer la fiche professionnelle manquante si nécessaire
INSERT INTO public.professionals (id, user_id, siret, company_name, status, created_at, updated_at)
SELECT 
  gen_random_uuid() as id,
  u.id as user_id,
  '00000000000000' as siret,  -- À compléter avec le vrai SIRET
  'MB RESEAUX' as company_name,
  'pending' as status,
  NOW() as created_at,
  NOW() as updated_at
FROM auth.users u
WHERE u.email = 'sotbirida@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM public.professionals pr WHERE pr.user_id = u.id
);

-- 4. Vérifier après création
SELECT 
  u.email as auth_email,
  p.email as profile_email,
  p.role as profile_role,
  pr.company_name as professional_company,
  pr.status as professional_status,
  CASE 
    WHEN p.id IS NOT NULL AND pr.id IS NOT NULL THEN 'COMPLETE'
    ELSE 'INCOMPLETE'
  END as final_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.professionals pr ON u.id = pr.user_id
WHERE u.email = 'sotbirida@gmail.com';
