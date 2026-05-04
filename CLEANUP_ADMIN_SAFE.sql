-- =====================================================
-- NETTOYAGE ADMIN SÉCURISÉ - FULL STACK APPROACH
-- Exécuter SEULEMENT après analyse ADMIN_FINAL_ANALYSIS.sql
-- =====================================================

-- ATTENTION: Exécuter ces commandes UNE PAR UNIE après vérification

-- 1. SUPPRIMER LE DOUBLON (décommenter et exécuter SEULEMENT si nécessaire)
-- DELETE FROM profiles 
-- WHERE id = 'ID_A_SUPPRIMER' 
-- AND email = 'admin@swipotonpro.fr';

-- 2. VÉRIFICATION APRÈS NETTOYAGE
-- SELECT COUNT(*) as remaining_admins 
-- FROM profiles 
-- WHERE email = 'admin@swipotonpro.fr';

-- 3. VÉRIFIER TOUS LES COMPTES ADMIN FINAUX
-- SELECT id, email, role, full_name, phone
-- FROM profiles 
-- WHERE role IN ('admin', 'super_admin')
-- ORDER BY email;
