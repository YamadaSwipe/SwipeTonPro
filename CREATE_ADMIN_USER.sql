-- SCRIPT POUR CRÉER/VERIFIER UN COMPTE ADMIN
-- Adaptez ce script avec vos vrais identifiants

-- 1. Vérifier si l'utilisateur existe déjà dans profiles
SELECT id, email, full_name, role, created_at 
FROM profiles 
WHERE email = 'votre_email_admin@example.com';  -- REMPLACEZ CET EMAIL

-- 2. Si l'utilisateur n'existe pas, créez-le d'abord dans Auth Supabase:
-- Allez dans Dashboard Supabase > Authentication > Users > Add user
-- Ou inscrivez-vous normalement avec cet email

-- 3. Une fois l'utilisateur créé dans Auth, mettez à jour son rôle:
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'votre_email_admin@example.com';  -- REMPLACEZ CET EMAIL

-- 4. Si l'utilisateur n'existe pas dans profiles, créez-le:
-- (Récupérez d'abord l'ID depuis Auth Supabase)
INSERT INTO profiles (
  id, 
  email, 
  full_name, 
  role, 
  created_at, 
  updated_at
) VALUES (
  'AUTH_USER_ID_HERE',  -- REMPLACEZ par l'ID réel depuis Auth
  'votre_email_admin@example.com',  -- REMPLACEZ CET EMAIL
  'Votre Nom Admin',
  'admin',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  updated_at = NOW();

-- 5. Vérification finale
SELECT id, email, full_name, role, created_at 
FROM profiles 
WHERE email = 'votre_email_admin@example.com';  -- REMPLACEZ CET EMAIL

-- 6. Liste de tous les admins
SELECT id, email, full_name, role, created_at 
FROM profiles 
WHERE role IN ('admin', 'super_admin', 'moderator')
ORDER BY created_at DESC;

-- MESSAGE
DO $$
BEGIN
    RAISE NOTICE '✅ Script exécuté !';
    RAISE NOTICE '📧 Remplacez "votre_email_admin@example.com" par votre vrai email';
    RAISE NOTICE '🔑 Créez l''utilisateur dans Auth Supabase d''abord';
    RAISE NOTICE '⚠️  Vérifiez que l''ID correspond bien entre Auth et Profiles';
END $$;
