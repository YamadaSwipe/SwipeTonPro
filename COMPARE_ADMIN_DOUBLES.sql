-- =====================================================
-- COMPARAISON DÉTAILLÉE DES DOUBLONS ADMIN
-- =====================================================

-- 1. Comparaison complète des deux comptes admin@swipetonpro.fr
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
WHERE email = 'admin@swipetonpro.fr'
ORDER BY updated_at DESC, created_at DESC;

-- 2. Vérifier s'il y a des données associées à chaque ID
SELECT 
    'ASSOCIATED DATA CHECK' as info,
    p.id as profile_id,
    p.email,
    CASE 
        WHEN pr.id IS NOT NULL THEN '✅ Données PRO présentes'
        ELSE '❌ Pas de données PRO'
    END as has_professional_data,
    CASE 
        WHEN pj.id IS NOT NULL THEN '✅ Projets présents'
        ELSE '❌ Pas de projets'
    END as has_projects,
    CASE 
        WHEN au.id IS NOT NULL THEN '✅ Données auth utilisateurs'
        ELSE '❌ Pas de données auth'
    END as has_auth_data
FROM profiles p
LEFT JOIN professionals pr ON p.id = pr.user_id
LEFT JOIN projects pj ON p.id = pj.user_id
LEFT JOIN auth.users au ON p.id = au.id::text
WHERE p.email = 'admin@swipetonpro.fr'
ORDER BY p.updated_at DESC;

-- 3. Compter les relations pour chaque compte
SELECT 
    'RELATIONSHIP COUNT' as info,
    p.id as profile_id,
    p.email,
    p.created_at,
    p.updated_at,
    COUNT(DISTINCT pr.id) as professional_count,
    COUNT(DISTINCT pj.id) as project_count,
    COUNT(DISTINCT au.id) as auth_user_count,
    (COUNT(DISTINCT pr.id) + COUNT(DISTINCT pj.id) + COUNT(DISTINCT au.id)) as total_relations
FROM profiles p
LEFT JOIN professionals pr ON p.id = pr.user_id
LEFT JOIN projects pj ON p.id = pj.user_id
LEFT JOIN auth.users au ON p.id = au.id::text
WHERE p.email = 'admin@swipetonpro.fr'
GROUP BY p.id, p.email, p.created_at, p.updated_at
ORDER BY total_relations DESC, p.updated_at DESC;

-- 4. Vérifier les sessions et tokens éventuels
SELECT 
    'SESSION CHECK' as info,
    p.id as profile_id,
    p.email,
    CASE 
        WHEN au.id IS NOT NULL THEN 
            CASE 
                WHEN au.last_sign_in_at IS NOT NULL THEN '✅ Dernière connexion: ' || au.last_sign_in_at::text
                ELSE '✅ Compte auth existant'
            END
        ELSE '❌ Pas de compte auth'
    END as auth_status,
    CASE 
        WHEN au.email_confirmed_at IS NOT NULL THEN '✅ Email confirmé'
        ELSE '❌ Email non confirmé'
    END as email_status
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id::text
WHERE p.email = 'admin@swipetonpro.fr'
ORDER BY p.updated_at DESC;

-- 5. Recommandation automatique
SELECT 
    'RECOMMENDATION' as info,
    p.id as profile_id_to_keep,
    p.email,
    p.updated_at,
    p.full_name,
    CASE 
        WHEN p.updated_at > p.created_at AND p.phone IS NOT NULL THEN '🎯 CONSERVER - Complet et récent'
        WHEN p.updated_at > p.created_at THEN '🎯 CONSERVER - Mis à jour'
        WHEN p.phone IS NOT NULL THEN '🎯 CONSERVER - Téléphone présent'
        ELSE '⚠️ ÉVALUER - Peu de données'
    END as recommendation,
    ROW_NUMBER() OVER (ORDER BY p.updated_at DESC, p.created_at DESC) as rank
FROM profiles p
WHERE p.email = 'admin@swipotonpro.fr'
ORDER BY p.updated_at DESC, p.created_at DESC;
