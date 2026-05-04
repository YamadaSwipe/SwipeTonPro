-- RÉINITIALISER LE MOT DE PASSE ADMIN
-- Exécutez ce script dans Supabase SQL Editor

-- 1. Mettre à jour le mot de passe de l'admin
UPDATE auth.users 
SET password_hash = crypt('Admin123!', gen_salt('bf'))
WHERE email = 'admin@swipetonpro.fr';

-- 2. Vérifier que l'utilisateur existe
SELECT id, email, created_at, last_sign_in_at 
FROM auth.users 
WHERE email = 'admin@swipotonpro.fr';

-- 3. Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Mot de passe admin réinitialisé !';
    RAISE NOTICE '📧 Email: admin@swipotonpro.fr';
    RAISE NOTICE '🔑 Nouveau mot de passe: Admin123!';
    RAISE NOTICE '🔗 Connectez-vous: http://localhost:3000/auth/login';
END $$;
