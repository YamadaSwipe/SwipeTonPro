-- Donner les permissions nécessaires pour accéder aux tables
-- Activer RLS sur la table users si ce n'est pas déjà fait
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques sur users
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Créer les politiques correctes pour la table users
CREATE POLICY "Users can view own profile" ON users
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users service role key" ON users
FOR SELECT USING (
  auth.role() = 'service_role' AND 
  auth.uid() = id
);

-- Donner accès aux professionnels pour lire les profils utilisateurs
CREATE POLICY "Professionals can view user profiles" ON users
FOR SELECT USING (
  auth.role() IN ('professional', 'admin', 'super_admin') AND 
  EXISTS (
    SELECT 1 FROM professionals 
    WHERE professionals.user_id = auth.uid()
  )
);

-- Donner accès aux admins pour voir tous les profils
CREATE POLICY "Admins can view all profiles" ON users
FOR SELECT USING (
  auth.role() IN ('admin', 'super_admin') AND 
  raw_user_meta_data->>'role' IN ('admin', 'super_admin')
);

-- Activer RLS sur les tables professionals si ce n'est pas déjà fait
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques sur professionals
DROP POLICY IF EXISTS "Users can view own professional profile" ON professionals;
DROP POLICY IF EXISTS "Users can update own professional profile" ON professionals;
DROP POLICY IF EXISTS "Users can insert own professional profile" ON professionals;

-- Créer les politiques correctes pour la table professionals
CREATE POLICY "Users can view own professional profile" ON professionals
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own professional profile" ON professionals
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own professional profile" ON professionals
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Donner accès aux admins pour voir tous les professionnels
CREATE POLICY "Admins can view all professionals" ON professionals
FOR SELECT USING (
  auth.role() IN ('admin', 'super_admin') AND 
  raw_user_meta_data->>'role' IN ('admin', 'super_admin')
);
