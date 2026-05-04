-- =====================================================
-- COMPARAISON FINALE DES DOUBLONS ADMIN (sans erreurs de type)
-- =====================================================

-- 1. Comparaison complète des deux comptes admin@swipotonpro.fr
SELECT 
    'ADMIN COMPARISON' as info,
    id,
    email,
    full_name,
    role,
    phone,
    created_at,
    updated_at,
    CASE 
        WHEN updated_at > created_at THEN '✅ Mis à jour'
        ELSE '❌ Jamais mis à jour'
    END as update_status,
    CASE 
        WHEN phone IS NOT NULL THEN '✅ Téléphone présent'
        ELSE '❌ Téléphone manquant'
    END as phone_status,
    CASE 
        WHEN full_name IS NOT NULL AND full_name != '' THEN '✅ Nom complet'
        ELSE '❌ Nom vide'
    END as name_status
FROM profiles 
WHERE email = 'admin@swipotonpro.fr'
ORDER BY updated_at DESC, created_at DESC;

-- 2. Vérifier les données PRO associées (sans jointures complexes)
SELECT 
    'PROFESSIONAL DATA CHECK' as info,
    p.id as profile_id,
    p.email,
    CASE 
        WHEN EXISTS (SELECT 1 FROM professionals WHERE user_id = p.id) THEN '✅ Données PRO présentes'
        ELSE '❌ Pas de données PRO'
    END as has_professional_data
FROM profiles p
WHERE p.email = 'admin@swipotonpro.fr'
ORDER BY p.updated_at DESC;

-- 3. Vérifier s'il existe des comptes auth avec le même email
SELECT 
    'AUTH USER CHECK' as info,
    p.id as profile_id,
    p.email,
    CASE 
        WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = p.email) THEN '✅ Compte auth existant'
        ELSE '❌ Pas de compte auth'
    END as has_auth_data
FROM profiles p
WHERE p.email = 'admin@swipotonpro.fr'
ORDER BY p.updated_at DESC;

-- 4. Score de complétude simplifié (sans jointures complexes)
SELECT 
    'COMPLETENESS SCORE' as info,
    p.id as profile_id,
    p.email,
    p.created_at,
    p.updated_at,
    -- Calcul du score simple
    (CASE WHEN p.full_name IS NOT NULL AND p.full_name != '' THEN 1 ELSE 0 END +
     CASE WHEN p.phone IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN p.updated_at > p.created_at THEN 1 ELSE 0 END +
     CASE WHEN EXISTS (SELECT 1 FROM professionals WHERE user_id = p.id) THEN 1 ELSE 0 END +
     CASE WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = p.email) THEN 1 ELSE 0 END) as completeness_score,
    -- Détail du score
    CASE WHEN p.full_name IS NOT NULL AND p.full_name != '' THEN 1 ELSE 0 END as name_score,
    CASE WHEN p.phone IS NOT NULL THEN 1 ELSE 0 END as phone_score,
    CASE WHEN p.updated_at > p.created_at THEN 1 ELSE 0 END as update_score,
    CASE WHEN EXISTS (SELECT 1 FROM professionals WHERE user_id = p.id) THEN 1 ELSE 0 END as pro_score,
    CASE WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = p.email) THEN 1 ELSE 0 END as auth_score
FROM profiles p
WHERE p.email = 'admin@swipotonpro.fr'
ORDER BY completeness_score DESC, p.updated_at DESC;

-- 5. Recommandation finale basée sur le score
SELECT 
    'FINAL RECOMMENDATION' as info,
    p.id as profile_id_to_keep,
    p.email,
    p.updated_at,
    p.full_name,
    p.phone,
    -- Score calculé
    (CASE WHEN p.full_name IS NOT NULL AND p.full_name != '' THEN 1 ELSE 0 END +
     CASE WHEN p.phone IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN p.updated_at > p.created_at THEN 1 ELSE 0 END +
     CASE WHEN EXISTS (SELECT 1 FROM professionals WHERE user_id = p.id) THEN 1 ELSE 0 END +
     CASE WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = p.email) THEN 1 ELSE 0 END) as total_score,
    -- Recommandation
    CASE 
        WHEN (CASE WHEN p.full_name IS NOT NULL AND p.full_name != '' THEN 1 ELSE 0 END +
               CASE WHEN p.phone IS NOT NULL THEN 1 ELSE 0 END +
               CASE WHEN p.updated_at > p.created_at THEN 1 ELSE 0 END +
               CASE WHEN EXISTS (SELECT 1 FROM professionals WHERE user_id = p.id) THEN 1 ELSE 0 END +
               CASE WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = p.email) THEN 1 ELSE 0 END) >= 4 THEN '🎯 CONSERVER - Très complet'
        WHEN (CASE WHEN p.full_name IS NOT NULL AND p.full_name != '' THEN 1 ELSE 0 END +
               CASE WHEN p.phone IS NOT NULL THEN 1 ELSE 0 END +
               CASE WHEN p.updated_at > p.created_at THEN 1 ELSE 0 END +
               CASE WHEN EXISTS (SELECT 1 FROM professionals WHERE user_id = p.id) THEN 1 ELSE 0 END +
               CASE WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = p.email) THEN 1 ELSE 0 END) >= 3 THEN '🎯 CONSERVER - Complet'
        WHEN (CASE WHEN p.full_name IS NOT NULL AND p.full_name != '' THEN 1 ELSE 0 END +
               CASE WHEN p.phone IS NOT NULL THEN 1 ELSE 0 END +
               CASE WHEN p.updated_at > p.created_at THEN 1 ELSE 0 END +
               CASE WHEN EXISTS (SELECT 1 FROM professionals WHERE user_id = p.id) THEN 1 ELSE 0 END +
               CASE WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = p.email) THEN 1 ELSE 0 END) >= 2 THEN '⚠️ ÉVALUER - Moyen'
        ELSE '❌ SUPPRIMER - Incomplet'
    END as recommendation,
    ROW_NUMBER() OVER (ORDER BY (CASE WHEN p.full_name IS NOT NULL AND p.full_name != '' THEN 1 ELSE 0 END +
                                   CASE WHEN p.phone IS NOT NULL THEN 1 ELSE 0 END +
                                   CASE WHEN p.updated_at > p.created_at THEN 1 ELSE 0 END +
                                   CASE WHEN EXISTS (SELECT 1 FROM professionals WHERE user_id = p.id) THEN 1 ELSE 0 END +
                                   CASE WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = p.email) THEN 1 ELSE 0 END) DESC, p.updated_at DESC) as rank
FROM profiles p
WHERE p.email = 'admin@swipotonpro.fr'
ORDER BY total_score DESC, p.updated_at DESC;

-- 6. Action recommandée (ID à conserver)
SELECT 
    'ACTION RECOMMENDED' as info,
    'CONSERVER cet ID:' as action,
    id as profile_id_to_keep,
    email,
    full_name,
    updated_at
FROM profiles 
WHERE email = 'admin@swipotonpro.fr'
ORDER BY updated_at DESC, created_at DESC
LIMIT 1;
