-- =====================================================
-- FIX CORRECT - Réinitialisation mot de passe Admin (.fr)
-- Exécutez ce script dans Supabase SQL Editor
-- =====================================================

-- 1. VÉRIFIER les comptes existants (tous les domaines)
SELECT 'TOUS LES COMPTES ADMIN' as section, id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email LIKE '%admin@swipetonpro%';

-- 2. VÉRIFIER les profils correspondants
SELECT 'PROFILS ADMIN' as section, id, email, full_name, role, created_at 
FROM profiles 
WHERE email LIKE '%admin@swipetonpro%';

-- 3. SUPPRIMER l'ancien compte .com s'il existe
DELETE FROM auth.users WHERE email = 'admin@swipetonpro.com';
DELETE FROM profiles WHERE email = 'admin@swipetonpro.com';

-- 4. UTILISER L'API SUPABASE pour réinitialiser le mot de passe
-- La méthode SQL directe ne fonctionne pas avec auth.users
-- Utilisez plutôt : 
-- Authentication > Users > cherchez "admin@swipetonpro.fr" > Reset Password

-- 5. Vérifier que le profil .fr existe et est correct
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
  id,
  email,
  'Super Admin',
  'super_admin',
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'admin@swipetonpro.fr'
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'admin@swipotonpro.fr')
ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  full_name = 'Super Admin',
  updated_at = NOW();

-- 6. CONFIRMATION FINALE
SELECT 
  '✅ ÉTAT FINAL' as status,
  au.id,
  au.email,
  au.email_confirmed_at is not null as email_confirme,
  p.role,
  p.full_name,
  CASE 
    WHEN au.email LIKE '%.fr' THEN '✅ BON DOMAINE (.fr)'
    WHEN au.email LIKE '%.com' THEN '⚠️ ANCIEN DOMAINE (.com)'
    ELSE '❌ AUTRE DOMAINE'
  END as domaine_status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.email LIKE '%admin@swipetonpro%';

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ NETTOYAGE TERMINÉ';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📧 Compte correct: admin@swipotonpro.fr';
  RAISE NOTICE '🗑️ Ancien compte supprimé: admin@swipotonpro.com';
  RAISE NOTICE '🔑 Pour réinitialiser le mot de passe:';
  RAISE NOTICE '   → Allez dans Authentication > Users';
  RAISE NOTICE '   → Cherchez admin@swipotonpro.fr';
  RAISE NOTICE '   → Cliquez "Reset Password"';
  RAISE NOTICE '========================================';
END $$;
