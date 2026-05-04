-- =====================================================
-- ANALYSE FINALE ADMIN - FULL STACK APPROACH
-- Vérification structure réelle et nettoyage sécurisé
-- =====================================================

-- 1. DIAGNOSTIC RAPIDE - Structure exacte de profiles
SELECT 
    'PROFILES STRUCTURE' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
AND column_name IN ('id', 'email', 'full_name', 'role', 'phone', 'created_at', 'updated_at')
ORDER BY ordinal_position;

-- 2. ÉTAT ACTUEL - Tous les comptes admin
SELECT 
    'CURRENT ADMIN ACCOUNTS' as info,
    id,
    email,
    full_name,
    role,
    phone
FROM profiles 
WHERE role IN ('admin', 'super_admin')
ORDER BY email;

-- 3. DOUBLON SPÉCIFIQUE - admin@swipotonpro.fr
SELECT 
    'ADMIN DOUBLES' as info,
    id,
    email,
    full_name,
    role,
    phone,
    CASE 
        WHEN full_name IS NOT NULL AND full_name != '' THEN 1 ELSE 0 END as name_score,
    CASE WHEN phone IS NOT NULL THEN 1 ELSE 0 END as phone_score,
    CASE WHEN EXISTS (SELECT 1 FROM professionals WHERE user_id = id) THEN 1 ELSE 0 END as pro_score,
    CASE WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = email) THEN 1 ELSE 0 END as auth_score
FROM profiles 
WHERE email = 'admin@swipotonpro.fr'
ORDER BY id;

-- 4. SCORE TOTAL - Sans utiliser created_at/updated_at
SELECT 
    'SCORE TOTAL' as info,
    id,
    email,
    full_name,
    phone,
    (CASE WHEN full_name IS NOT NULL AND full_name != '' THEN 1 ELSE 0 END +
     CASE WHEN phone IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN EXISTS (SELECT 1 FROM professionals WHERE user_id = id) THEN 1 ELSE 0 END +
     CASE WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = email) THEN 1 ELSE 0 END) as total_score
FROM profiles 
WHERE email = 'admin@swipotonpro.fr'
ORDER BY total_score DESC, id DESC;

-- 5. RECOMMANDATION - ID à conserver
SELECT 
    'KEEP THIS ID' as info,
    id as id_to_keep,
    email,
    full_name,
    total_score,
    CASE 
        WHEN total_score >= 3 THEN '🎯 EXCELLENT - CONSERVER'
        WHEN total_score >= 2 THEN '✅ BON - CONSERVER'
        ELSE '⚠️ FAIBLE - ÉVALUER'
    END as recommendation
FROM (
    SELECT 
        id,
        email,
        full_name,
        (CASE WHEN full_name IS NOT NULL AND full_name != '' THEN 1 ELSE 0 END +
         CASE WHEN phone IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN EXISTS (SELECT 1 FROM professionals WHERE user_id = id) THEN 1 ELSE 0 END +
         CASE WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = email) THEN 1 ELSE 0 END) as total_score
    FROM profiles 
    WHERE email = 'admin@swipotonpro.fr'
) scored
ORDER BY total_score DESC, id DESC
LIMIT 1;

-- 6. NETTOYAGE SÉCURISÉ - ID à supprimer (si doublon)
SELECT 
    'DELETE THIS ID' as info,
    id as id_to_delete,
    email,
    total_score,
    'ONLY IF DUPLICATE EXISTS' as condition
FROM (
    SELECT 
        id,
        email,
        (CASE WHEN full_name IS NOT NULL AND full_name != '' THEN 1 ELSE 0 END +
         CASE WHEN phone IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN EXISTS (SELECT 1 FROM professionals WHERE user_id = id) THEN 1 ELSE 0 END +
         CASE WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = email) THEN 1 ELSE 0 END) as total_score
    FROM profiles 
    WHERE email = 'admin@swipotonpro.fr'
) scored
ORDER BY total_score ASC, id ASC
OFFSET 1
LIMIT 1;

-- 7. RÉSUMÉ FINAL - État après nettoyage
SELECT 
    'FINAL SUMMARY' as info,
    'Current admin count:' as current_state,
    COUNT(*) as admin_count
FROM profiles 
WHERE role IN ('admin', 'super_admin');
