-- ============================================================================
-- 🚀 CRÉATION DES INDEXES POUR AMÉLIORER LA PERFORMANCE
-- ============================================================================
-- Exécuter ce script dans Supabase SQL Editor
-- Ces indexes vont considérablement accélérer les requêtes
-- ============================================================================

-- 1. Index sur project_interests(status) - utilisé pour compter les matchs acceptés
CREATE INDEX IF NOT EXISTS idx_project_interests_status 
ON project_interests(status);

-- 2. Index composé sur project_interests(project_id, status) - pour les filtres
CREATE INDEX IF NOT EXISTS idx_project_interests_project_status 
ON project_interests(project_id, status);

-- 3. Index sur project_interests(professional_id) - pour trouver les interests d'un pro
CREATE INDEX IF NOT EXISTS idx_project_interests_professional 
ON project_interests(professional_id);

-- 4. Index sur profiles(user_id) - CRITIQUE pour AuthContext
CREATE INDEX IF NOT EXISTS idx_profiles_user_id 
ON profiles(user_id);

-- 5. Index composé sur profiles(role, user_id) - pour les filtres par rôle
CREATE INDEX IF NOT EXISTS idx_profiles_role_user 
ON profiles(role, user_id);

-- 6. Index sur profiles(email) - pour les fallback searches
CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON profiles(email);

-- 7. Index sur professionals(user_id) - critique pour le chargement des pros
CREATE INDEX IF NOT EXISTS idx_professionals_user_id 
ON professionals(user_id);

-- 8. Index sur projects(status) - pour les filtres de projets
CREATE INDEX IF NOT EXISTS idx_projects_status 
ON projects(status);

-- 9. Index sur projects(user_id) - pour les projets d'un utilisateur
CREATE INDEX IF NOT EXISTS idx_projects_user_id 
ON projects(user_id);

-- 10. Index composé sur match_payments pour les requêtes courantes
CREATE INDEX IF NOT EXISTS idx_match_payments_project_professional 
ON match_payments(project_id, professional_id);

-- 11. Index sur match_payments(status) pour les filtres
CREATE INDEX IF NOT EXISTS idx_match_payments_status 
ON match_payments(status);

-- ============================================================================
-- ✅ Indexes créés! 
-- Ces indexes vont accélérer:
-- - Les comptages du dashboard (project_interests, projects, profiles)
-- - Le chargement du user au login (profiles.user_id)
-- - La recherche par email (profiles.email)
-- - Les filtres par rôle (profiles.role)
-- ============================================================================
