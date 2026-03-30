-- VÉRIFICATION SIMPLE DU RÔLE ADMIN
-- Sans fonctions compliquées

-- 1. Vérification du profil admin
SELECT id, email, full_name, role, created_at, updated_at
FROM profiles 
WHERE id = '29a2361d-6568-4d5f-99c6-557b971778cc';

-- 2. Test simple de la condition
SELECT 
  p.role,
  CASE 
    WHEN p.role = 'super_admin' THEN '✅ AUTORISÉ'
    WHEN p.role = 'admin' THEN '✅ AUTORISÉ'
    ELSE '❌ BLOQUÉ'
  END as status
FROM profiles p
WHERE id = '29a2361d-6568-4d5f-99c6-557b971778cc';
