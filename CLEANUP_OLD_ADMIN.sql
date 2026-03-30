-- NETTOYAGE COMPLET DE L'ANCIEN UTILISATEUR ADMIN
-- Suppression définitive de l'ancien compte

-- 1. Vérification s'il existe encore
SELECT id, email, created_at, last_sign_in_at
FROM auth.users 
WHERE email = 'admin@swipetonpro.fr';

-- 2. Suppression du profil s'il existe
DELETE FROM profiles 
WHERE email = 'admin@swipetonpro.fr';

-- 3. Pour supprimer l'utilisateur auth, vous devez le faire manuellement:
-- Allez dans Supabase Dashboard > Authentication > Users
-- Trouvez l'ancien admin@swipetonpro.fr et supprimez-le

-- 4. Vérification finale
SELECT 'Anciens comptes admin restants' as status, COUNT(*) as count
FROM auth.users 
WHERE email = 'admin@swipetonpro.fr'
UNION ALL
SELECT 'Anciens profils admin restants' as status, COUNT(*) as count
FROM profiles 
WHERE email = 'admin@swipetonpro.fr';
