-- =====================================================
-- COMPARAISON ADMIN SIMPLE FINALE (colonnes garanties)
-- =====================================================

-- 1. TOUS les comptes admin@swipotonpro.fr
SELECT 
    'TOUS LES COMPTES ADMIN' as info,
    id,
    email,
    full_name,
    role,
    phone,
    created_at
FROM profiles 
WHERE email = 'admin@swipotonpro.fr'
ORDER BY created_at DESC;

-- 2. Compter exactement les comptes
SELECT 
    'COUNT ADMIN ACCOUNTS' as info,
    COUNT(*) as total_count,
    MIN(created_at) as oldest,
    MAX(created_at) as newest,
    CASE 
        WHEN COUNT(*) > 1 THEN '🔄 DOUBLON DÉTECTÉ'
        ELSE '✅ UN SEUL COMPTE'
    END as status
FROM profiles 
WHERE email = 'admin@swipotonpro.fr';

-- 3. Score détaillé pour chaque compte
SELECT 
    'SCORE DÉTAILLÉ' as info,
    id,
    email,
    full_name,
    phone,
    created_at,
    -- Score individuel
    CASE WHEN full_name IS NOT NULL AND full_name != '' THEN 1 ELSE 0 END as name_score,
    CASE WHEN phone IS NOT NULL THEN 1 ELSE 0 END as phone_score,
    CASE WHEN EXISTS (SELECT 1 FROM professionals WHERE user_id = id) THEN 1 ELSE 0 END as pro_score,
    CASE WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = email) THEN 1 ELSE 0 END as auth_score,
    -- Score total
    (CASE WHEN full_name IS NOT NULL AND full_name != '' THEN 1 ELSE 0 END +
     CASE WHEN phone IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN EXISTS (SELECT 1 FROM professionals WHERE user_id = id) THEN 1 ELSE 0 END +
     CASE WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = email) THEN 1 ELSE 0 END) as total_score
FROM profiles 
WHERE email = 'admin@swipotonpro.fr'
ORDER BY total_score DESC, created_at DESC;

-- 4. Recommandation finale avec ID
SELECT 
    'RECOMMANDATION FINALE' as info,
    id as id_a_conserver,
    email,
    full_name,
    total_score,
    CASE 
        WHEN total_score >= 3 THEN '🎯 CONSERVER - Bon'
        WHEN total_score >= 2 THEN '⚠️ ÉVALUER - Moyen'
        ELSE '❌ SUPPRIMER - Faible'
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
) scored_accounts
ORDER BY total_score DESC, created_at DESC
LIMIT 1;

-- 5. ID à supprimer (si doublon)
SELECT 
    'ID À SUPPRIMER' as info,
    id as id_a_supprimer,
    email,
    total_score,
    'Si doublon existant' as condition
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
) scored_accounts
ORDER BY total_score ASC, created_at ASC
OFFSET 1
LIMIT 1;
