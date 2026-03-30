-- Créer la table role_permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role user_role NOT NULL,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role, permission_id)
);

-- Enable RLS
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Tous peuvent lire les associations rôle-permission
CREATE POLICY "Anyone can view role permissions" ON role_permissions FOR SELECT USING (true);

-- Policy: Seuls les super_admins peuvent modifier
CREATE POLICY "Super admins can manage role permissions" ON role_permissions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

COMMENT ON TABLE role_permissions IS 'Association entre les rôles et leurs permissions';