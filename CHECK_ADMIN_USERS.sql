-- VÉRIFICATION DES UTILISATEURS ADMIN RESTANTS
-- On vérifie quels comptes admin existent

-- 1. Vérification de tous les utilisateurs avec rôle admin ou super_admin
SELECT id, email, full_name, role, created_at, updated_at
FROM profiles 
WHERE role IN ('admin', 'super_admin')
ORDER BY created_at DESC;

-- 2. Vérification dans auth.users
SELECT id, email, confirmed_at, last_sign_in_at, created_at
FROM auth.users 
WHERE email LIKE '%admin%'
ORDER BY created_at DESC;

-- 3. Comptage par rôle
SELECT role, COUNT(*) as count
FROM profiles 
GROUP BY role
ORDER BY count DESC;
