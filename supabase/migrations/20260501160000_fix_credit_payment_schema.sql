-- =====================================================
-- MIGRATION: Corrections bugs crédits et paiements
-- Date: 2026-05-01
-- =====================================================

-- -----------------------------------------------------
-- 1. RECREATION TABLE credit_packages (si manquante)
--    La table avait été DROP dans migration 20260224165413
--    mais est encore référencée par l'application.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  credits_amount INTEGER NOT NULL DEFAULT 0,
  price_euros DECIMAL(10,2) NOT NULL,
  bonus_credits INTEGER DEFAULT 0,
  is_promotional BOOLEAN DEFAULT false,
  promotion_label TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_credit_packages_active ON credit_packages(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_credit_packages_sort ON credit_packages(sort_order);

-- RLS
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active packages" ON credit_packages;
CREATE POLICY "Anyone can view active packages"
  ON credit_packages FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage packages" ON credit_packages;
CREATE POLICY "Admins can manage packages"
  ON credit_packages FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'super_admin')));

-- Données par défaut
INSERT INTO credit_packages (name, credits_amount, price_euros, bonus_credits, is_active, sort_order)
VALUES
  ('Pack Découverte', 5, 25.00, 0, true, 1),
  ('Pack Standard', 10, 45.00, 2, true, 2),
  ('Pack Pro', 25, 100.00, 5, true, 3)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE credit_packages IS 'Packages de crédits disponibles à l achat';

-- -----------------------------------------------------
-- 2. CORRECTION CHECK CONSTRAINT credit_transactions.type
--    Ajout de 'usage' manquant (utilisé par match-payment-with-credits.ts)
-- -----------------------------------------------------
DO $$
BEGIN
  -- Supprimer l'ancien constraint s'il existe
  ALTER TABLE credit_transactions DROP CONSTRAINT IF EXISTS credit_transactions_type_check;
  
  -- Recréer avec 'usage' inclus
  ALTER TABLE credit_transactions ADD CONSTRAINT credit_transactions_type_check
    CHECK (type IN ('purchase', 'spend', 'refund', 'bonus', 'penalty', 'usage'));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not alter credit_transactions constraint: %', SQLERRM;
END $$;

-- -----------------------------------------------------
-- 3. CORRECTION ENUM credit_transaction_type (si utilisé)
--    Ajout de 'usage' dans l'ENUM PostgreSQL
-- -----------------------------------------------------
DO $$
BEGIN
  -- Vérifier si l'ENUM existe
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'credit_transaction_type') THEN
    -- Supprimer les valeurs existantes de la colonne qui ne sont pas dans l'ENUM
    -- (aucune normalement si le système est nouveau)
    -- Puis ajouter 'usage' à l'ENUM
    ALTER TYPE credit_transaction_type ADD VALUE IF NOT EXISTS 'usage';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not alter credit_transaction_type enum: %', SQLERRM;
END $$;

-- -----------------------------------------------------
-- 4. CORRECTION colonnes match_payments
--    Uniformiser amount_cents / amount_euros
-- -----------------------------------------------------
DO $$
BEGIN
  -- Ajouter amount_cents si manquant
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'match_payments' AND column_name = 'amount_cents'
  ) THEN
    ALTER TABLE match_payments ADD COLUMN amount_cents INTEGER;
  END IF;

  -- Ajouter amount_euros si manquant
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'match_payments' AND column_name = 'amount_euros'
  ) THEN
    ALTER TABLE match_payments ADD COLUMN amount_euros DECIMAL(10,2);
  END IF;

  -- Ajouter credits_used si manquant
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'match_payments' AND column_name = 'credits_used'
  ) THEN
    ALTER TABLE match_payments ADD COLUMN credits_used INTEGER;
  END IF;

  -- Ajouter stripe_session_id si manquant
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'match_payments' AND column_name = 'stripe_session_id'
  ) THEN
    ALTER TABLE match_payments ADD COLUMN stripe_session_id TEXT;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not alter match_payments columns: %', SQLERRM;
END $$;

-- -----------------------------------------------------
-- 5. AJOUT colonne pricing_tier_id sur match_payments (optionnel)
--    Pour tracking stats par palier tarifaire
-- -----------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'match_payments' AND column_name = 'pricing_tier_id'
  ) THEN
    ALTER TABLE match_payments ADD COLUMN pricing_tier_id UUID REFERENCES match_pricing_tiers(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not add pricing_tier_id: %', SQLERRM;
END $$;

-- -----------------------------------------------------
-- 6. TRIGGER pour mettre à jour updated_at sur credit_packages
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_credit_packages_updated_at ON credit_packages;
CREATE TRIGGER update_credit_packages_updated_at
  BEFORE UPDATE ON credit_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------
-- 7. VIEW: credit_purchase_summary pour dashboard admin
-- -----------------------------------------------------
CREATE OR REPLACE VIEW credit_purchase_summary AS
SELECT
  cp.id,
  cp.name,
  cp.credits_amount,
  cp.bonus_credits,
  (cp.credits_amount + COALESCE(cp.bonus_credits, 0)) AS total_credits,
  cp.price_euros,
  COUNT(ct.id) AS purchase_count,
  COALESCE(SUM(CASE WHEN ct.type = 'purchase' THEN ct.amount ELSE 0 END), 0) AS credits_sold
FROM credit_packages cp
LEFT JOIN credit_transactions ct ON ct.reference_id = cp.id AND ct.type = 'purchase'
GROUP BY cp.id, cp.name, cp.credits_amount, cp.bonus_credits, cp.price_euros
ORDER BY cp.sort_order;

-- -----------------------------------------------------
-- 8. AJOUT colonne stripe_payment_intent_id sur credit_transactions
-- -----------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'credit_transactions' AND column_name = 'stripe_payment_intent_id'
  ) THEN
    ALTER TABLE credit_transactions ADD COLUMN stripe_payment_intent_id TEXT;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not add stripe_payment_intent_id to credit_transactions: %', SQLERRM;
END $$;

CREATE INDEX IF NOT EXISTS idx_credit_transactions_stripe ON credit_transactions(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

-- -----------------------------------------------------
-- 9. AJOUT setting pour activer/désactiver le paiement matching (offre lancement)
-- -----------------------------------------------------
INSERT INTO app_settings (setting_key, setting_value, description, category, is_editable)
VALUES ('match_payment_enabled', '{"value": true}', 'Active/désactive le paiement pour les matchings (true=paiement requis, false=gratuit)', 'pricing', true)
ON CONFLICT (setting_key) DO NOTHING;

-- =====================================================
-- FIN MIGRATION
-- =====================================================
