-- FIX IMMÉDIAT : Supprimer toutes les policies pour arrêter la récursion
-- Désactiver RLS temporairement
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE professionals DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les policies existantes
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;

DROP POLICY IF EXISTS "Professionals can view own profile" ON professionals;
DROP POLICY IF EXISTS "Professionals can update own profile" ON professionals;
DROP POLICY IF EXISTS "Professionals can insert own profile" ON professionals;
DROP POLICY IF EXISTS "Admins can view all professionals" ON professionals;
DROP POLICY IF EXISTS "Admins can update all professionals" ON professionals;
DROP POLICY IF EXISTS "Admins can insert professionals" ON professionals;

-- RÉACTIVER RLS avec des policies simples SANS récursion
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;

-- Policies SIMPLES pour profiles
CREATE POLICY "Allow all operations for authenticated users" ON profiles
  FOR ALL USING (auth.role() = 'authenticated');

-- Policies SIMPLES pour professionals  
CREATE POLICY "Allow all operations for authenticated users" ON professionals
  FOR ALL USING (auth.role() = 'authenticated');

-- Donner les permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON professionals TO authenticated;
GRANT ALL ON profiles TO service_role;
GRANT ALL ON professionals TO service_role;
