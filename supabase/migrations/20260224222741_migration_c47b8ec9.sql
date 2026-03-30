-- Table pour tracer les actions des administrateurs
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'user_suspend', 'user_activate', 'user_delete', 
    'payment_refund', 'credits_adjust', 
    'settings_update', 'promo_create', 'promo_delete',
    'professional_verify', 'professional_reject',
    'content_moderate', 'feature_toggle'
  )),
  target_type TEXT, -- 'user', 'professional', 'project', 'payment', 'setting'
  target_id UUID,
  details JSONB NOT NULL DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes pour audit et recherche
CREATE INDEX idx_admin_actions_admin ON admin_actions(admin_id);
CREATE INDEX idx_admin_actions_type ON admin_actions(action_type);
CREATE INDEX idx_admin_actions_created_at ON admin_actions(created_at DESC);
CREATE INDEX idx_admin_actions_target ON admin_actions(target_type, target_id);

-- RLS Policies
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view admin actions"
  ON admin_actions FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

CREATE POLICY "Only admins can insert admin actions"
  ON admin_actions FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
    AND admin_id = auth.uid()
  );

COMMENT ON TABLE admin_actions IS 'Log de toutes les actions administratives pour audit et traçabilité';