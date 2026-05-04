-- =====================================================
-- CONTOURNEMENT TOTAL - Création admin sans Supabase Auth
-- Méthode alternative si Supabase Auth est down
-- =====================================================

-- 1. Créer un profil admin directement (sans passer par auth.users)
-- NOTE: Ceci crée un profil "fantôme" qui contourne Supabase Auth

-- 2. Générer un ID UUID pour l'admin fantôme
-- On utilise un UUID fixe pour l'admin
INSERT INTO profiles (
  id, 
  email, 
  full_name, 
  role, 
  created_at, 
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@swipetonpro.fr',
  'Super Admin',
  'super_admin',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  full_name = 'Super Admin',
  updated_at = NOW();

-- 3. Vérifier la création
SELECT 'ADMIN FANTÔME CRÉÉ' as status,
       p.id,
       p.email,
       p.full_name,
       p.role,
       p.created_at
FROM profiles p
WHERE p.id = '00000000-0000-0000-0000-000000000001';

-- 4. Modifier le code pour accepter cet admin fantôme
-- (instructions pour le code)

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔧 ADMIN FANTÔME CRÉÉ';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📧 Email: admin@swipetonpro.fr';
  RAISE NOTICE '🆔 ID: 00000000-0000-0000-0000-000000000001';
  RAISE NOTICE '👤 Rôle: super_admin';
  RAISE NOTICE '⚠️ Nécessite modification du code auth';
  RAISE NOTICE '========================================';
END;
$$;

-- 5. Instructions pour modifier le code d'auth
/*
Dans votre code AuthContext, ajoutez:

```typescript
// Ajouter dans la fonction getCurrentUser()
if (user?.id === '00000000-0000-0000-0000-000000000001') {
  return {
    id: user.id,
    email: 'admin@swipotonpro.fr',
    full_name: 'Super Admin',
    role: 'super_admin'
  };
}
```
*/
