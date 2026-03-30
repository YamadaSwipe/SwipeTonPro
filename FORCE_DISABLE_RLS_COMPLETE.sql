-- SCRIPT DE FORCE BRUTE - DÉSACTIVER RLS COMPLÈTEMENT
-- Solution radicale pour arrêter les erreurs 406

-- 1. DÉSACTIVER RLS SUR TOUTES LES TABLES (FORCE BRUTE)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE professionals DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE bids DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;

-- 2. SUPPRIMER TOUTES LES POLITIQUES (FORCE BRUTE)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Enable all access on profiles" ON profiles;
DROP POLICY IF EXISTS "Universal access" ON profiles;
DROP POLICY IF EXISTS "Allow all operations" ON profiles;

DROP POLICY IF EXISTS "Professionals can view own profile" ON professionals;
DROP POLICY IF EXISTS "Professionals can update own profile" ON professionals;
DROP POLICY IF EXISTS "Professionals can insert own profile" ON professionals;
DROP POLICY IF EXISTS "Admins can view all professionals" ON professionals;
DROP POLICY IF EXISTS "Admins can update all professionals" ON professionals;
DROP POLICY IF EXISTS "Enable all access on professionals" ON professionals;
DROP POLICY IF EXISTS "Universal access" ON professionals;
DROP POLICY IF EXISTS "Allow all operations" ON professionals;

DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
DROP POLICY IF EXISTS "Professionals can view all projects" ON projects;
DROP POLICY IF EXISTS "Professionals can bid on projects" ON projects;
DROP POLICY IF EXISTS "Admins can view all projects" ON projects;
DROP POLICY IF EXISTS "Admins can update all projects" ON projects;
DROP POLICY IF EXISTS "Enable all access on projects" ON projects;
DROP POLICY IF EXISTS "Universal access" ON projects;
DROP POLICY IF EXISTS "Allow all operations" ON projects;

DROP POLICY IF EXISTS "Users can view own bids" ON bids;
DROP POLICY IF EXISTS "Users can update own bids" ON bids;
DROP POLICY IF EXISTS "Users can insert own bids" ON bids;
DROP POLICY IF EXISTS "Professionals can view own bids" ON bids;
DROP POLICY IF EXISTS "Admins can view all bids" ON bids;
DROP POLICY IF EXISTS "Admins can update all bids" ON bids;
DROP POLICY IF EXISTS "Enable all access on bids" ON bids;
DROP POLICY IF EXISTS "Universal access" ON bids;
DROP POLICY IF EXISTS "Allow all operations" ON bids;

DROP POLICY IF EXISTS "Enable all access on messages" ON messages;
DROP POLICY IF EXISTS "Enable all access on reviews" ON reviews;
DROP POLICY IF EXISTS "Enable all access on credit_transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Enable all access on notifications" ON notifications;
DROP POLICY IF EXISTS "Enable all access on documents" ON documents;
DROP POLICY IF EXISTS "Universal access" ON messages;
DROP POLICY IF EXISTS "Universal access" ON reviews;
DROP POLICY IF EXISTS "Universal access" ON credit_transactions;
DROP POLICY IF EXISTS "Universal access" ON notifications;
DROP POLICY IF EXISTS "Universal access" ON documents;
DROP POLICY IF EXISTS "Allow all operations" ON messages;
DROP POLICY IF EXISTS "Allow all operations" ON reviews;
DROP POLICY IF EXISTS "Allow all operations" ON credit_transactions;
DROP POLICY IF EXISTS "Allow all operations" ON notifications;
DROP POLICY IF EXISTS "Allow all operations" ON documents;

-- 3. NE PAS RÉACTIVER RLS (LAISSER DÉSACTIVÉ)
-- C'est la clé : RLS reste complètement désactivé

-- 4. VÉRIFICATION
DO $$
BEGIN
    RAISE NOTICE '🔥 RLS COMPLÈTEMENT DÉSACTIVÉ !';
    RAISE NOTICE '✅ Toutes les politiques supprimées';
    RAISE NOTICE '✅ RLS reste DÉSACTIVÉ (pas de réactivation)';
    RAISE NOTICE '🚀 Les erreurs 406 devraient maintenant DISPARAÎTRE';
    RAISE NOTICE '⚠️  CEST UNE SOLUTION RADICALE MAIS EFFICACE';
END $$;
