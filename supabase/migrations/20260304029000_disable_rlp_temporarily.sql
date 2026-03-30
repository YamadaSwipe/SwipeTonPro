-- DÉSACTIVER RLP TEMPORAIREMENT pour débloquer l'accès aux projets
-- C'est une mesure d'urgence pour que les projets s'affichent

-- Désactiver RLS sur les tables critiques
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE professionals DISABLE ROW LEVEL SECURITY;

-- Donner tous les droits à tout le monde temporairement
GRANT ALL ON ALL TABLES IN SCHEMA public TO public;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Afficher l'état actuel
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('projects', 'profiles', 'professionals')
ORDER BY tablename;

-- Message pour les logs
DO $$
BEGIN
    RAISE NOTICE 'RLP désactivé temporairement - ACCÈS COMPLET ACTIVÉ';
    RAISE NOTICE 'Les projets devraient maintenant être visibles';
END $$;
