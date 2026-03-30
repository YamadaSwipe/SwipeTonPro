-- SCRIPT POUR VERIFIER TOUS LES UTILISATEURS AUTH VS PROFILES
-- Identifie qui manque dans la table profiles

-- 1. Voir tous les utilisateurs dans Auth Supabase
-- (Allez dans Dashboard > Authentication > Users)

-- 2. Voir tous les profils existants
SELECT id, email, full_name, role, created_at 
FROM profiles 
ORDER BY created_at DESC;

-- 3. Trouver les utilisateurs Auth qui n'ont pas de profil
-- (Vous devez comparer manuellement avec la liste Auth)

-- 4. Pour chaque utilisateur manquant, créez son profil :
-- Exemple pour support@swipetonpro.fr
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
VALUES (
  'ID_AUTH_ICI',  -- Récupérez l'ID depuis Auth
  'support@swipetonpro.fr',
  'Support SwipeTonPro',
  'support',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  role = 'support',
  updated_at = NOW();

-- 5. Pour team@swipetonpro.fr
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
VALUES (
  'ID_AUTH_ICI',  -- Récupérez l'ID depuis Auth
  'team@swipotonpro.fr',
  'Team SwipeTonPro',
  'support',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  role = 'support',
  updated_at = NOW();

-- 6. Vérification finale
SELECT id, email, full_name, role 
FROM profiles 
WHERE role IN ('admin', 'super_admin', 'moderator', 'support')
ORDER BY created_at DESC;
