-- =====================================================
-- AUDIT COMPTES + ATTRIBUTION DROITS ADMIN
-- Voir tous les vrais comptes et corriger les droits
-- =====================================================

-- 1. TOUS LES UTILISATEURS SUPABASE AUTH (vrais comptes de connexion)
SELECT 
    'AUTH.USERS' as source,
    au.id,
    au.email,
    au.email_confirmed_at is not null as email_confirmed,
    au.created_at,
    au.last_sign_in_at,
    COALESCE(
        (au.raw_user_meta_data->>'full_name')::text,
        (au.raw_user_meta_data->>'name')::text,
        'N/A'
    ) as display_name
FROM auth.users au
ORDER BY au.created_at DESC;

-- 2. TOUS LES PROFILS APPLICATION (droits et rôles)
SELECT 
    'PROFILES' as source,
    p.id,
    p.email,
    p.role,
    p.full_name,
    p.phone,
    p.created_at
FROM profiles p
ORDER BY p.created_at DESC;

-- 3. JOINTURE: Qui a un compte auth + profil complet
SELECT 
    'SYNC STATUS' as source,
    au.id as auth_id,
    au.email,
    p.id as profile_id,
    p.role,
    p.full_name as profile_name,
    CASE 
        WHEN au.id = p.id THEN 'SYNC OK'
        WHEN p.id IS NULL THEN 'PAS DE PROFIL'
        ELSE 'ID DIFFERENT !'
    END as sync_status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id OR au.email = p.email
ORDER BY au.created_at DESC;

-- 4. UTILISATEURS SANS PROFIL (besoin de créer profil)
SELECT 
    'NO PROFILE' as alerte,
    au.id,
    au.email,
    'Profil manquant - utilisateur ne peut pas utiliser l app' as action_requise
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- 5. PROFILS SANS COMPTE AUTH (fantômes / orphelins)
SELECT 
    'NO AUTH ACCOUNT' as alerte,
    p.id,
    p.email,
    p.role,
    'Pas de compte auth.users - connexion impossible via Supabase Auth' as action_requise
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id OR p.email = au.email
WHERE au.id IS NULL;

-- =====================================================
-- CORRECTION: DONNER DROITS ADMIN À L'UTILISATEUR
-- =====================================================

-- Étape A: Trouver l'ID de l'utilisateur admin dans auth.users
-- (Remplacez cet ID par celui affiché dans la requête 1 si différent)
DO $$
DECLARE
    admin_auth_id uuid;
    admin_email text := 'admin@swipetonpro.fr';
    admin_profile_exists boolean;
BEGIN
    -- Récupérer l'ID réel dans auth.users
    SELECT id INTO admin_auth_id 
    FROM auth.users 
    WHERE email = admin_email;
    
    IF admin_auth_id IS NULL THEN
        RAISE NOTICE 'ERREUR: Utilisateur % non trouvé dans auth.users !', admin_email;
        RETURN;
    END IF;
    
    RAISE NOTICE 'Utilisateur auth.users trouvé: ID = %, Email = %', admin_auth_id, admin_email;
    
    -- Vérifier si un profil existe avec cet email
    SELECT EXISTS(SELECT 1 FROM profiles WHERE email = admin_email) INTO admin_profile_exists;
    
    IF admin_profile_exists THEN
        -- Mise à jour du profil existant: synchroniser l'ID + mettre rôle super_admin
        -- Attention: si d'autres tables référencent l'ancien ID, cela peut casser
        -- Solution: on met à jour seulement le rôle et on laisse l'ID tel quel
        -- MAIS le login va échouer car l'ID auth.users != profiles.id
        
        -- Option 1: Si l'ID dans profiles est DIFFERENT de auth.users, 
        -- il faut supprimer et recréer
        DELETE FROM profiles WHERE email = admin_email;
        RAISE NOTICE 'Ancien profil admin supprimé (ID non synchronisé)';
    END IF;
    
    -- Créer le profil avec le BON ID (celui de auth.users)
    INSERT INTO profiles (
        id,
        email,
        role,
        full_name,
        phone,
        created_at
    ) VALUES (
        admin_auth_id,  -- ID IDENTIQUE à auth.users = CLÉ !
        admin_email,
        'super_admin',
        'Super Admin',
        NULL,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        role = 'super_admin',
        full_name = 'Super Admin',
        email = admin_email;
    
    RAISE NOTICE 'Profil admin créé/mis à jour avec ID synchronisé: %', admin_auth_id;
END $$;

-- 6. VÉRIFICATION FINALE: l'admin a bien le bon rôle et le bon ID
SELECT 
    'ADMIN VERIFICATION' as check_type,
    au.id as auth_id,
    au.email as auth_email,
    p.id as profile_id,
    p.role,
    p.full_name,
    CASE WHEN au.id = p.id THEN 'ID SYNC OK' ELSE 'ERREUR ID' END as id_sync,
    CASE WHEN p.role = 'super_admin' THEN 'ROLE OK' ELSE 'ROLE MANQUANT' END as role_check
FROM auth.users au
JOIN profiles p ON au.id = p.id
WHERE au.email = 'admin@swipetonpro.fr';

-- 7. RÉSUMÉ FINAL DE TOUS LES COMPTES
SELECT 
    'FINAL SUMMARY' as info,
    (SELECT COUNT(*) FROM auth.users) as total_auth_users,
    (SELECT COUNT(*) FROM profiles) as total_profiles,
    (SELECT COUNT(*) FROM profiles WHERE role = 'super_admin') as super_admins,
    (SELECT COUNT(*) FROM profiles WHERE role = 'admin') as admins,
    (SELECT COUNT(*) FROM profiles WHERE role = 'professional') as professionals,
    (SELECT COUNT(*) FROM profiles WHERE role = 'client') as clients;
