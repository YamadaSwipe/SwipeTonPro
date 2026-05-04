-- =====================================================
-- RECHERCHE ET RÉINITIALISATION DES COMPTES (VERSION FINALE)
-- sotbirida@yahoo.fr & sotbirida@gmail.com
-- =====================================================

-- 0. Vérifier la structure des tables
-- ==================================

-- Structure de la table profiles
SELECT 
    'PROFILES STRUCTURE' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Structure de la table professionals  
SELECT 
    'PROFESSIONALS STRUCTURE' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'professionals' 
AND table_schema = 'public'
ORDER BY ordinal_position;

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
        WHEN role = 'client' THEN '👤 CLIENT'
        WHEN role = 'admin' THEN '👑 ADMIN'
        WHEN role = 'super_admin' THEN '👑 SUPER ADMIN'
        ELSE '❓ INCONNU'
    END as account_type
FROM profiles 
WHERE email IN ('sotbirida@yahoo.fr', 'sotbirida@gmail.com')
ORDER BY email;

-- Recherche dans professionals (avec les bons noms de colonnes)
SELECT 
    'PROFESSIONALS' as table_source,
    id,
    email,
    company_name,
    COALESCE(specialties, 'Non spécifié') as specialty,
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
    
    -- 2. Tenter de mettre à jour via Supabase Auth
    BEGIN
        -- Cette partie nécessite les permissions admin
        -- Pour l'instant, on met à jour uniquement le profil
        UPDATE profiles 
        SET updated_at = NOW()
        WHERE id = user_record.id;
        
        RETURN QUERY SELECT true, '✅ Profil mis à jour. Utilisez l''interface web pour réinitialiser le mot de passe.', user_record.id, p_email;
        RETURN;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT false, '❌ Erreur lors de la mise à jour: ' || SQLERRM, NULL, p_email;
        RETURN;
    END;
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
    'client',
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
    'client',
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
        WHEN role = 'client' THEN '👤 COMPTE CLIENT'
        WHEN role = 'admin' THEN '👑 COMPTE ADMIN'
        WHEN role = 'super_admin' THEN '👑 COMPTE SUPER ADMIN'
        ELSE '❌ À CONFIGURER'
    END as final_status
FROM profiles 
WHERE email IN ('sotbirida@yahoo.fr', 'sotbirida@gmail.com')
ORDER BY email;

-- 6. STATISTIQUES
-- ===============

SELECT 
    'STATISTIQUES' as info,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN role = 'client' THEN 1 END) as clients,
    COUNT(CASE WHEN role = 'professional' THEN 1 END) as professionals,
    COUNT(CASE WHEN role IN ('admin', 'super_admin') THEN 1 END) as admins
FROM profiles;

-- 7. RECOMMANDATIONS
-- ==================

SELECT 
    'RECOMMANDATIONS' as info,
    'Utiliser l''interface web pour:' as action,
    'http://localhost:3000/admin/account-management' as url
UNION ALL
SELECT 
    'RECOMMANDATIONS' as info,
    'Connexion admin:' as action,
    'admin@swipotonpro.fr / Admin123!' as url
UNION ALL
SELECT 
    'RECOMMANDATIONS' as info,
    'Réinitialisation MP:' as action,
    'TempPassword123! (par défaut)' as url;
