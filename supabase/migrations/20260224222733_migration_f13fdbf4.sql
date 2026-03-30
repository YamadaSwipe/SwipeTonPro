-- Table pour les codes promotionnels
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'bonus_credits')),
  discount_value INTEGER NOT NULL, -- Pourcentage (ex: 50) ou montant en centimes ou nombre de crédits
  min_purchase_amount INTEGER DEFAULT 0, -- Montant minimum d'achat en centimes
  max_uses INTEGER, -- NULL = illimité
  uses_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  target_user_type TEXT CHECK (target_user_type IN ('all', 'new', 'existing')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_active ON promo_codes(is_active);
CREATE INDEX idx_promo_codes_valid_until ON promo_codes(valid_until);

-- RLS Policies
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active promo codes"
  ON promo_codes FOR SELECT
  USING (is_active = true AND NOW() BETWEEN valid_from AND COALESCE(valid_until, NOW() + INTERVAL '100 years'));

CREATE POLICY "Only admins can manage promo codes"
  ON promo_codes FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

COMMENT ON TABLE promo_codes IS 'Codes promotionnels pour réductions et bonus';