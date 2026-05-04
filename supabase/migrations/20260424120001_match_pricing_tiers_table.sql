-- =====================================================
-- TABLE: MATCH_PRICING_TIERS - Paliers tarifaires configurables par admin
-- =====================================================

CREATE TABLE IF NOT EXISTS match_pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identification du palier
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  
  -- Fourchette de budget (estimation IA) à laquelle ce palier s'applique
  budget_min INTEGER NOT NULL DEFAULT 0,
  budget_max INTEGER, -- NULL = pas de limite supérieure
  
  -- Prix en crédits (1 crédit = ~5€)
  credits_cost INTEGER NOT NULL DEFAULT 1,
  
  -- Prix en euros (pour paiement par carte)
  price_cents INTEGER NOT NULL,
  price_euros DECIMAL(10,2) GENERATED ALWAYS AS (price_cents / 100.0) STORED,
  
  -- Devise
  currency TEXT NOT NULL DEFAULT 'EUR',
  
  -- Ordre d'affichage
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  -- Activation/Désactivation par admin
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Limites éventuelles
  max_purchases_per_pro_per_month INTEGER, -- NULL = illimité
  max_total_purchases INTEGER, -- NULL = illimité
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  
  -- Contrainte: budget_min < budget_max (si budget_max défini)
  CONSTRAINT valid_budget_range CHECK (
    budget_max IS NULL OR budget_min < budget_max
  )
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_match_pricing_tiers_active 
  ON match_pricing_tiers(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_match_pricing_tiers_budget_range 
  ON match_pricing_tiers(budget_min, budget_max) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_match_pricing_tiers_sort 
  ON match_pricing_tiers(sort_order);

-- RLS Policies
ALTER TABLE match_pricing_tiers ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir les paliers actifs
CREATE POLICY "Anyone can view active pricing tiers"
  ON match_pricing_tiers FOR SELECT
  USING (is_active = true);

-- Admin peut tout voir
CREATE POLICY "Admins can view all pricing tiers"
  ON match_pricing_tiers FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Seul l'admin peut modifier
CREATE POLICY "Only admins can modify pricing tiers"
  ON match_pricing_tiers FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

COMMENT ON TABLE match_pricing_tiers IS 
  'Paliers tarifaires pour les matchs, configurables par les administrateurs sans modification de code';

-- =====================================================
-- DONNÉES: Paliers par défaut basés sur l'estimation IA
-- =====================================================

INSERT INTO match_pricing_tiers (key, label, description, budget_min, budget_max, credits_cost, price_cents, sort_order, is_active)
VALUES 
  ('small', 'Petit projet', 'Projets jusqu a 1000 euros d estimation', 0, 100000, 1, 500, 1, true),
  ('medium', 'Projet moyen', 'Projets de 1000 a 5000 euros d estimation', 100000, 500000, 2, 1000, 2, true),
  ('large', 'Gros projet', 'Projets de 5000 a 15000 euros d estimation', 500000, 1500000, 3, 1500, 3, true),
  ('xlarge', 'Tres gros projet', 'Projets de 15000 a 50000 euros d estimation', 1500000, 5000000, 5, 2500, 4, true),
  ('enterprise', 'Projet exceptionnel', 'Projets > 50000 euros d estimation', 5000000, NULL, 10, 5000, 5, true)
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- FONCTION: get_match_price (remplace la fonction existante)
-- =====================================================
DROP FUNCTION IF EXISTS get_match_price(INTEGER);

CREATE OR REPLACE FUNCTION get_match_price(p_budget INTEGER)
RETURNS TABLE (
  id UUID,
  key TEXT,
  label TEXT,
  description TEXT,
  budget_min INTEGER,
  budget_max INTEGER,
  credits_cost INTEGER,
  price_cents INTEGER,
  price_euros DECIMAL,
  currency TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mpt.id,
    mpt.key,
    mpt.label,
    mpt.description,
    mpt.budget_min,
    mpt.budget_max,
    mpt.credits_cost,
    mpt.price_cents,
    mpt.price_euros,
    mpt.currency
  FROM match_pricing_tiers mpt
  WHERE mpt.is_active = true
    AND p_budget >= mpt.budget_min
    AND (mpt.budget_max IS NULL OR p_budget < mpt.budget_max)
  ORDER BY mpt.budget_min DESC
  LIMIT 1;
END;
$$;

-- =====================================================
-- FONCTION: update_match_pricing_tier (pour admin)
-- =====================================================
CREATE OR REPLACE FUNCTION update_match_pricing_tier(
  p_tier_id UUID,
  p_updates JSONB,
  p_admin_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_admin_id AND role = 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  
  -- Mettre à jour le palier
  UPDATE match_pricing_tiers
  SET
    label = COALESCE(p_updates->>'label', label),
    description = COALESCE(p_updates->>'description', description),
    budget_min = COALESCE((p_updates->>'budget_min')::INTEGER, budget_min),
    budget_max = NULLIF(COALESCE((p_updates->>'budget_max')::INTEGER, budget_max), 0),
    credits_cost = COALESCE((p_updates->>'credits_cost')::INTEGER, credits_cost),
    price_cents = COALESCE((p_updates->>'price_cents')::INTEGER, price_cents),
    sort_order = COALESCE((p_updates->>'sort_order')::INTEGER, sort_order),
    is_active = COALESCE((p_updates->>'is_active')::BOOLEAN, is_active),
    max_purchases_per_pro_per_month = COALESCE((p_updates->>'max_purchases_per_pro_per_month')::INTEGER, max_purchases_per_pro_per_month),
    max_total_purchases = COALESCE((p_updates->>'max_total_purchases')::INTEGER, max_total_purchases),
    updated_at = NOW(),
    updated_by = p_admin_id
  WHERE id = p_tier_id
  RETURNING jsonb_build_object(
    'id', id,
    'key', key,
    'label', label,
    'budget_min', budget_min,
    'budget_max', budget_max,
    'credits_cost', credits_cost,
    'price_cents', price_cents,
    'is_active', is_active
  ) INTO v_result;
  
  RETURN jsonb_build_object('success', true, 'data', v_result);
END;
$$;

-- =====================================================
-- TRIGGER: update updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_match_pricing_tiers_updated_at
  BEFORE UPDATE ON match_pricing_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEW: match_pricing_summary pour le dashboard admin
-- =====================================================
CREATE OR REPLACE VIEW match_pricing_summary AS
SELECT 
  mpt.*,
  COALESCE(mt_stats.usage_count, 0) as usage_count,
  COALESCE(mt_stats.revenue_euros, 0) as revenue_euros
FROM match_pricing_tiers mpt
LEFT JOIN (
  SELECT 
    mt.pricing_tier_id,
    COUNT(*) as usage_count,
    SUM(mt.amount_euros) as revenue_euros
  FROM match_transactions mt
  WHERE mt.status = 'completed'
  GROUP BY mt.pricing_tier_id
) mt_stats ON mt_stats.pricing_tier_id = mpt.id
ORDER BY mpt.sort_order;
