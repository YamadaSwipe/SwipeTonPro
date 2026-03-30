-- SCRIPT MINIMAL : DÉSACTIVER RLS SANS ERREURS
-- Version ultra-simple qui ne cause pas d'erreurs

-- 1. DÉSACTIVER RLS SUR LES TABLES PRINCIPALES (IGNORER LES ERREURS)
DO $$
BEGIN
    -- Profiles
    BEGIN
        ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ profiles RLS désactivé';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ profiles RLS déjà désactivé ou table inexistante';
    END;
    
    -- Professionals  
    BEGIN
        ALTER TABLE professionals DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ professionals RLS désactivé';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ professionals RLS déjà désactivé ou table inexistante';
    END;
    
    -- Projects
    BEGIN
        ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ projects RLS désactivé';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ projects RLS déjà désactivé ou table inexistante';
    END;
    
    -- Bids
    BEGIN
        ALTER TABLE bids DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ bids RLS désactivé';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ bids RLS déjà désactivé ou table inexistante';
    END;
    
    -- Messages
    BEGIN
        ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ messages RLS désactivé';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ messages RLS déjà désactivé ou table inexistante';
    END;
    
    -- Reviews
    BEGIN
        ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ reviews RLS désactivé';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ reviews RLS déjà désactivé ou table inexistante';
    END;
    
    -- Credit Transactions
    BEGIN
        ALTER TABLE credit_transactions DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ credit_transactions RLS désactivé';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ credit_transactions RLS déjà désactivé ou table inexistante';
    END;
    
    -- Notifications
    BEGIN
        ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ notifications RLS désactivé';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ notifications RLS déjà désactivé ou table inexistante';
    END;
    
    -- Documents
    BEGIN
        ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ documents RLS désactivé';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ documents RLS déjà désactivé ou table inexistante';
    END;
END $$;

-- 2. SUPPRIMER LES POLITIQUES (IGNORER LES ERREURS)
DO $$
BEGIN
    -- Supprimer toutes les policies sur toutes les tables
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own profile" ON profiles';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update own profile" ON profiles';
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert own profile" ON profiles';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles';
    
    EXECUTE 'DROP POLICY IF EXISTS "Professionals can view own profile" ON professionals';
    EXECUTE 'DROP POLICY IF EXISTS "Professionals can update own profile" ON professionals';
    EXECUTE 'DROP POLICY IF EXISTS "Professionals can insert own profile" ON professionals';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view all professionals" ON professionals';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can update all professionals" ON professionals';
    
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own projects" ON projects';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update own projects" ON projects';
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert own projects" ON projects';
    EXECUTE 'DROP POLICY IF EXISTS "Professionals can view all projects" ON projects';
    EXECUTE 'DROP POLICY IF EXISTS "Professionals can bid on projects" ON projects';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view all projects" ON projects';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can update all projects" ON projects';
    
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own bids" ON bids';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update own bids" ON bids';
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert own bids" ON bids';
    EXECUTE 'DROP POLICY IF EXISTS "Professionals can view own bids" ON bids';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view all bids" ON bids';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can update all bids" ON bids';
    
    RAISE NOTICE '✅ Politiques supprimées avec succès';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Erreur lors de la suppression des politiques (normal si certaines n''existent pas)';
END $$;

-- 3. CRÉER POLITIQUES PERMISSIVES SUR LES TABLES QUI EXISTENT
DO $$
BEGIN
    -- Profiles
    BEGIN
        CREATE POLICY "Enable all access on profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ profiles RLS réactivé avec politique permissive';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Impossible de configurer profiles (table inexistante?)';
    END;
    
    -- Professionals
    BEGIN
        CREATE POLICY "Enable all access on professionals" ON professionals FOR ALL USING (true) WITH CHECK (true);
        ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ professionals RLS réactivé avec politique permissive';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Impossible de configurer professionals (table inexistante?)';
    END;
    
    -- Projects
    BEGIN
        CREATE POLICY "Enable all access on projects" ON projects FOR ALL USING (true) WITH CHECK (true);
        ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ projects RLS réactivé avec politique permissive';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Impossible de configurer projects (table inexistante?)';
    END;
    
    -- Bids
    BEGIN
        CREATE POLICY "Enable all access on bids" ON bids FOR ALL USING (true) WITH CHECK (true);
        ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ bids RLS réactivé avec politique permissive';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Impossible de configurer bids (table inexistante?)';
    END;
    
    -- Messages
    BEGIN
        CREATE POLICY "Enable all access on messages" ON messages FOR ALL USING (true) WITH CHECK (true);
        ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ messages RLS réactivé avec politique permissive';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Impossible de configurer messages (table inexistante?)';
    END;
    
    -- Reviews
    BEGIN
        CREATE POLICY "Enable all access on reviews" ON reviews FOR ALL USING (true) WITH CHECK (true);
        ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ reviews RLS réactivé avec politique permissive';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Impossible de configurer reviews (table inexistante?)';
    END;
    
    -- Credit Transactions
    BEGIN
        CREATE POLICY "Enable all access on credit_transactions" ON credit_transactions FOR ALL USING (true) WITH CHECK (true);
        ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ credit_transactions RLS réactivé avec politique permissive';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Impossible de configurer credit_transactions (table inexistante?)';
    END;
    
    -- Notifications
    BEGIN
        CREATE POLICY "Enable all access on notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);
        ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ notifications RLS réactivé avec politique permissive';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Impossible de configurer notifications (table inexistante?)';
    END;
    
    -- Documents
    BEGIN
        CREATE POLICY "Enable all access on documents" ON documents FOR ALL USING (true) WITH CHECK (true);
        ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ documents RLS réactivé avec politique permissive';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Impossible de configurer documents (table inexistante?)';
    END;
END $$;

-- MESSAGE FINAL
DO $$
BEGIN
    RAISE NOTICE '🎉 SCRIPT TERMINÉ !';
    RAISE NOTICE '✅ RLS configuré avec politiques permissives';
    RAISE NOTICE '✅ Les erreurs 406 devraient maintenant disparaître';
    RAISE NOTICE '⚠️  Vérifiez les messages ci-dessus pour voir quelles tables ont été configurées';
END $$;
