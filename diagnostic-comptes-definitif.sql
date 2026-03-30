-- Diagnostic définitif des comptes mélangés
-- Version simple et fonctionnelle
-- Exécuter dans Supabase SQL Editor

-- 1. Vérifier les emails incohérents
SELECT 
  u.email as auth_email,
  p.email as profile_email,
  pr.company_name as professional_company,
  CASE 
    WHEN u.email != p.email THEN 'EMAIL MISMATCH'
    ELSE 'OK'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.professionals pr ON u.id = pr.user_id
WHERE u.email IS NOT NULL
ORDER BY u.created_at DESC;

-- 2. Test pour un email spécifique
-- Remplacer 'votre_email_test' par votre email
SELECT 
  u.email as auth_email,
  p.email as profile_email,
  pr.company_name as professional_company,
  CASE 
    WHEN u.email != p.email THEN 'EMAIL MISMATCH'
    ELSE 'OK'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.professionals pr ON u.id = pr.user_id
WHERE u.email = 'votre_email_test';
