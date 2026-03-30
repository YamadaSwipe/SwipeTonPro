-- Diagnostic pour les emails en .fr (votre domaine)
-- Exécuter dans Supabase SQL Editor

-- Vérifier tous les utilisateurs avec emails .fr
SELECT 
  u.email as auth_email,
  p.email as profile_email,
  p.role,
  p.created_at as profile_created_at,
  pr.company_name as professional_company,
  CASE 
    WHEN p.email IS NOT NULL THEN 'PROFILE EXISTS'
    ELSE 'PROFILE MISSING'
  END as profile_status,
  CASE 
    WHEN u.email != p.email THEN 'EMAIL MISMATCH'
    ELSE 'EMAIL OK'
  END as email_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.professionals pr ON u.id = pr.user_id
WHERE u.email LIKE '%.fr'
ORDER BY u.created_at DESC;

-- Test pour un email spécifique .fr
-- Remplacer 'votre_email@domaine.fr' par votre email
SELECT 
  u.email as auth_email,
  p.email as profile_email,
  p.role,
  pr.company_name as professional_company,
  CASE 
    WHEN u.email != p.email THEN 'EMAIL MISMATCH'
    ELSE 'EMAIL OK'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.professionals pr ON u.id = pr.user_id
WHERE u.email = 'votre_email@domaine.fr';
