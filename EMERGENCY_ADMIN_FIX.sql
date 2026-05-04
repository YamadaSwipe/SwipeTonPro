-- =====================================================
-- FIX D'URGENCE - Contournement complet service Auth
-- Utilisez ceci si Supabase Auth est complètement down
-- =====================================================

-- 1. Vérifier l'état actuel
SELECT 'ÉTAT ACTUEL DES COMPTES ADMIN' as section, id, email, created_at 
FROM auth.users 
WHERE email LIKE '%admin@swipetonpro%';

-- 2. Si aucun utilisateur existe, essayer de créer via API SQL
-- NOTE: Cette méthode peut ne pas fonctionner si Auth est down
-- Mais essayons quand même

-- 3. Alternative : utiliser un compte existant comme admin
-- Cherchez d'autres utilisateurs dans la base
SELECT 'UTILISATEURS EXISTANTS' as section, id, email, created_at 
FROM auth.users 
WHERE email NOT LIKE '%admin@swipetonpro%'
ORDER BY created_at DESC
LIMIT 5;

-- 4. Promouvoir un utilisateur existant en admin
-- (décommentez et modifiez l'email après avoir choisi un utilisateur)
/*
UPDATE profiles 
SET role = 'super_admin', 
    full_name = 'Super Admin Temporaire',
    updated_at = NOW()
WHERE email = 'VOTRE_EMAIL_CHOISI_ICI';
*/

-- 5. Message d'urgence
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '🚨 SERVICE SUPABASE AUTH INDISPONIBLE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '❌ Erreur 500 sur /auth/v1/recover';
  RAISE NOTICE '❌ Erreur 500 sur /auth/users';
  RAISE NOTICE '🔧 SOLUTIONS:';
  RAISE NOTICE '1. Attendre que Supabase répare le service';
  RAISE NOTICE '2. Utiliser un compte existant comme admin';
  RAISE NOTICE '3. Contacter le support Supabase';
  RAISE NOTICE '========================================';
END;
$$;

-- 6. Vérifier si on peut au moins voir les utilisateurs existants
-- Si cette requête fonctionne, Auth n'est pas complètement down
SELECT COUNT(*) as total_users, 
       COUNT(CASE WHEN email LIKE '%@%' THEN 1 END) as valid_emails
FROM auth.users;
