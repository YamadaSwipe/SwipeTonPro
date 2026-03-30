-- Créer la table permissions
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Tous peuvent lire les permissions
CREATE POLICY "Anyone can view permissions" ON permissions FOR SELECT USING (true);

-- Policy: Seuls les super_admins peuvent modifier
CREATE POLICY "Super admins can manage permissions" ON permissions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

COMMENT ON TABLE permissions IS 'Liste de toutes les permissions disponibles dans le système';