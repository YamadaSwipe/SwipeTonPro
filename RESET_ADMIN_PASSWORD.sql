-- RÉINITIALISER LE MOT DE PASSE ADMIN
-- ATTENTION: Ça va déconnecter l'utilisateur !

-- 1. Supprimons d'abord le profil (comme avant)
DELETE FROM profiles 
WHERE email = 'admin@swipotonpro.fr';

-- 2. Recréons le profil admin
INSERT INTO profiles (
  id, 
  email, 
  full_name, 
  role, 
  created_at, 
  updated_at
) VALUES (
  '55101558-7c22-45be-baff-4688b1419b3d',
  'admin@swipotonpro.fr',
  'Super Admin',
  'super_admin',
  '2026-02-25 02:54:04.864449+00',
  NOW()
);

-- 3. Pour le mot de passe, vous DEVEZ le faire via l'interface Supabase
-- Allez dans: Authentication > Users > admin@swipotonpro.fr > Reset password
-- Entrez: Red1980

-- 4. Vérification finale
SELECT id, email, full_name, role, created_at, updated_at
FROM profiles 
WHERE email = 'admin@swipotonpro.fr';

-- MESSAGE
DO $$
BEGIN
    RAISE NOTICE '✅ Profil admin recréé !';
    RAISE NOTICE '🔑 POUR LE MOT DE PASSE: Allez dans Supabase Dashboard';
    RAISE NOTICE '📧 Authentication > Users > admin@swipotonpro.fr > Reset password';
    RAISE NOTICE '🔐 Entrez: Red1980';
END $$;
