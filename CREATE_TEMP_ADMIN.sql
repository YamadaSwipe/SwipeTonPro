-- CRÉATION D'UN COMPTE ADMIN TEMPORAIRE
-- Utilisez le même type de compte que votre particulier qui fonctionne

-- 1. Créez l'utilisateur dans Auth Supabase
-- Authentication > Users > "Add user"
-- Email: tempadmin@swipotonpro.fr
-- Mot de passe: TempAdmin123!
-- Cochez "Auto-confirm user"

-- 2. Créez le profil
INSERT INTO profiles (
  id, 
  email, 
  full_name, 
  role, 
  created_at, 
  updated_at
) VALUES (
  'ID_AUTH_TEMPORAIRE',  -- Remplacez avec l'ID réel
  'tempadmin@swipotonpro.fr',
  'Temp Admin',
  'super_admin',
  NOW(),
  NOW()
);

-- 3. Vérifiez que le profil existe
SELECT id, email, full_name, role, created_at 
FROM profiles 
WHERE email = 'tempadmin@swipotonpro.fr';
