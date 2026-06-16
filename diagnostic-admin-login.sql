-- DIAGNOSTIC COMPLET DU PROBLÈME DE CONNEXION ADMIN
-- Exécuter ce script dans Supabase SQL Editor

-- 1. Vérifier tous les utilisateurs admin dans auth.users
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at,
  raw_user_meta_data
FROM auth.users
WHERE email LIKE '%admin%' OR email LIKE '%swipetonpro%'
ORDER BY created_at DESC;

-- 2. Vérifier les profils correspondants dans profiles
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.created_at,
  p.updated_at,
  CASE 
    WHEN au.id IS NULL THEN '❌ PAS DE COMPTE AUTH'
    ELSE '✅ Compte auth existe'
  END as auth_status
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.role = 'admin' OR p.email LIKE '%admin%'
ORDER BY p.created_at DESC;

-- 3. Vérifier s'il y a des profils orphelins (profil sans utilisateur auth)
SELECT 
  p.id,
  p.email,
  p.role,
  'PROFIL ORPHELIN - Supprimer ce profil' as probleme
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE au.id IS NULL AND p.role = 'admin';

-- 4. Vérifier s'il y a des utilisateurs auth sans profil
SELECT 
  au.id,
  au.email,
  'UTILISATEUR SANS PROFIL - Créer un profil' as probleme
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL AND au.email LIKE '%admin%';

-- 5. Compter les admins
SELECT 
  'Total admins dans auth.users' as type,
  COUNT(*) as count
FROM auth.users
WHERE email LIKE '%admin%'
UNION ALL
SELECT 
  'Total admins dans profiles' as type,
  COUNT(*) as count
FROM profiles
WHERE role = 'admin';

-- 6. Vérifier les doublons potentiels
SELECT 
  email,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) > 1 THEN '⚠️ DOUBLON DÉTECTÉ'
    ELSE '✅ OK'
  END as status
FROM profiles
WHERE role = 'admin'
GROUP BY email
HAVING COUNT(*) > 1;
