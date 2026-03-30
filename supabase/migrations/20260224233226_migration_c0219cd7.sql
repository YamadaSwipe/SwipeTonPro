-- Mettre à jour les RLS policies pour admin_actions
DROP POLICY IF EXISTS "Super admins can view all admin actions" ON admin_actions;
DROP POLICY IF EXISTS "Super admins can insert admin actions" ON admin_actions;

CREATE POLICY "Super admins can view all admin actions"
  ON admin_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can insert admin actions"
  ON admin_actions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );