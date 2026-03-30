-- 🚨 URGENT: Créer les profils manquants
-- Exécuter dans Supabase SQL Editor pour réparer l'erreur "Auth session missing"

-- Créer les profils pour tous les utilisateurs sans profile
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  u.email as full_name,
  'client' as role,
  u.created_at,
  NOW() as updated_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
AND u.email LIKE '%@swipetonpro.com';

-- Vérifier les profils créés
SELECT 
  u.email as auth_email,
  p.email as profile_email,
  p.role,
  p.created_at as profile_created_at,
  CASE 
    WHEN p.email IS NOT NULL THEN 'PROFILE CREATED'
    ELSE 'STILL MISSING'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email LIKE '%@swipetonpro.com'
ORDER BY u.created_at DESC;
