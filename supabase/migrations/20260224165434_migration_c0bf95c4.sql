-- =====================================================
-- PHASE 4: CONFIGURATION PRIX
-- =====================================================

-- Table pour configuration dynamique des prix
CREATE TABLE IF NOT EXISTS pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type TEXT NOT NULL UNIQUE CHECK (service_type IN ('match_payment', 'subscription', 'featured_listing')),
  price DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prix par défaut pour mise en relation
INSERT INTO pricing_config (service_type, price, currency, description)
VALUES 
  ('match_payment', 15.00, 'EUR', 'Paiement unique pour débloquer les coordonnées d''un projet')
ON CONFLICT (service_type) DO NOTHING;

-- RLS
ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active prices"
  ON pricing_config FOR SELECT
  USING (is_active = true);

CREATE POLICY "Only admins can modify prices"
  ON pricing_config FOR ALL
  USING (false);

COMMENT ON TABLE pricing_config IS 'Configuration des prix de la plateforme';