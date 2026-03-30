-- Table pour les paramètres admin
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}',
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_admin_settings_feature_id ON admin_settings(feature_id);
CREATE INDEX IF NOT EXISTS idx_admin_settings_category ON admin_settings(category);
CREATE INDEX IF NOT EXISTS idx_admin_settings_enabled ON admin_settings(enabled);

-- Table pour l'historique des changements de settings
CREATE TABLE IF NOT EXISTS admin_settings_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_id TEXT NOT NULL REFERENCES admin_settings(feature_id),
  old_value JSONB,
  new_value JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les logs d'activation/désactivation
CREATE TABLE IF NOT EXISTS feature_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'enabled', 'disabled', 'config_updated'
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security)
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_usage_logs ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour admin_settings
-- Seuls les admins peuvent voir/modifier les settings
CREATE POLICY "Admins can view all settings" ON admin_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update settings" ON admin_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can insert settings" ON admin_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Politiques RLS pour admin_settings_history
CREATE POLICY "Admins can view settings history" ON admin_settings_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can insert settings history" ON admin_settings_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Politiques RLS pour feature_usage_logs
CREATE POLICY "Admins can view usage logs" ON feature_usage_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "System can insert usage logs" ON feature_usage_logs
  FOR INSERT WITH CHECK (true);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_admin_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_admin_settings_updated_at
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_settings_updated_at();

-- Trigger pour logger les changements de settings
CREATE OR REPLACE FUNCTION log_settings_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Logger dans l'historique
  INSERT INTO admin_settings_history (setting_id, old_value, new_value, changed_by)
  VALUES (
    NEW.feature_id,
    row_to_json(OLD),
    row_to_json(NEW),
    auth.uid()
  );
  
  -- Logger dans les logs d'usage
  INSERT INTO feature_usage_logs (feature_id, action, user_id, metadata)
  VALUES (
    NEW.feature_id,
    CASE 
      WHEN OLD.enabled = false AND NEW.enabled = true THEN 'enabled'
      WHEN OLD.enabled = true AND NEW.enabled = false THEN 'disabled'
      ELSE 'config_updated'
    END,
    auth.uid(),
    jsonb_build_object(
      'old_enabled', OLD.enabled,
      'new_enabled', NEW.enabled,
      'old_config', OLD.config,
      'new_config', NEW.config
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_settings_changes
  AFTER UPDATE ON admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION log_settings_changes();

-- Insertion des settings par défaut
INSERT INTO admin_settings (feature_id, name, enabled, config, category) VALUES
  -- Monétisation
  ('lead_packs', 'Packs de Leads', false, 
   '{"pack_discovery_price": 199, "pack_professional_price": 499, "pack_premium_price": 999}', 
   'monetization'),
  
  ('subscriptions', 'Abonnements Mensuels', false,
   '{"basic_monthly_price": 99, "pro_monthly_price": 249, "enterprise_monthly_price": 499}',
   'monetization'),
   
  ('commissions', 'Système de Commissions', false,
   '{"bronze_rate": 10, "silver_rate": 12, "gold_rate": 15, "platinum_rate": 20}',
   'monetization'),
   
  -- IA et Matching
  ('ai_matching', 'IA Matching Intelligent', false,
   '{"min_score_threshold": 40, "max_matches_per_project": 10, "auto_match_enabled": false}',
   'ai'),
   
  ('conversion_prediction', 'Prédiction de Conversion', false,
   '{"prediction_threshold": 0.5, "auto_categorization_enabled": false}',
   'ai'),
   
  ('dynamic_pricing', 'Prix Dynamique', false,
   '{"base_price_multiplier": 1.0, "demand_factor_weight": 0.3, "seasonality_factor_weight": 0.2}',
   'ai'),
   
  -- Automatisations
  ('email_sequences', 'Séquences Email Automatiques', false,
   '{"welcome_sequence_enabled": false, "followup_sequence_enabled": false, "re_engagement_enabled": false}',
   'automation'),
   
  ('push_notifications', 'Notifications Push', false,
   '{"new_lead_notifications": false, "match_notifications": false, "message_notifications": false}',
   'automation'),
   
  ('chatbot_qualification', 'Chatbot de Qualification', false,
   '{"auto_qualification_enabled": false, "qualification_threshold": 40}',
   'automation'),
   
  -- Fonctionnalités Core
  ('project_matching', 'Matching Manuel', true, '{}', 'core'),
  ('lead_management', 'Gestion des Leads', true, '{}', 'core'),
  ('professional_validation', 'Validation des Professionnels', true, '{}', 'core')
ON CONFLICT (feature_id) DO NOTHING;
