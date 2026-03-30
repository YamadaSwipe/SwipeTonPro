-- SCRIPT POUR VERIFIER ET CORRIGER LE PROFIL ADMIN
-- Basé sur l'utilisateur que vous m'avez montré

-- 1. Vérifier si l'utilisateur existe dans profiles
SELECT id, email, full_name, role, created_at, updated_at 
FROM profiles 
WHERE id = '55101558-7c22-45be-baff-4688b1419b3d' 
   OR email = 'admin@swipetonpro.fr';

-- 2. Créer ou mettre à jour le profil (ON CONFLICT gère les deux cas)
INSERT INTO profiles (
  id, 
  email, 
  full_name, 
  role, 
  created_at, 
  updated_at
) VALUES (
  '55101558-7c22-45be-baff-4688b1419b3d',
  'admin@swipetonpro.fr',
  'Super Admin',
  'super_admin',
  COALESCE((SELECT created_at FROM profiles WHERE id = '55101558-7c22-45be-baff-4688b1419b3d'), '2026-02-25 02:54:04.864449+00'),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  full_name = 'Super Admin',
  updated_at = NOW();

-- 3. Vérification finale
SELECT id, email, full_name, role, created_at, updated_at 
FROM profiles 
WHERE id = '55101558-7c22-45be-baff-4688b1419b3d';

-- 4. Liste de tous les utilisateurs avec rôles
SELECT id, email, full_name, role, created_at 
FROM profiles 
WHERE role IN ('admin', 'super_admin', 'moderator')
ORDER BY created_at DESC;

-- MESSAGE
DO $$
BEGIN
    RAISE NOTICE '✅ Profil admin vérifié/créé !';
    RAISE NOTICE '📧 Email: admin@swipetonpro.fr';
    RAISE NOTICE '🔑 Rôle: super_admin';
    RAISE NOTICE '🆔 ID: 55101558-7c22-45be-baff-4688b1419b3d';
    RAISE NOTICE '🔄 Ce script fonctionne même si le profil existe déjà';
END $$;
