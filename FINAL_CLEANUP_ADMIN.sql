-- =====================================================
-- NETTOYAGE FINAL ADMIN - FULL STACK APPROACH
-- Suppression sécurisée du doublon admin fantôme
-- =====================================================

-- 1. VÉRIFICATION AVANT NETTOYAGE
SELECT 
    'BEFORE CLEANUP' as info,
    COUNT(*) as total_admins_before
FROM profiles 
WHERE role IN ('admin', 'super_admin');

-- 2. SUPPRESSION DU DOUBLON (admin fantôme)
DELETE FROM profiles 
WHERE id = '00000000-0000-0000-0000-000000000001' 
AND email = 'admin@swipotonpro.fr';

-- 3. VÉRIFICATION APRÈS NETTOYAGE
SELECT 
    'AFTER CLEANUP' as info,
    COUNT(*) as total_admins_after
FROM profiles 
WHERE role IN ('admin', 'super_admin');

-- 4. ÉTAT FINAL DES COMPTES ADMIN
SELECT 
    'FINAL ADMIN ACCOUNTS' as info,
    id,
    email,
    full_name,
    role,
    phone
FROM profiles 
WHERE role IN ('admin', 'super_admin')
ORDER BY role DESC, email;

-- 5. RÉCAPITULATIF COMPLET DU SYSTÈME
SELECT 
    'SYSTEM SUMMARY' as info,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN role = 'client' THEN 1 END) as clients,
    COUNT(CASE WHEN role = 'professional' THEN 1 END) as professionals,
    COUNT(CASE WHEN role IN ('admin', 'super_admin') THEN 1 END) as admins
FROM profiles;

-- 6. COMPTES DISPONIBLES POUR CONNEXION
SELECT 
    'LOGIN CREDENTIALS' as info,
    'Admin Principal:' as account_type,
    'admin@swipotonpro.fr / Admin123!' as credentials
UNION ALL
SELECT 
    'LOGIN CREDENTIALS' as info,
    'Admin Contact:' as account_type,
    'contact@swipotonpro.fr / ???' as credentials
UNION ALL
SELECT 
    'LOGIN CREDENTIALS' as info,
    'Compte PRO:' as account_type,
    'sotbirida@gmail.com / TempPro123!' as credentials
UNION ALL
SELECT 
    'LOGIN CREDENTIALS' as info,
    'Compte CLIENT:' as account_type,
    'sotbirida@yahoo.fr / TempClient123!' as credentials;
