-- =====================================================
-- VÉRIFICATION COMPLÈTE DES COMPTES ADMIN
-- =====================================================

-- 1. Tous les comptes admin dans profiles
SELECT 
    'ALL ADMINS IN PROFILES' as info,
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
FROM profiles 
WHERE role IN ('admin', 'super_admin')
ORDER BY created_at;

-- 2. Vérifier s'il y a l'admin fantôme dans profiles
SELECT 
    'ADMIN GHOST CHECK' as info,
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
FROM profiles 
WHERE email = 'admin@swipetonpro.fr';

-- 3. Compter par rôle exact
SELECT 
    'ROLE BREAKDOWN' as info,
    role,
    COUNT(*) as count,
    STRING_AGG(email, ', ') as emails
FROM profiles 
GROUP BY role
ORDER BY count DESC;

-- 4. Vérifier les emails dans notre recherche
SELECT 
    'TARGET EMAILS CHECK' as info,
    email,
    role,
    CASE 
        WHEN email IN ('sotbirida@yahoo.fr', 'sotbirida@gmail.com', 'admin@swipetonpro.fr') THEN '✅ TARGET'
        ELSE '❌ OTHER'
    END as target_status
FROM profiles 
WHERE role IN ('admin', 'super_admin')
ORDER BY email;
