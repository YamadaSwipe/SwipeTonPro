-- =====================================================
-- CRÉATION COMPTE SUPABASE AUTH POUR ADMIN
-- Pour permettre la connexion via Supabase Auth
-- =====================================================

-- 1. Vérifier si le compte admin existe déjà dans auth.users
SELECT 
    'ADMIN AUTH CHECK' as info,
    id,
    email,
    email_confirmed_at,
    created_at,
    last_sign_in_at
FROM auth.users 
WHERE email = 'admin@swipotonpro.fr';

-- 2. Créer le compte admin dans Supabase Auth si nécessaire
-- NOTE: Cette commande doit être exécutée avec les droits appropriés
INSERT INTO auth.users (
    id,
    email,
    email_confirmed_at,
    phone,
    created_at,
    updated_at,
    aud,
    role,
    is_sso_user
) 
SELECT 
    p.id,
    p.email,
    NOW() as email_confirmed_at,
    p.phone,
    NOW() as created_at,
    NOW() as updated_at,
    'authenticated' as aud,
    'authenticated' as role,
    false as is_sso_user
FROM profiles p
WHERE p.email = 'admin@swipotonpro.fr'
AND p.role = 'super_admin'
AND NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@swipotonpro.fr'
);

-- 3. Définir le mot de passe pour le compte admin
-- NOTE: Cette commande nécessite le mot de passe hashé
-- Pour l'instant, nous allons créer un compte temporaire

-- 4. Vérifier le compte créé
SELECT 
    'ADMIN AUTH VERIFICATION' as info,
    au.id,
    au.email,
    au.email_confirmed_at,
    au.created_at,
    p.email as profile_email,
    p.role as profile_role
FROM auth.users au
JOIN profiles p ON au.id = p.id
WHERE au.email = 'admin@swipotonpro.fr';

-- 5. Alternative: Créer un mot de passe via Supabase Dashboard
-- Instructions manuelles:
-- 1. Allez dans Supabase Dashboard > Authentication > Users
-- 2. Cherchez admin@swipotonpro.fr
-- 3. Cliquez sur "Reset Password" 
-- 4. Définissez le mot de passe: Admin123!

-- 6. Vérification finale des comptes disponibles pour connexion
SELECT 
    'AVAILABLE LOGINS' as info,
    'Admin Supabase:' as account_type,
    'admin@swipotonpro.fr / Admin123! (après reset)' as credentials
UNION ALL
SELECT 
    'AVAILABLE LOGINS' as info,
    'Admin Fantôme:' as account_type,
    'admin@swipotonpro.fr / Admin123! (via hook)' as credentials
UNION ALL
SELECT 
    'AVAILABLE LOGINS' as info,
    'Compte PRO:' as account_type,
    'sotbirida@gmail.com / TempPro123!' as credentials
UNION ALL
SELECT 
    'AVAILABLE LOGINS' as info,
    'Compte CLIENT:' as account_type,
    'sotbirida@yahoo.fr / TempClient123!' as credentials;
