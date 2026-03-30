-- VÉRIFICATION DU MIDDLEWARE
-- On vérifie si le rôle est bien dans la liste autorisée

-- 1. Vérifions le profil admin exact
SELECT id, email, full_name, role, created_at, updated_at
FROM profiles 
WHERE id = '29a2361d-6568-4d5f-99c6-557b971778cc';

-- 2. Testons la condition du middleware
SELECT 
  p.role,
  CASE 
    WHEN p.role IN ('super_admin', 'admin') THEN '✅ AUTORISÉ par middleware'
    ELSE '❌ BLOQUÉ par middleware - redirection vers /dashboard'
  END as middleware_decision
FROM profiles p
WHERE id = '29a2361d-6568-4d5f-99c6-557b971778cc';

-- 3. Vérifions aussi s'il y a des espaces ou caractères cachés
SELECT 
  role,
  length(role) as role_length,
  ascii(role) as ascii_code
FROM profiles 
WHERE id = '29a2361d-6568-4d5f-99c6-557b971778cc';
