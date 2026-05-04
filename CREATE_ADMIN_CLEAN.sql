-- =====================================================
-- CRÉATION ADMIN MANUELLE - VERSION CORRIGÉE
-- =====================================================

-- 1. Supprimer tous les comptes admin existants
DELETE FROM auth.users WHERE email LIKE '%admin@swipetonpro%';
DELETE FROM profiles WHERE email LIKE '%admin@swipotonpro%';

-- 2. Vérifier l'état final
SELECT 'NETTOYAGE TERMINÉ' as status, COUNT(*) as comptes_supprimes
FROM auth.users 
WHERE email LIKE '%admin@swipotonpro%';

-- 3. Instructions simplifiées
SELECT 'INSTRUCTIONS' as etape, 
       'Allez dans Supabase Dashboard → Authentication → Users → Add user' as instruction
UNION ALL
SELECT 'EMAIL' as etape, 'admin@swipotonpro.fr' as instruction
UNION ALL
SELECT 'PASSWORD' as etape, 'Admin123!' as instruction
UNION ALL
SELECT 'OPTION' as etape, 'Cochez Auto-confirm user' as instruction;
