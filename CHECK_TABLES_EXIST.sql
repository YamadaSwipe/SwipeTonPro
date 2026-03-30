-- SCRIPT POUR VÉRIFIER LES TABLES QUI EXISTENT RÉELLEMENT
-- Exécutez d'abord ce script pour voir quelles tables existent

SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Vérifier aussi les tables avec RLS activé
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
