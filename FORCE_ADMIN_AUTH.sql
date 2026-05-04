-- =====================================================
-- CRÉATION FORCÉE DU COMPTE ADMIN DANS SUPABASE AUTH
-- Solution alternative quand l'interface ne fonctionne pas
-- =====================================================

-- 1. Vérifier l'état actuel
SELECT 
    'CURRENT STATE' as info,
    COUNT(*) as profiles_count,
    STRING_AGG(email, ', ') as profile_emails
FROM profiles 
WHERE email = 'admin@swipotonpro.fr';

-- 2. Vérifier si le compte existe déjà dans auth.users
SELECT 
    'AUTH USERS CHECK' as info,
    COUNT(*) as auth_count,
    STRING_AGG(email, ', ') as auth_emails
FROM auth.users 
WHERE email = 'admin@swipotonpro.fr';

-- 3. Obtenir l'ID du profil admin
SELECT 
    'ADMIN PROFILE ID' as info,
    id,
    email,
    role,
    full_name
FROM profiles 
WHERE email = 'admin@swipotonpro.fr'
AND role = 'super_admin'
LIMIT 1;

-- 4. CRÉATION MANUELLE DANS auth.users (avec permissions)
-- NOTE: Cette commande nécessite des droits étendus
-- Si elle échoue, utilisez l'alternative dans le commentaire

-- Approche 1: Insertion directe (peut échouer)
/*
INSERT INTO auth.users (
    id,
    email,
    email_confirmed_at,
    phone,
    created_at,
    updated_at,
    aud,
    role,
    is_sso_user,
    phone_confirmed_at
) 
VALUES (
    '29a2361d-6568-4d5f-99c6-557b971778cc',  -- ID du profil admin
    'admin@swipotonpro.fr',
    NOW(),
    NULL,
    NOW(),
    NOW(),
    'authenticated',
    'authenticated',
    false,
    NULL
);
*/

-- 5. Alternative: Utiliser l'API RPC (plus sûr)
-- Créer une fonction pour créer l'utilisateur

/*
CREATE OR REPLACE FUNCTION create_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insérer dans auth.users avec les permissions appropriées
    INSERT INTO auth.users (
        id,
        email,
        email_confirmed_at,
        created_at,
        updated_at,
        aud,
        role
    ) 
    SELECT 
        id,
        email,
        NOW(),
        NOW(),
        NOW(),
        'authenticated',
        'authenticated'
    FROM profiles 
    WHERE email = 'admin@swipotonpro.fr'
    AND role = 'super_admin'
    AND NOT EXISTS (
        SELECT 1 FROM auth.users WHERE email = 'admin@swipotonpro.fr'
    );
END;
$$;
*/

-- 6. Appeler la fonction
-- SELECT create_admin_user();

-- 7. Vérification après création
SELECT 
    'VERIFICATION' as info,
    au.id,
    au.email,
    au.email_confirmed_at,
    au.created_at,
    p.email as profile_email,
    p.role as profile_role
FROM auth.users au
JOIN profiles p ON au.id = p.id
WHERE au.email = 'admin@swipotonpro.fr';

-- 8. SOLUTION ALTERNATIVE: Modifier le login pour utiliser le hook
-- Si tout échoue, nous pouvons forcer l'utilisation du hook admin fantôme

-- 9. Instructions manuelles pour le Dashboard
/*
Si les commandes SQL échouent:

1. Allez dans Supabase Dashboard
2. Authentication > Users
3. Cliquez sur "Invite new user"
4. Email: admin@swipotonpro.fr
5. Cochez "Auto-confirm user"
6. Une fois créé, allez dans l'utilisateur et reset password
*/

-- 10. État final des options disponibles
SELECT 
    'AVAILABLE OPTIONS' as info,
    'Option 1:' as method,
    'Créer via Dashboard (invite new user)' as description
UNION ALL
SELECT 
    'AVAILABLE OPTIONS' as info,
    'Option 2:' as method,
    'Utiliser RPC function create_admin_user()' as description
UNION ALL
SELECT 
    'AVAILABLE OPTIONS' as info,
    'Option 3:' as method,
    'Forcer hook admin fantôme dans le code' as description
UNION ALL
SELECT 
    'AVAILABLE OPTIONS' as info,
    'Option 4:' as method,
    'Créer manuellement avec INSERT direct' as description;
