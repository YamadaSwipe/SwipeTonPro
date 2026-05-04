-- =====================================================
-- FIX ADMIN SANS auth.users (permission denied)
-- =====================================================

-- 1. Voir tous les profils existants
SELECT id, email, role, full_name FROM profiles ORDER BY email;

-- 2. Supprimer anciens profils admin (ID non synchronisés)
DELETE FROM profiles WHERE email = 'admin@swipotonpro.fr';

-- 3. Insérer NOUVEAU profil admin avec ID temporaire
-- ID réel de l'utilisateur admin dans auth.users
INSERT INTO profiles (id, email, role, full_name, created_at)
VALUES ('ce4dfa9a-1a48-466a-b04e-904c7c0dbf0f', 'admin@swipotonpro.fr', 'super_admin', 'Super Admin', NOW())
ON CONFLICT (id) DO UPDATE SET role = 'super_admin', email = 'admin@swipotonpro.fr';

-- 4. Vérifier
SELECT id, email, role FROM profiles WHERE email = 'admin@swipotonpro.fr';
