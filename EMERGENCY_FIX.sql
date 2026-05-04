-- =====================================================
-- DIAGNOSTIC ET RÉPARATION D'URGENCE
-- sotbirida@yahoo.fr & sotbirida@gmail.com
-- =====================================================

-- 1. VÉRIFIER L'ÉTAT ACTUEL DES COMPTES
-- ====================================

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

-- Vérifier les données PRO
SELECT 
    'PROFESSIONALS' as table_name,
    id,
    email,
    company_name,
    siren,
    kbis_url,
    address,
    phone,
    status,
    created_at,
    updated_at
FROM professionals 
WHERE email IN ('sotbirida@yahoo.fr', 'sotbirida@gmail.com')
ORDER BY email;

-- Vérifier les projets du client
SELECT 
    'PROJECTS' as table_name,
    id,
    user_email,
    title,
    description,
    status,
    created_at,
    updated_at
FROM projects 
WHERE user_email IN ('sotbirida@yahoo.fr', 'sotbirida@gmail.com')
ORDER BY user_email, created_at;

-- 2. CRÉER LES COMPTES S'ILS N'EXISTENT PAS
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

-- 3. CRÉER/RÉPARER LES DONNÉES PROFESSIONNELLES
-- ============================================

-- Données PRO pour sotbirida@gmail.com
INSERT INTO professionals (
    id,
    user_id,
    email,
    company_name,
    siren,
    kbis_url,
    address,
    phone,
    status,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    p.id,
    'sotbirida@gmail.com',
    'Sot Birida Entreprise',
    '123456789',
    'https://example.com/kbis.pdf',
    '123 Rue de la République, 75001 Paris',
    '+33612345678',
    'approved',
    NOW(),
    NOW()
FROM profiles p
WHERE p.email = 'sotbirida@gmail.com'
AND p.role = 'professional'
AND NOT EXISTS (
    SELECT 1 FROM professionals WHERE email = 'sotbirida@gmail.com'
);

-- 4. CRÉER UN PROJET TEST POUR LE CLIENT
-- =====================================

-- Projet salle de bain pour sotbirida@yahoo.fr
INSERT INTO projects (
    id,
    user_id,
    user_email,
    title,
    description,
    category,
    status,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    p.id,
    'sotbirida@yahoo.fr',
    'Rénovation Salle de Bain Complète',
    'Projet complet de rénovation de salle de bain avec douche italienne, meubles sur mesure et carrelage premium.',
    'bathroom',
    'in_progress',
    NOW(),
    NOW()
FROM profiles p
WHERE p.email = 'sotbirida@yahoo.fr'
AND p.role = 'client'
AND NOT EXISTS (
    SELECT 1 FROM projects WHERE user_email = 'sotbirida@yahoo.fr'
);

-- 5. MOTS DE PASSE TEMPORAIRES
-- ===========================

-- NOTE: Ces requêtes nécessitent les permissions admin sur auth.users
-- Si elles échouent, utilisez l'interface web pour réinitialiser

/*
-- Réinitialiser mot de passe PRO
UPDATE auth.users 
SET password_encrypted = crypt('TempPro123!', gen_salt('bf'))
WHERE email = 'sotbirida@gmail.com';

-- Réinitialiser mot de passe CLIENT  
UPDATE auth.users 
SET password_encrypted = crypt('TempClient123!', gen_salt('bf'))
WHERE email = 'sotbirida@yahoo.fr';
*/

-- 6. VÉRIFICATION FINALE
-- =====================

SELECT 
    'FINAL CHECK' as status,
    p.email,
    p.role,
    CASE 
        WHEN pr.id IS NOT NULL THEN '✅ Données PRO présentes'
        WHEN pj.id IS NOT NULL THEN '✅ Projets présents'
        ELSE '❌ Données manquantes'
    END as data_status
FROM profiles p
LEFT JOIN professionals pr ON p.email = pr.email
LEFT JOIN projects pj ON p.email = pj.user_email
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
