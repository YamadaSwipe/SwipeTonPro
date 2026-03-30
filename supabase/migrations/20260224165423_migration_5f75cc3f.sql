-- =====================================================
-- PHASE 2: NOUVEAU MODÈLE PAY-PER-MATCH
-- =====================================================

-- Table pour les paiements de mise en relation
CREATE TABLE IF NOT EXISTS match_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL DEFAULT 15.00,
  currency TEXT NOT NULL DEFAULT 'EUR',
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_charge_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_match_payments_professional ON match_payments(professional_id);
CREATE INDEX IF NOT EXISTS idx_match_payments_project ON match_payments(project_id);
CREATE INDEX IF NOT EXISTS idx_match_payments_status ON match_payments(status);
CREATE INDEX IF NOT EXISTS idx_match_payments_stripe_intent ON match_payments(stripe_payment_intent_id);

-- RLS pour match_payments
ALTER TABLE match_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can view their own payments"
  ON match_payments FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM professionals WHERE id = professional_id));

CREATE POLICY "System can insert payments"
  ON match_payments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update payments"
  ON match_payments FOR UPDATE
  USING (true);

COMMENT ON TABLE match_payments IS 'Paiements uniques pour débloquer les coordonnées d''un projet';