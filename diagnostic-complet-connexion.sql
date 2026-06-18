-- 🔍 DIAGNOSTIC COMPLET DES PROBLÈMES DE CONNEXION
-- Vérifier TOUS les comptes mentionnés

-- 1. Vérifier les comptes dans auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  last_sign_in_at,
  created_at,
  encrypted_password IS NOT NULL as has_password,
  raw_user_meta_data,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ Email non confirmé'
    WHEN encrypted_password IS NULL THEN '❌ Pas de mot de passe'
    ELSE '✅ Compte OK'
  END as status_auth
FROM auth.users
WHERE email IN (
  'admin@swipetonpro.fr',
  'sotbirida@gmail.com',
  'sotbirida@yahoo.fr'
)
ORDER BY email;

-- 2. Vérifier les profils correspondants
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.created_at,
  CASE 
    WHEN au.id IS NULL THEN '❌ PAS DE COMPTE AUTH'
    WHEN au.email_confirmed_at IS NULL THEN '⚠️ Email non confirmé'
    ELSE '✅ Profil OK'
  END as status_profil
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.email IN (
  'admin@swipetonpro.fr',
  'sotbirida@gmail.com',
  'sotbirida@yahoo.fr'
)
ORDER BY p.email;

-- 3. Vérifier les identités (confirmations email)
SELECT 
  i.user_id,
  i.identity_data->>'email' as email,
  i.provider,
  i.last_sign_in_at,
  i.created_at,
  i.updated_at
FROM auth.identities i
WHERE i.identity_data->>'email' IN (
  'admin@swipetonpro.fr',
  'sotbirida@gmail.com',
  'sotbirida@yahoo.fr'
)
ORDER BY i.identity_data->>'email';

-- 4. Vérifier s'il y a des sessions actives
SELECT 
  s.user_id,
  au.email,
  s.created_at,
  s.updated_at,
  s.not_after,
  CASE 
    WHEN s.not_after < NOW() THEN '❌ Session expirée'
    ELSE '✅ Session active'
  END as session_status
FROM auth.sessions s
JOIN auth.users au ON s.user_id = au.id
WHERE au.email IN (
  'admin@swipetonpro.fr',
  'sotbirida@gmail.com',
  'sotbirida@yahoo.fr'
)
ORDER BY au.email, s.created_at DESC;

-- 5. Vérifier les tokens de récupération
SELECT 
  id,
  email,
  recovery_token IS NOT NULL as has_recovery_token,
  recovery_sent_at,
  CASE 
    WHEN recovery_sent_at IS NOT NULL AND recovery_sent_at > NOW() - INTERVAL '1 hour' THEN '✅ Token récent'
    WHEN recovery_sent_at IS NOT NULL THEN '⚠️ Token expiré'
    ELSE 'Pas de token'
  END as recovery_status
FROM auth.users
WHERE email IN (
  'admin@swipetonpro.fr',
  'sotbirida@gmail.com',
  'sotbirida@yahoo.fr'
)
ORDER BY email;

-- 6. Résumé global
SELECT 
  au.email,
  au.email_confirmed_at IS NOT NULL as email_confirmed,
  au.encrypted_password IS NOT NULL as has_password,
  p.id IS NOT NULL as has_profile,
  p.role as profile_role,
  CASE 
    WHEN au.email_confirmed_at IS NULL THEN '❌ Email non confirmé - Vérifier boîte mail'
    WHEN au.encrypted_password IS NULL THEN '❌ Pas de mot de passe défini'
    WHEN p.id IS NULL THEN '❌ Pas de profil - Créer profil'
    ELSE '✅ Compte complet'
  END as diagnostic
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.email IN (
  'admin@swipetonpro.fr',
  'sotbirida@gmail.com',
  'sotbirida@yahoo.fr'
)
ORDER BY au.email;
