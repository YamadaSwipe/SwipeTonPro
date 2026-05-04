-- =====================================================
-- DÉBOGAGE - VÉRIFICATION TOUS LES ADMIN@SWIPOTONPRO.FR
-- =====================================================

-- 1. Vérifier TOUS les comptes admin@swipotonpro.fr
SELECT 
    'TOUS LES COMPTES ADMIN' as info,
    id,
    email,
    full_name,
    role,
    phone,
    created_at,
    updated_at,
    AGE(updated_at, created_at) as age_difference
FROM profiles 
WHERE email = 'admin@swipotonpro.fr'
ORDER BY updated_at DESC, created_at DESC;

-- 2. Compter exactement les comptes
SELECT 
    'COUNT ADMIN ACCOUNTS' as info,
    COUNT(*) as total_count,
    MIN(created_at) as oldest,
    MAX(updated_at) as newest,
    CASE 
        WHEN COUNT(*) > 1 THEN '🔄 DOUBLON DÉTECTÉ'
        ELSE '✅ UN SEUL COMPTE'
    END as status
FROM profiles 
WHERE email = 'admin@swipotonpro.fr';

-- 3. Comparaison côte à côte
SELECT 
    p1.id as id1,
    p1.full_name as name1,
    p1.phone as phone1,
    p1.created_at as created1,
    p1.updated_at as updated1,
    p2.id as id2,
    p2.full_name as name2,
    p2.phone as phone2,
    p2.created_at as created2,
    p2.updated_at as updated2,
    CASE 
        WHEN p1.updated_at > p2.updated_at THEN 'ID1 plus récent'
        WHEN p2.updated_at > p1.updated_at THEN 'ID2 plus récent'
        ELSE 'Même date'
    END as comparison
FROM profiles p1
CROSS JOIN profiles p2
WHERE p1.email = 'admin@swipotonpro.fr'
AND p2.email = 'admin@swipotonpro.fr'
AND p1.id < p2.id;

-- 4. Score détaillé pour chaque compte
SELECT 
    'SCORE DÉTAILLÉ' as info,
    id,
    email,
    full_name,
    phone,
    created_at,
    updated_at,
    -- Score individuel
    CASE WHEN full_name IS NOT NULL AND full_name != '' THEN 1 ELSE 0 END as name_score,
    CASE WHEN phone IS NOT NULL THEN 1 ELSE 0 END as phone_score,
    CASE WHEN updated_at > created_at THEN 1 ELSE 0 END as update_score,
    CASE WHEN EXISTS (SELECT 1 FROM professionals WHERE user_id = id) THEN 1 ELSE 0 END as pro_score,
    CASE WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = email) THEN 1 ELSE 0 END as auth_score,
    -- Score total
    (CASE WHEN full_name IS NOT NULL AND full_name != '' THEN 1 ELSE 0 END +
     CASE WHEN phone IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN updated_at > created_at THEN 1 ELSE 0 END +
     CASE WHEN EXISTS (SELECT 1 FROM professionals WHERE user_id = id) THEN 1 ELSE 0 END +
     CASE WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = email) THEN 1 ELSE 0 END) as total_score
FROM profiles 
WHERE email = 'admin@swipotonpro.fr'
ORDER BY total_score DESC, updated_at DESC;

-- 5. Recommandation finale avec ID
SELECT 
    'RECOMMANDATION FINALE' as info,
    id as id_a_conserver,
    email,
    full_name,
    total_score,
    CASE 
        WHEN total_score >= 4 THEN '🎯 CONSERVER - Excellent'
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
         CASE WHEN updated_at > created_at THEN 1 ELSE 0 END +
         CASE WHEN EXISTS (SELECT 1 FROM professionals WHERE user_id = id) THEN 1 ELSE 0 END +
         CASE WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = email) THEN 1 ELSE 0 END) as total_score
    FROM profiles 
    WHERE email = 'admin@swipotonpro.fr'
) scored_accounts
ORDER BY total_score DESC, updated_at DESC
LIMIT 1;

-- 6. ID à supprimer (si doublon)
SELECT 
    'ID À SUPPRIMER' as info,
    id as id_a_supprimer,
    email,
    'Si doublon existant' as condition
FROM profiles 
WHERE email = 'admin@swipotonpro.fr'
ORDER BY updated_at ASC, created_at ASC
OFFSET 1
LIMIT 1;
