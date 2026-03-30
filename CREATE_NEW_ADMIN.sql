-- CRÉATION D'UN NOUVEAU COMPTE ADMIN PROPRE
-- Oubliez l'ancien, on en crée un neuf

-- 1. Créez d'abord l'utilisateur dans Auth Supabase
-- Allez dans: Authentication > Users > "Add user"
-- Email: newadmin@swipetonpro.fr
-- Mot de passe: Admin123!
-- Cochez "Auto-confirm user"

-- 2. Une fois créé, exécutez ce script pour créer le profil
INSERT INTO profiles (
  id, 
  email, 
  full_name, 
  role, 
  created_at, 
  updated_at
) VALUES (
  'NOUVEL_ID_AUTH_ICI',  -- Récupérez l'ID depuis Auth Users
  'newadmin@swipotonpro.fr',
  'New Super Admin',
  'super_admin',
  NOW(),
  NOW()
);

-- 3. Vérification
SELECT id, email, full_name, role, created_at 
FROM profiles 
WHERE email = 'newadmin@swipotonpro.fr';

-- MESSAGE
DO $$
BEGIN
    RAISE NOTICE '✅ Nouveau compte admin prêt !';
    RAISE NOTICE '📧 Email: newadmin@swipotonpro.fr';
    RAISE NOTICE '🔑 Mot de passe: Admin123!';
    RAISE NOTICE '🔄 N''oubliez pas de remplacer NOUVEL_ID_AUTH_ICI';
END $$;
