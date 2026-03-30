-- SUPPRESSION COMPLÈTE DE L'ANCIEN COMPTE ADMIN
-- On le supprime de partout et on recrée un neuf

-- 1. Supprimer le profil de la table profiles
DELETE FROM profiles 
WHERE email = 'admin@swipotonpro.fr';

-- 2. Supprimer l'utilisateur de auth.users (nécessite les droits admin)
-- Cette commande doit être exécutée avec des droits élevés
-- Si ça ne marche pas, faites-le manuellement dans l'interface

-- 3. Vérification que tout est supprimé
SELECT 'PROFILS' as table_name, COUNT(*) as count 
FROM profiles 
WHERE email = 'admin@swipotonpro.fr'
UNION ALL
SELECT 'AUTH_USERS' as table_name, COUNT(*) as count 
FROM auth.users 
WHERE email = 'admin@swipotonpro.fr';

-- 4. Recréer le compte admin proprement
-- D'abord créez l'utilisateur dans Auth Supabase:
-- Authentication > Users > "Add user"
-- Email: admin@swipetonpro.fr
-- Mot de passe: Admin123!
-- Cochez "Auto-confirm user"

-- 5. Puis exécutez cette partie avec le nouvel ID
INSERT INTO profiles (
  id, 
  email, 
  full_name, 
  role, 
  created_at, 
  updated_at
) VALUES (
  'NOUVEL_ID_GENERÉ',  -- Remplacez avec le nouvel ID
  'admin@swipotonpro.fr',
  'Super Admin',
  'super_admin',
  NOW(),
  NOW()
);

-- 6. Vérification finale
SELECT id, email, full_name, role, created_at, updated_at
FROM profiles 
WHERE email = 'admin@swipotonpro.fr';

-- MESSAGE
DO $$
BEGIN
    RAISE NOTICE '✅ Ancien compte admin supprimé !';
    RAISE NOTICE '🔄 Créez le nouvel utilisateur dans Auth d''abord';
    RAISE NOTICE '🔑 Puis exécutez la deuxième partie avec le nouvel ID';
END $$;
