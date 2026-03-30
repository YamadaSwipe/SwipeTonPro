-- Table pour l'historique des transactions de crédits
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'spend', 'refund', 'bonus', 'penalty')),
  amount INTEGER NOT NULL, -- Positif pour ajout, négatif pour dépense
  balance_after INTEGER NOT NULL,
  description TEXT NOT NULL,
  reference_type TEXT, -- 'payment', 'match', 'promo', 'admin'
  reference_id UUID, -- ID du paiement, match, etc.
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) -- NULL si système, sinon admin_id
);

-- Indexes pour performance
CREATE INDEX idx_credit_transactions_professional ON credit_transactions(professional_id);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

-- RLS Policies
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can view their own transactions"
  ON credit_transactions FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM professionals WHERE id = credit_transactions.professional_id
    )
  );

CREATE POLICY "System can insert transactions"
  ON credit_transactions FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE credit_transactions IS 'Historique complet de toutes les transactions de crédits';