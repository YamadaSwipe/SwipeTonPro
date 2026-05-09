-- Migration: Création du profil admin principal
-- Crée un vrai compte admin avec les identifiants demandés

-- Insertion du profil admin dans la table profiles
INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
) VALUES (
  '29a2361d-6568-4d5f-99c6-557b971778cc',
  'admin@swipetonpro.fr',
  'Super Admin',
  'super_admin',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Création de l'utilisateur dans auth.users via le service role
-- Note: Cette partie doit être exécutée manuellement via Supabase Dashboard
-- ou via une API dédiée car auth.users n'est pas accessible directement en SQL
