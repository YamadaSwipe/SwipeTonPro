-- =====================================================
-- RECHERCHE SIMPLE DES COMPTES (SANS ERREURS)
-- sotbirida@yahoo.fr & sotbirida@gmail.com
-- =====================================================

-- 1. RECHERCHE DANS PROFILES
-- ==========================

SELECT 
    'PROFILES' as table_source,
    id,
    email,
    full_name,
    role,
    phone,
    created_at,
    updated_at,
    CASE 
        WHEN role = 'professional' THEN '👨‍💼 PROFESSIONNEL'
        WHEN role = 'client' THEN '👤 CLIENT'
        WHEN role = 'admin' THEN '👑 ADMIN'
        WHEN role = 'super_admin' THEN '👑 SUPER ADMIN'
        ELSE '❓ INCONNU'
    END as account_type
FROM profiles 
WHERE email IN ('sotbirida@yahoo.fr', 'sotbirida@gmail.com')
ORDER BY email;

-- 2. RECHERCHE DANS PROFESSIONNELS (SANS CASE SUR STATUS)
-- =======================================================

SELECT 
    'PROFESSIONALS' as table_source,
    id,
    email,
    company_name,
    status,
    created_at
FROM professionals 
WHERE email IN ('sotbirida@yahoo.fr', 'sotbirida@gmail.com')
ORDER BY email;

-- 3. VÉRIFICATION DE L'EXISTENCE
-- =============================

SELECT 
    'EXISTENCE CHECK' as info,
    COUNT(*) as profiles_found,
    STRING_AGG(email, ', ') as emails_list
FROM profiles 
WHERE email IN ('sotbirida@yahoo.fr', 'sotbirida@gmail.com');

-- 4. CRÉATION DES COMPTES SI NÉCESSAIRE
-- =====================================

-- Créer sotbirida@yahoo.fr
INSERT INTO profiles (
    id,
    user_id,
    email,
    full_name,
    role,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    gen_random_uuid(),
    'sotbirida@yahoo.fr',
    'Sot Birida',
    'client',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM profiles WHERE email = 'sotbirida@yahoo.fr'
);

-- Créer sotbirida@gmail.com
INSERT INTO profiles (
    id,
    user_id,
    email,
    full_name,
    role,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    gen_random_uuid(),
    'sotbirida@gmail.com',
    'Sot Birida',
    'client',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM profiles WHERE email = 'sotbirida@gmail.com'
);

-- 5. VÉRIFICATION FINALE
-- =====================

SELECT 
    'FINAL RESULT' as status,
    email,
    role,
    CASE 
        WHEN role = 'professional' THEN '👨‍💻 COMPTE PRO'
        WHEN role = 'client' THEN '👤 COMPTE CLIENT'
        WHEN role = 'admin' THEN '👑 COMPTE ADMIN'
        WHEN role = 'super_admin' THEN '👑 SUPER ADMIN'
        ELSE '❌ À CONFIGURER'
    END as final_status
FROM profiles 
WHERE email IN ('sotbirida@yahoo.fr', 'sotbirida@gmail.com')
ORDER BY email;
