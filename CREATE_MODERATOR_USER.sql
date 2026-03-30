-- SCRIPT POUR CRÉER UN UTILISATEUR MODÉRATEUR
-- Exécutez ce script pour créer un compte modérateur

-- 1. Créer l'utilisateur dans auth
-- Note: Cette partie doit être faite manuellement via l'interface Supabase Auth
-- ou via une inscription normale, puis nous mettons à jour son rôle

-- 2. Mettre à jour le profil de l'utilisateur pour le rôle 'moderator'
-- Remplacez 'user_id_here' par l'ID réel de l'utilisateur créé

-- Exemple pour un utilisateur existant (remplacez l'ID):
UPDATE profiles 
SET role = 'moderator' 
WHERE email = 'moderator@swipetonpro.com';

-- Si l'utilisateur n'existe pas dans profiles, créez-le:
INSERT INTO profiles (
  id, 
  email, 
  full_name, 
  role, 
  created_at, 
  updated_at
) VALUES (
  'user_id_here',  -- Remplacez par l'ID réel de l'utilisateur auth
  'moderator@swipetonpro.com',
  'Modérateur SwipeTonPro',
  'moderator',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  role = 'moderator',
  updated_at = NOW();

-- 3. Vérification
SELECT id, email, full_name, role, created_at 
FROM profiles 
WHERE role IN ('moderator', 'support', 'admin', 'super_admin')
ORDER BY created_at DESC;

-- MESSAGE DE SUCCÈS
DO $$
BEGIN
    RAISE NOTICE '✅ Utilisateur modérateur configuré !';
    RAISE NOTICE '📧 Email: moderator@swipetonpro.com';
    RAISE NOTICE '🔑 Rôle: moderator';
    RAISE NOTICE '⚠️  N''oubliez pas de créer l''utilisateur dans Auth d''abord !';
END $$;
