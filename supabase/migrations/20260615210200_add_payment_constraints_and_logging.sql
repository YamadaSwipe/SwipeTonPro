-- =====================================================
-- MIGRATION: Contraintes et logging pour paiements
-- Date: 15 juin 2026
-- Description: Ajoute contraintes uniques et tables de logging
-- =====================================================

-- =====================================================
-- 1. CONTRAINTE UNIQUE sur match_payments
-- =====================================================

-- Empêcher qu'un professionnel paie plusieurs fois pour le même projet
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_match_payment
  ON match_payments(professional_id, project_id)
  WHERE status IN ('pending', 'paid', 'completed');

COMMENT ON INDEX idx_unique_active_match_payment IS 
  'Empêche les doublons de paiement pour un même couple pro/projet';

-- =====================================================
-- 2. INDEX manquants pour performance
-- =====================================================

-- Index sur stripe_payment_intent_id pour recherche rapide dans webhooks
CREATE INDEX IF NOT EXISTS idx_match_payments_stripe_intent 
  ON match_payments(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_match_payments_stripe_session
  ON match_payments(stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

-- Index sur credit_transactions pour recherche par stripe_payment_intent_id
CREATE INDEX IF NOT EXISTS idx_credit_transactions_stripe
  ON credit_transactions(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

-- =====================================================
-- 3. TABLE payment_logs pour logging structuré
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  stripe_event_id TEXT,
  payment_id UUID,
  payment_type TEXT, -- 'match_payment', 'credit_purchase', 'caution'
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  error_message TEXT,
  error_code TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON payment_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_logs_payment_id ON payment_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_stripe_event ON payment_logs(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_status ON payment_logs(status);

-- RLS
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view payment logs"
  ON payment_logs FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'super_admin')));

CREATE POLICY "System can insert payment logs"
  ON payment_logs FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE payment_logs IS 'Logs structurés de tous les événements de paiement';

-- =====================================================
-- 4. TABLE payment_failures pour tracking des échecs
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_payment_intent_id TEXT NOT NULL,
  stripe_charge_id TEXT,
  failure_code TEXT,
  failure_message TEXT,
  amount_cents INTEGER,
  currency TEXT DEFAULT 'eur',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
  metadata JSONB,
  notified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_payment_failures_stripe_intent ON payment_failures(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_failures_user_id ON payment_failures(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_failures_created_at ON payment_failures(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_failures_notified ON payment_failures(notified) WHERE notified = false;

-- RLS
ALTER TABLE payment_failures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payment failures"
  ON payment_failures FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payment failures"
  ON payment_failures FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'super_admin')));

CREATE POLICY "System can insert payment failures"
  ON payment_failures FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update payment failures"
  ON payment_failures FOR UPDATE
  USING (true);

COMMENT ON TABLE payment_failures IS 'Tracking des échecs de paiement Stripe pour analyse et retry';

-- =====================================================
-- 5. Fonction de nettoyage des transactions pending
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_pending_transactions()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Supprimer les transactions pending de plus de 24h
  DELETE FROM credit_transactions
  WHERE status = 'pending'
    AND created_at < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_pending_transactions IS 
  'Nettoie les transactions de crédits en attente depuis plus de 24h';

-- =====================================================
-- 6. Vue pour statistiques de paiement
-- =====================================================

CREATE OR REPLACE VIEW payment_statistics AS
SELECT
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_payments,
  COUNT(*) FILTER (WHERE status = 'paid') as successful_payments,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_payments,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_payments,
  SUM(amount_euros) FILTER (WHERE status = 'paid') as total_revenue_euros,
  AVG(amount_euros) FILTER (WHERE status = 'paid') as avg_payment_euros,
  COUNT(DISTINCT professional_id) as unique_professionals
FROM match_payments
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

COMMENT ON VIEW payment_statistics IS 
  'Statistiques quotidiennes des paiements pour dashboard admin';

-- =====================================================
-- 7. Trigger pour logger automatiquement les paiements
-- =====================================================

CREATE OR REPLACE FUNCTION log_payment_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Logger les changements de statut importants
  IF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) OR TG_OP = 'INSERT' THEN
    INSERT INTO payment_logs (
      event_type,
      payment_id,
      payment_type,
      status,
      metadata
    ) VALUES (
      CASE 
        WHEN TG_OP = 'INSERT' THEN 'payment_created'
        WHEN NEW.status = 'paid' THEN 'payment_completed'
        WHEN NEW.status = 'failed' THEN 'payment_failed'
        ELSE 'payment_updated'
      END,
      NEW.id,
      'match_payment',
      NEW.status,
      jsonb_build_object(
        'professional_id', NEW.professional_id,
        'project_id', NEW.project_id,
        'amount_euros', NEW.amount_euros,
        'payment_method', NEW.payment_method
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_log_match_payment_changes ON match_payments;
CREATE TRIGGER trigger_log_match_payment_changes
  AFTER INSERT OR UPDATE ON match_payments
  FOR EACH ROW
  EXECUTE FUNCTION log_payment_change();

COMMENT ON FUNCTION log_payment_change IS 
  'Trigger pour logger automatiquement les changements de paiement';
