-- =====================================================
-- RECHERCHE ET RÉINITIALISATION DES COMPTES (VERSION FONCTIONNELLE)
-- sotbirida@yahoo.fr & sotbirida@gmail.com
-- =====================================================

-- 1. RECHERCHE SIMPLE DES COMPTES
-- ================================

-- Rechercher dans profiles
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

-- Rechercher dans professionals (sans colonnes problématiques)
SELECT 
    'PROFESSIONALS' as table_source,
    id,
    email,
    company_name,
    status,
    created_at,
    CASE 
        WHEN status = 'approved' THEN '✅ APPROUVÉ'
        WHEN status = 'pending' THEN '⏳ EN ATTENTE'
        WHEN status = 'rejected' THEN '❌ REJETÉ'
        ELSE '❓ INCONNU'
    END as pro_status
FROM professionals 
WHERE email IN ('sotbirida@yahoo.fr', 'sotbirida@gmail.com')
ORDER BY email;

-- 2. VÉRIFICATION SI LES COMPTES EXISTENT
-- =======================================

-- Compter les comptes recherchés
SELECT 
    'COUNT' as info,
    COUNT(*) as found_accounts,
    STRING_AGG(email, ', ') as emails_found
FROM profiles 
WHERE email IN ('sotbirida@yahoo.fr', 'sotbirida@gmail.com');

-- 3. CRÉATION DES COMPTES SI NÉCESSAIRE
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

-- 4. VÉRIFICATION FINALE
-- =====================

SELECT 
    'FINAL CHECK' as status,
    email,
    role,
    CASE 
        WHEN role = 'professional' THEN '👨‍💻 COMPTE PRO'
        WHEN role = 'client' THEN '👤 COMPTE CLIENT'
        WHEN role = 'admin' THEN '👑 COMPTE ADMIN'
        WHEN role = 'super_admin' THEN '👑 SUPER ADMIN'
        ELSE '❌ À CONFIGURER'
    END as final_status,
    'Prêt pour gestion via interface web' as next_step
FROM profiles 
WHERE email IN ('sotbirida@yahoo.fr', 'sotbirida@gmail.com')
ORDER BY email;

-- 5. INSTRUCTIONS POUR LA SUITE
-- ============================

SELECT 
    'INSTRUCTIONS' as step,
    '1. Connectez-vous admin:' as action,
    'admin@swipotonpro.fr / Admin123!' as details
UNION ALL
SELECT 
    'INSTRUCTIONS' as step,
    '2. Accédez gestion:' as action,
    'http://localhost:3000/admin/account-management' as details
UNION ALL
SELECT 
    'INSTRUCTIONS' as step,
    '3. Recherchez emails:' as action,
    'sotbirida@yahoo.fr, sotbirida@gmail.com' as details
UNION ALL
SELECT 
    'INSTRUCTIONS' as step,
    '4. Réinitialisez MPs:' as action,
    'Via bouton "Réinitialiser"' as details;
