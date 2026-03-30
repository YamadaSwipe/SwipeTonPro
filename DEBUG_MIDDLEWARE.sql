-- SCRIPT POUR VERIFIER LE MIDDLEWARE
-- Vérifions que le profil est bien accessible depuis le middleware

-- 1. Vérification du profil admin
SELECT id, email, full_name, role, created_at, updated_at
FROM profiles 
WHERE email = 'admin@swipetonpro.fr';

-- 2. Vérification que le rôle est bien dans la liste autorisée
SELECT 
  p.role,
  CASE 
    WHEN p.role IN ('super_admin', 'admin', 'support', 'moderator') THEN '✅ AUTORISÉ'
    ELSE '❌ NON AUTORISÉ'
  END as middleware_status
FROM profiles p
WHERE email = 'admin@swipotonpro.fr';

-- 3. Simulation de la requête middleware
-- (même requête que dans le middleware ligne 49-53)
SELECT role
FROM profiles
WHERE id = '55101558-7c22-45be-baff-4688b1419b3d'
LIMIT 1;

-- 4. Vérification des cookies dans le navigateur
-- Instructions:
-- 1. Ouvrez les outils de développement F12
-- 2. Allez dans l'onglet "Application" 
-- 3. Cookies > http://localhost:3000
-- 4. Vérifiez que vous avez:
--    - sb-access-token
--    - sb-refresh-token
