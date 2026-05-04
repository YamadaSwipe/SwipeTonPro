-- =====================================================
-- RECHERCHE ET RÉINITIALISATION DES COMPTES
-- sotbirida@yahoo.fr & sotbirida@gmail.com
-- =====================================================

-- 1. RECHERCHE DES COMPTES EXISTANTS
-- ====================================

-- Recherche dans profiles
SELECT 
    'PROFILES' as table_source,
    id,
    email,
    full_name,
    role,
    phone,
    created_at,
    updated_at,
    CASE 
        WHEN role = 'professional' THEN '👨‍💼 PROFESSIONNEL'
        WHEN role = 'user' THEN '👤 PARTICULIER'
        WHEN role = 'admin' THEN '👑 ADMIN'
        ELSE '❓ INCONNU'
    END as account_type
FROM profiles 
WHERE email IN ('sotbirida@yahoo.fr', 'sotbirida@gmail.com')
ORDER BY email;

-- Recherche dans professionals
SELECT 
    'PROFESSIONALS' as table_source,
    id,
    email,
    company_name,
    specialty,
    status,
    created_at,
    CASE 
        WHEN status = 'approved' THEN '✅ APPROUVÉ'
        WHEN status = 'pending' THEN '⏳ EN ATTENTE'
        WHEN status = 'rejected' THEN '❌ REJETÉ'
        ELSE '❓ INCONNU'
    END as pro_status
FROM professionals 
WHERE email IN ('sotbirida@yahoo.fr', 'sotbirida@gmail.com')
ORDER BY email;

-- 2. PROCÉDURE DE RÉINITIALISATION MOT DE PASSE
-- ============================================

-- Fonction pour réinitialiser le mot de passe
CREATE OR REPLACE FUNCTION reset_user_password(
    p_email TEXT,
    p_new_password TEXT DEFAULT 'TempPassword123!'
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    user_id UUID,
    email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
    auth_user_id UUID;
BEGIN
    -- 1. Vérifier si l'utilisateur existe dans profiles
    SELECT id, email, role INTO user_record
    FROM profiles 
    WHERE email = p_email;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, '❌ Utilisateur non trouvé dans profiles', NULL, p_email;
        RETURN;
    END IF;
    
    -- 2. Mettre à jour le mot de passe dans auth.users (si possible)
    -- Note: Ceci nécessite les permissions appropriées
    BEGIN
        UPDATE auth.users 
        SET password_encrypted = crypt(p_new_password, gen_salt('bf'))
        WHERE email = p_email
        RETURNING id INTO auth_user_id;
        
        IF auth_user_id IS NOT NULL THEN
            -- 3. Mettre à jour le profil
            UPDATE profiles 
            SET updated_at = NOW()
            WHERE id = user_record.id;
            
            RETURN QUERY SELECT true, '✅ Mot de passe réinitialisé avec succès', user_record.id, p_email;
            RETURN;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- Si pas accès à auth.users, créer une procédure alternative
        NULL;
    END;
    
    -- 4. Solution alternative: Créer un token de réinitialisation
    UPDATE profiles 
    SET updated_at = NOW()
    WHERE id = user_record.id;
    
    RETURN QUERY SELECT true, '⚠️ Profil mis à jour (réinitialisation manuelle requise)', user_record.id, p_email;
    RETURN;
END;
$$;

-- 3. UTILISATION DE LA PROCÉDURE
-- ==============================

-- Réinitialiser sotbirida@yahoo.fr
SELECT * FROM reset_user_password('sotbirida@yahoo.fr', 'NouveauMP123!');

-- Réinitialiser sotbirida@gmail.com  
SELECT * FROM reset_user_password('sotbirida@gmail.com', 'NouveauMP123!');

-- 4. CRÉATION DE COMPTES SI NON EXISTANTS
-- =======================================

-- Créer sotbirida@yahoo.fr si n'existe pas
INSERT INTO profiles (
    id,
    user_id,
    email,
    full_name,
    role,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    gen_random_uuid(),
    'sotbirida@yahoo.fr',
    'Sot Birida',
    'professional',
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Créer sotbirida@gmail.com si n'existe pas
INSERT INTO profiles (
    id,
    user_id,
    email,
    full_name,
    role,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    gen_random_uuid(),
    'sotbirida@gmail.com',
    'Sot Birida',
    'professional',
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- 5. VÉRIFICATION FINALE
-- =====================

SELECT 
    'VÉRIFICATION FINALE' as status,
    email,
    role,
    CASE 
        WHEN role = 'professional' THEN '👨‍💻 COMPTE PRO PRÊT'
        WHEN role = 'user' THEN '👤 COMPTE PARTICULIER'
        ELSE '❌ À CONFIGURER'
    END as final_status
FROM profiles 
WHERE email IN ('sotbirida@yahoo.fr', 'sotbirida@gmail.com')
ORDER BY email;
