-- Table pour les paramètres de la plateforme
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('pricing', 'features', 'limits', 'notifications', 'general')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

-- Index pour recherche rapide
CREATE INDEX idx_platform_settings_category ON platform_settings(category);
CREATE INDEX idx_platform_settings_key ON platform_settings(setting_key);

-- RLS Policies
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active settings"
  ON platform_settings FOR SELECT
  USING (is_active = true);

CREATE POLICY "Only admins can modify settings"
  ON platform_settings FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Insertion des paramètres par défaut
INSERT INTO platform_settings (setting_key, setting_value, description, category) VALUES
('match_payment_enabled', '{"enabled": true}', 'Activer/désactiver le système de paiement pour débloquer les coordonnées', 'features'),
('match_payment_price', '{"amount": 1500, "currency": "EUR"}', 'Prix en centimes pour débloquer un match (15.00€)', 'pricing'),
('credit_prices', '{"packs": [{"credits": 10, "price": 5000}, {"credits": 50, "price": 20000}, {"credits": 100, "price": 35000}]}', 'Packs de crédits disponibles à l''achat', 'pricing'),
('new_pro_bonus', '{"credits": 5, "enabled": true}', 'Crédits bonus pour les nouveaux professionnels', 'features'),
('max_daily_matches', '{"limit": 20}', 'Nombre maximum de matches par jour par professionnel', 'limits'),
('maintenance_mode', '{"enabled": false, "message": ""}', 'Mode maintenance de la plateforme', 'general'),
('promo_banner', '{"enabled": false, "text": "", "link": ""}', 'Bannière promotionnelle sur la page d''accueil', 'general')
ON CONFLICT (setting_key) DO NOTHING;

COMMENT ON TABLE platform_settings IS 'Paramètres configurables de la plateforme par les admins';