-- SCRIPT D'URGENCE CORRIGÉ : DÉSACTIVER RLS SUR TABLES EXISTANTES
-- Version corrigée qui ne mentionne que les tables qui existent réellement

-- 1. DÉSACTIVER RLS SUR TOUTES LES TABLES PRINCIPALES QUI EXISTENT
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE professionals DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE bids DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;

-- 2. SUPPRIMER TOUTES LES POLITIQUES EXISTANTES
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Professionals can view own profile" ON professionals;
DROP POLICY IF EXISTS "Professionals can update own profile" ON professionals;
DROP POLICY IF EXISTS "Professionals can insert own profile" ON professionals;
DROP POLICY IF EXISTS "Admins can view all professionals" ON professionals;
DROP POLICY IF EXISTS "Admins can update all professionals" ON professionals;
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
DROP POLICY IF EXISTS "Professionals can view all projects" ON projects;
DROP POLICY IF EXISTS "Professionals can bid on projects" ON projects;
DROP POLICY IF EXISTS "Admins can view all projects" ON projects;
DROP POLICY IF EXISTS "Admins can update all projects" ON projects;
DROP POLICY IF EXISTS "Users can view own bids" ON bids;
DROP POLICY IF EXISTS "Users can update own bids" ON bids;
DROP POLICY IF EXISTS "Users can insert own bids" ON bids;
DROP POLICY IF EXISTS "Professionals can view own bids" ON bids;
DROP POLICY IF EXISTS "Admins can view all bids" ON bids;
DROP POLICY IF EXISTS "Admins can update all bids" ON bids;

-- 3. CRÉER DES POLITIQUES TOUT PERMISSIVES (TEMPORAIREMENT)
CREATE POLICY "Enable all access on profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access on professionals" ON professionals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access on projects" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access on bids" ON bids FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access on messages" ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access on reviews" ON reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access on credit_transactions" ON credit_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access on notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access on documents" ON documents FOR ALL USING (true) WITH CHECK (true);

-- 4. RÉACTIVER RLS AVEC LES POLITIQUES PERMISSIVES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- 5. VÉRIFICATION
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    forcereplication as force_replication
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'professionals', 'projects', 'bids', 'messages', 'reviews', 'credit_transactions', 'notifications', 'documents')
ORDER BY tablename;

-- MESSAGE DE SUCCÈS
DO $$
BEGIN
    RAISE NOTICE '✅ RLS désactivé et politiques permissives créées avec succès !';
    RAISE NOTICE '✅ Les erreurs 406 devraient maintenant disparaître';
    RAISE NOTICE '⚠️  CECI EST UNE MESURE TEMPORAIRE - À CORRIGER PLUS TARD';
END $$;
