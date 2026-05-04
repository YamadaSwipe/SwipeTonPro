-- Migration: Table pour tracker les abandons d'inscription pro
-- Permet d'envoyer des relances et analyser le funnel

CREATE TABLE IF NOT EXISTS pro_signup_abandons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identifiants
  email VARCHAR(255),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Progression
  last_step VARCHAR(50) NOT NULL, -- 'auth', 'info', 'documents', 'portfolio'
  step_reached_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Données partielles (JSONB pour flexibilité)
  partial_data JSONB DEFAULT '{}',
  
  -- Statut de la relance
  reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  reminder_count INTEGER DEFAULT 0,
  
  -- Résolution
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Source/Publicité
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_pro_signup_abandons_email ON pro_signup_abandons(email);
CREATE INDEX IF NOT EXISTS idx_pro_signup_abandons_step ON pro_signup_abandons(last_step);
CREATE INDEX IF NOT EXISTS idx_pro_signup_abandons_reminder ON pro_signup_abandons(reminder_sent, created_at);
CREATE INDEX IF NOT EXISTS idx_pro_signup_abandons_completed ON pro_signup_abandons(completed);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_pro_signup_abandons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_pro_signup_abandons_updated_at ON pro_signup_abandons;

CREATE TRIGGER trigger_pro_signup_abandons_updated_at
  BEFORE UPDATE ON pro_signup_abandons
  FOR EACH ROW
  EXECUTE FUNCTION update_pro_signup_abandons_updated_at();

-- RLS Policies
ALTER TABLE pro_signup_abandons ENABLE ROW LEVEL SECURITY;

-- Service role peut tout faire
CREATE POLICY pro_signup_abandons_service_policy
  ON pro_signup_abandons
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Commentaire
COMMENT ON TABLE pro_signup_abandons IS 'Tracking des abandons d inscription pro pour relances marketing';
