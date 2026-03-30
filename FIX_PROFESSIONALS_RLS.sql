-- Script pour corriger les erreurs 406 sur la table professionals
-- Problème: Les RLS policies bloquent l'accès à la table professionals

-- 1. Désactiver temporairement RLS sur la table professionals
ALTER TABLE professionals DISABLE ROW LEVEL SECURITY;

-- 2. Créer une policy très permissive pour permettre toutes les opérations
DROP POLICY IF EXISTS "Professionals can view own profile" ON professionals;
DROP POLICY IF EXISTS "Professionals can update own profile" ON professionals;
DROP POLICY IF EXISTS "Professionals can insert own profile" ON professionals;
DROP POLICY IF EXISTS "Admins can view all professionals" ON professionals;
DROP POLICY IF EXISTS "Admins can update all professionals" ON professionals;

-- 3. Créer une policy qui permet tout (temporairement)
CREATE POLICY "Allow all operations on professionals" ON professionals
    FOR ALL USING (true) WITH CHECK (true);

-- 4. Réactiver RLS
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;

-- 5. Vérifier que la table a bien les bonnes colonnes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'professionals' 
ORDER BY ordinal_position;
