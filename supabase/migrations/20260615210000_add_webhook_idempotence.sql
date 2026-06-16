-- =====================================================
-- MIGRATION: Ajout idempotence webhooks Stripe
-- Date: 15 juin 2026
-- Description: Empêche le traitement multiple des webhooks Stripe
-- =====================================================

-- Table pour tracker les événements webhook traités
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB,
  status TEXT DEFAULT 'processed' CHECK (status IN ('processed', 'failed', 'retrying')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_id ON webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at DESC);

-- RLS
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Seuls les admins peuvent voir les webhooks
CREATE POLICY "Admins can view webhook events"
  ON webhook_events FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'super_admin')));

-- Le système peut insérer
CREATE POLICY "System can insert webhook events"
  ON webhook_events FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE webhook_events IS 'Tracking des événements webhook Stripe pour idempotence';
