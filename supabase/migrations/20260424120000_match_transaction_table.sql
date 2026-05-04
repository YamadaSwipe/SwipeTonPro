-- =====================================================
-- TABLE: MATCH_TRANSACTIONS - Historique complet des paiements
-- =====================================================

CREATE TABLE IF NOT EXISTS match_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Qui a payé
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  
  -- Pour quel projet
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Détails du match (si créé)
  match_id UUID REFERENCES project_interests(id) ON DELETE SET NULL,
  
  -- Combien a été payé
  amount_cents INTEGER NOT NULL,
  amount_euros DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  
  -- Mode de paiement
  payment_method TEXT NOT NULL CHECK (payment_method IN ('card', 'credits', 'subscription', 'free')),
  
  -- Si paiement par crédits
  credits_used INTEGER DEFAULT 0,
  
  -- Statut du paiement
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'disputed')),
  
  -- Référence Stripe (si paiement par carte)
  stripe_payment_intent_id TEXT,
  stripe_session_id TEXT,
  stripe_charge_id TEXT,
  
  -- Prix d'estimation IA au moment du paiement
  ai_estimation_min INTEGER,
  ai_estimation_max INTEGER,
  
  -- Palier tarifaire utilisé
  pricing_tier_id UUID,
  pricing_tier_label TEXT,
  
  -- Dates importantes
  paid_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Métadonnées pour traçabilité
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Informations sur le remboursement
  refund_amount_cents INTEGER DEFAULT 0,
  refund_reason TEXT,
  
  -- Contrainte unique pour éviter les doublons (index partiel créé après)
  CONSTRAINT unique_professional_project_payment 
    UNIQUE (professional_id, project_id)
);

-- Index pour performances
-- Index unique partiel pour eviter les doublons sur les paiements completes
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_completed_payment 
  ON match_transactions(professional_id, project_id) 
  WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_match_transactions_professional 
  ON match_transactions(professional_id);
CREATE INDEX IF NOT EXISTS idx_match_transactions_project 
  ON match_transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_match_transactions_status 
  ON match_transactions(status);
CREATE INDEX IF NOT EXISTS idx_match_transactions_created_at 
  ON match_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_match_transactions_payment_method 
  ON match_transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_match_transactions_stripe_intent 
  ON match_transactions(stripe_payment_intent_id) 
  WHERE stripe_payment_intent_id IS NOT NULL;

-- RLS Policies
ALTER TABLE match_transactions ENABLE ROW LEVEL SECURITY;

-- Professionnel peut voir ses propres transactions
CREATE POLICY "Professionals can view their own transactions"
  ON match_transactions FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM professionals WHERE id = professional_id));

-- Admin peut tout voir
CREATE POLICY "Admins can view all transactions"
  ON match_transactions FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- System peut insérer
CREATE POLICY "System can insert transactions"
  ON match_transactions FOR INSERT
  WITH CHECK (true);

-- System peut mettre à jour
CREATE POLICY "System can update transactions"
  ON match_transactions FOR UPDATE
  USING (true);

COMMENT ON TABLE match_transactions IS 
  'Historique complet et traçable de tous les paiements de mise en relation';

-- =====================================================
-- FONCTION: Get match transactions avec filtres
-- =====================================================
CREATE OR REPLACE FUNCTION get_match_transactions(
  p_professional_id UUID DEFAULT NULL,
  p_project_id UUID DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  professional_id UUID,
  project_id UUID,
  match_id UUID,
  amount_cents INTEGER,
  amount_euros DECIMAL,
  payment_method TEXT,
  credits_used INTEGER,
  status TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  ai_estimation_min INTEGER,
  ai_estimation_max INTEGER,
  pricing_tier_label TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  project_title TEXT,
  professional_company_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mt.id,
    mt.professional_id,
    mt.project_id,
    mt.match_id,
    mt.amount_cents,
    mt.amount_euros,
    mt.payment_method,
    mt.credits_used,
    mt.status,
    mt.paid_at,
    mt.ai_estimation_min,
    mt.ai_estimation_max,
    mt.pricing_tier_label,
    mt.created_at,
    p.title AS project_title,
    pro.company_name AS professional_company_name
  FROM match_transactions mt
  LEFT JOIN projects p ON p.id = mt.project_id
  LEFT JOIN professionals pro ON pro.id = mt.professional_id
  WHERE 
    (p_professional_id IS NULL OR mt.professional_id = p_professional_id)
    AND (p_project_id IS NULL OR mt.project_id = p_project_id)
    AND (p_status IS NULL OR mt.status = p_status)
    AND (p_start_date IS NULL OR mt.created_at >= p_start_date)
    AND (p_end_date IS NULL OR mt.created_at <= p_end_date)
  ORDER BY mt.created_at DESC;
END;
$$;

-- =====================================================
-- FONCTION: Get transaction stats pour dashboard admin
-- =====================================================
CREATE OR REPLACE FUNCTION get_match_transaction_stats(
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  total_revenue_euros DECIMAL,
  total_transactions INTEGER,
  successful_transactions INTEGER,
  refunded_transactions INTEGER,
  total_credits_used INTEGER,
  average_amount_euros DECIMAL,
  card_payments_count INTEGER,
  credits_payments_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN mt.status = 'completed' THEN mt.amount_euros ELSE 0 END), 0) as total_revenue_euros,
    COUNT(*)::INTEGER as total_transactions,
    COUNT(CASE WHEN mt.status = 'completed' THEN 1 END)::INTEGER as successful_transactions,
    COUNT(CASE WHEN mt.status = 'refunded' THEN 1 END)::INTEGER as refunded_transactions,
    COALESCE(SUM(mt.credits_used), 0)::INTEGER as total_credits_used,
    COALESCE(AVG(CASE WHEN mt.status = 'completed' THEN mt.amount_euros END), 0) as average_amount_euros,
    COUNT(CASE WHEN mt.payment_method = 'card' THEN 1 END)::INTEGER as card_payments_count,
    COUNT(CASE WHEN mt.payment_method = 'credits' THEN 1 END)::INTEGER as credits_payments_count
  FROM match_transactions mt
  WHERE 
    (p_start_date IS NULL OR mt.created_at >= p_start_date)
    AND (p_end_date IS NULL OR mt.created_at <= p_end_date);
END;
$$;
