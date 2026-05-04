-- =====================================================
-- RECHERCHE COMPTES - sotbirida@yahoo.fr & sotbirida@gmail.com
-- =====================================================

-- 1. Recherche dans la table profiles
SELECT 
    'profiles' as table_name,
    id,
    email,
    full_name,
    role,
    phone,
    created_at,
    updated_at
FROM profiles 
WHERE email IN ('sotbirida@yahoo.fr', 'sotbirida@gmail.com');

-- 2. Recherche dans la table professionals  
SELECT 
    'professionals' as table_name,
    id,
    email,
    company_name,
    specialty,
    status,
    created_at
FROM professionals 
WHERE email IN ('sotbirida@yahoo.fr', 'sotbirida@gmail.com');

-- 3. Recherche dans toutes les tables qui ont un champ email
-- (à exécuter séparément si nécessaire)

-- 4. Vérifier les utilisateurs auth (si accès admin)
SELECT 
    'auth.users' as table_name,
    id,
    email,
    created_at,
    last_sign_in_at,
    email_confirmed_at
FROM auth.users 
WHERE email IN ('sotbirida@yahoo.fr', 'sotbirida@gmail.com');

-- 5. Recherche avec LIKE (au cas où variations)
SELECT 
    'profiles_like' as table_name,
    id,
    email,
    full_name,
    role,
    created_at
FROM profiles 
WHERE email LIKE '%sotbirida%';

-- 6. Compter tous les utilisateurs pour référence
SELECT 
    'total_users' as info,
    COUNT(*) as total_profiles
FROM profiles;

SELECT 
    'total_professionals' as info,  
    COUNT(*) as total_professionals
FROM professionals;

-- 7. Rechercher les emails similaires
SELECT DISTINCT 
    email,
    COUNT(*) as occurrences
FROM profiles 
WHERE email ILIKE '%sotbirida%' OR email ILIKE '%yahoo%' OR email ILIKE '%gmail%'
GROUP BY email
ORDER BY occurrences DESC;
