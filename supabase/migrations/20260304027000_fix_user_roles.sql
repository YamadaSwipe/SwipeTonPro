-- Vérifier et corriger l'enum user_role
-- D'abord vérifier les valeurs actuelles
SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role');

-- Ajouter tous les rôles manquants utilisés dans le code
DO $$
BEGIN
    -- Ajouter le rôle "support" s'il n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'support' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE 'support';
        RAISE NOTICE 'Rôle "support" ajouté à user_role';
    END IF;

    -- Ajouter le rôle "moderator" s'il n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'moderator' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE 'moderator';
        RAISE NOTICE 'Rôle "moderator" ajouté à user_role';
    END IF;

    -- Ajouter le rôle "team" s'il n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'team' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE 'team';
        RAISE NOTICE 'Rôle "team" ajouté à user_role';
    END IF;
END $$;

-- Afficher tous les rôles disponibles après la mise à jour
SELECT enumlabel as role_available FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role') ORDER BY enumlabel;
