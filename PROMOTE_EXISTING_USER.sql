-- =====================================================
-- PROMOUVOIR UN UTILISATEUR EXISTANT EN ADMIN
-- Solution temporaire si Supabase Auth est down
-- =====================================================

-- 1. Lister les utilisateurs existants
SELECT 'UTILISATEURS DISPONIBLES' as section, 
       id, 
       email, 
       created_at,
       email_confirmed_at is not null as confirmed
FROM auth.users 
WHERE email NOT LIKE '%admin@swipetonpro%'
ORDER BY created_at DESC
LIMIT 10;

-- 2. Vérifier les profils existants
SELECT 'PROFILS DISPONIBLES' as section,
       p.id,
       p.email,
       p.full_name,
       p.role,
       p.created_at
FROM profiles p
WHERE p.email NOT LIKE '%admin@swipotonpro%'
ORDER BY p.created_at DESC
LIMIT 10;

-- 3. Promouvoir un utilisateur en admin (décommentez après choix)
/*
UPDATE profiles 
SET role = 'super_admin',
    full_name = 'Super Admin Temporaire',
    updated_at = NOW()
WHERE email = 'EMAIL_CHOISI_ICI';
*/

-- 4. Vérifier la promotion
/*
SELECT 'PROMOTION EFFECTUÉE' as status,
       p.email,
       p.full_name,
       p.role,
       p.updated_at
FROM profiles p
WHERE p.email = 'EMAIL_CHOISI_ICI';
*/
