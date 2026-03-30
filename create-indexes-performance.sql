-- Index pour accélérer les requêtes dashboard
CREATE INDEX IF NOT EXISTS idx_projects_status_published ON projects(status) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_project_interests_status ON project_interests(status, professional_id);
CREATE INDEX IF NOT EXISTS idx_bids_project_id ON bids(project_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Index composites pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_projects_status_category ON projects(status, category);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- Vérification des index créés
SELECT 
    indexname, 
    tablename 
FROM pg_indexes 
WHERE tablename IN ('projects', 'notifications', 'project_interests', 'bids', 'profiles')
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
