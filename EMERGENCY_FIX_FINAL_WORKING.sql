-- =====================================================
-- DIAGNOSTIC ET RÉPARATION D'URGENCE (VERSION FINALE FONCTIONNELLE)
-- sotbirida@yahoo.fr & sotbirida@gmail.com
-- =====================================================

-- 1. VÉRIFIER LA STRUCTURE RÉELLE ET VALEURS ENUM
-- ================================================

-- Structure profiles
SELECT 
    'PROFILES STRUCTURE' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Structure professionals
SELECT 
    'PROFESSIONALS STRUCTURE' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'professionals' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérifier les valeurs enum pour professional_status
SELECT 
    'PROFESSIONAL_STATUS VALUES' as info,
    unnest(enum_range(NULL::professional_status)) as available_status;

-- Vérifier les valeurs enum pour user_role
SELECT 
    'USER_ROLE VALUES' as info,
    unnest(enum_range(NULL::user_role)) as available_roles;

-- 2. VÉRIFIER LES COMPTES EXISTANTS
-- ================================

-- Comptes dans profiles
SELECT 
    'PROFILES' as table_name,
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
FROM profiles 
WHERE email IN ('sotbirida@yahoo.fr', 'sotbirida@gmail.com')
ORDER BY email;

-- Données PRO existantes
SELECT 
    'PROFESSIONALS' as table_name,
    id,
    user_id,
    email,
    company_name,
    siret,
    phone,
    status,
    created_at,
    updated_at
FROM professionals 
WHERE email IN ('sotbirida@yahoo.fr', 'sotbirida@gmail.com')
ORDER BY email;

-- 3. NETTOYAGE DES DOUBLONS ÉVENTUELS
-- ==================================

-- Supprimer les doublons dans professionals (garde le plus récent)
DELETE FROM professionals 
WHERE id NOT IN (
    SELECT DISTINCT ON (email) id 
    FROM professionals 
    WHERE email IN ('sotbirida@yahoo.fr', 'sotbirida@gmail.com')
    ORDER BY email, created_at DESC
);

-- 4. CRÉER LES COMPTES S'ILS N'EXISTENT PAS
-- =========================================

-- Compte PRO sotbirida@gmail.com
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
    'Sot Birida PRO',
    'professional',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM profiles WHERE email = 'sotbirida@gmail.com'
);

-- Compte CLIENT sotbirida@yahoo.fr
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
    'Sot Birida CLIENT',
    'client',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM profiles WHERE email = 'sotbirida@yahoo.fr'
);

-- 5. CRÉER LES DONNÉES PROFESSIONNELLES (AVEC GESTION DOUBLONS)
-- =============================================================

-- Données PRO pour sotbirida@gmail.com (avec gestion des doublons)
INSERT INTO professionals (
    user_id,
    email,
    company_name,
    siret,
    phone,
    status,
    created_at,
    updated_at
) 
SELECT 
    p.id,
    'sotbirida@gmail.com',
    'Sot Birida Entreprise',
    '12345678901234',
    '+33612345678',
    'pending',
    NOW(),
    NOW()
FROM profiles p
WHERE p.email = 'sotbirida@gmail.com'
AND p.role = 'professional'
AND NOT EXISTS (
    SELECT 1 FROM professionals WHERE email = 'sotbirida@gmail.com'
);

-- 6. VÉRIFICATION FINALE
-- =====================

SELECT 
    'FINAL CHECK' as status,
    p.email,
    p.role,
    p.id as profile_id,
    pr.id as professional_id,
    pr.user_id as prof_user_id,
    CASE 
        WHEN pr.id IS NOT NULL THEN '✅ Données PRO présentes'
        ELSE '❌ Données PRO manquantes'
    END as pro_status,
    CASE 
        WHEN pr.id IS NOT NULL THEN '🎯 COMPTE PRO COMPLET'
        ELSE '❌ COMPTE PRO INCOMPLET'
    END as completeness_status
FROM profiles p
LEFT JOIN professionals pr ON p.email = pr.email
WHERE p.email IN ('sotbirida@yahoo.fr', 'sotbirida@gmail.com')
ORDER BY p.email;

-- 7. INSTRUCTIONS DE CONNEXION
-- ============================

SELECT 
    'LOGIN INFO' as info,
    'Compte PRO:' as account,
    'sotbirida@gmail.com / TempPro123!' as credentials
UNION ALL
SELECT 
    'LOGIN INFO' as info,
    'Compte CLIENT:' as account,
    'sotbirida@yahoo.fr / TempClient123!' as credentials
UNION ALL
SELECT 
    'LOGIN INFO' as info,
    'Admin:' as account,
    'admin@swipetonpro.fr / Admin123!' as credentials;

-- 8. STATISTIQUES FINALES
-- =======================

SELECT 
    'STATISTICS' as info,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN role = 'client' THEN 1 END) as clients,
    COUNT(CASE WHEN role = 'professional' THEN 1 END) as professionals,
    COUNT(CASE WHEN role IN ('admin', 'super_admin') THEN 1 END) as admins
FROM profiles 
WHERE email IN ('sotbirida@yahoo.fr', 'sotbirida@gmail.com', 'admin@swipetonpro.fr');
