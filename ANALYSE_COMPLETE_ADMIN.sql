-- ANALYSE COMPLÈTE DU FLUX ADMIN
-- Vérifions chaque étape du processus

-- 1. Vérification que l'utilisateur Auth existe
SELECT id, email, confirmed_at, last_sign_in_at
FROM auth.users 
WHERE email = 'admin@swipetonpro.fr';

-- 2. Vérification que le profil existe avec le bon rôle
SELECT id, email, full_name, role, created_at, updated_at
FROM profiles 
WHERE id = '29a2361d-6568-4d5f-99c6-557b971778cc';

-- 3. Vérification que le rôle est bien dans la liste autorisée
SELECT 
  p.role,
  CASE 
    WHEN p.role = 'super_admin' THEN '✅ Dans ADMIN_ROLES'
    WHEN p.role = 'admin' THEN '✅ Dans ADMIN_ROLES'
    ELSE '❌ PAS dans ADMIN_ROLES'
  END as admin_check,
  CASE 
    WHEN p.role = 'super_admin' THEN '✅ Dans FULL_ACCESS_ROLES'
    ELSE '❌ PAS dans FULL_ACCESS_ROLES'
  END as full_access_check
FROM profiles p
WHERE id = '29a2361d-6568-4d5f-99c6-557b971778cc';

-- 4. Vérification que la page dashboard admin existe
-- (Cette vérification se fait dans le code, pas en SQL)

-- MESSAGE
DO $$
BEGIN
    RAISE NOTICE '🔍 Analyse complète terminée';
    RAISE NOTICE '📊 Si tout est ✅ ci-dessus, le problème est dans le middleware';
END $$;
