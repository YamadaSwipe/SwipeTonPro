-- =====================================================
-- MIGRATION: Système de Packs de Crédits Professionnels
-- Date: 20 juin 2026
-- Description: Création de la table credit_packs et amélioration du système de crédits
-- =====================================================

-- -----------------------------------------------------
-- 1. TABLE: credit_packs
--    Définit les packs de crédits disponibles à l'achat
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS credit_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  credits_amount INTEGER NOT NULL CHECK (credits_amount > 0),
  bonus_credits INTEGER DEFAULT 0 CHECK (bonus_credits >= 0),
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  price_euros DECIMAL(10,2) GENERATED ALWAYS AS (price_cents / 100.0) STORED,
  stripe_price_id TEXT, -- ID du prix Stripe pour ce pack
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_credit_packs_active ON credit_packs(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_credit_packs_featured ON credit_packs(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_credit_packs_order ON credit_packs(display_order);

-- Commentaires
COMMENT ON TABLE credit_packs IS 'Packs de crédits disponibles à l''achat pour les professionnels';
COMMENT ON COLUMN credit_packs.credits_amount IS 'Nombre de crédits de base dans le pack';
COMMENT ON COLUMN credit_packs.bonus_credits IS 'Crédits bonus offerts avec ce pack';
COMMENT ON COLUMN credit_packs.price_cents IS 'Prix en centimes d''euro';
COMMENT ON COLUMN credit_packs.stripe_price_id IS 'ID du prix Stripe associé à ce pack';
COMMENT ON COLUMN credit_packs.is_featured IS 'Pack mis en avant (meilleure offre)';

-- -----------------------------------------------------
-- 2. INSERTION des packs par défaut
-- -----------------------------------------------------
INSERT INTO credit_packs (name, description, credits_amount, bonus_credits, price_cents, is_featured, display_order) VALUES
  ('Pack Starter', 'Idéal pour débuter', 10, 0, 4900, false, 1),
  ('Pack Standard', 'Le plus populaire', 25, 5, 9900, true, 2),
  ('Pack Pro', 'Pour les professionnels actifs', 50, 15, 17900, false, 3),
  ('Pack Premium', 'Maximum de crédits', 100, 35, 29900, false, 4)
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------
-- 3. TABLE: credit_pack_purchases
--    Historique des achats de packs de crédits
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS credit_pack_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  credit_pack_id UUID REFERENCES credit_packs(id) ON DELETE SET NULL,
  credits_purchased INTEGER NOT NULL,
  bonus_credits INTEGER DEFAULT 0,
  total_credits INTEGER GENERATED ALWAYS AS (credits_purchased + bonus_credits) STORED,
  price_paid_cents INTEGER NOT NULL,
  price_paid_euros DECIMAL(10,2) GENERATED ALWAYS AS (price_paid_cents / 100.0) STORED,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_credit_pack_purchases_professional ON credit_pack_purchases(professional_id);
CREATE INDEX IF NOT EXISTS idx_credit_pack_purchases_status ON credit_pack_purchases(status);
CREATE INDEX IF NOT EXISTS idx_credit_pack_purchases_stripe_session ON credit_pack_purchases(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_credit_pack_purchases_stripe_intent ON credit_pack_purchases(stripe_payment_intent_id);

-- Commentaires
COMMENT ON TABLE credit_pack_purchases IS 'Historique des achats de packs de crédits par les professionnels';
COMMENT ON COLUMN credit_pack_purchases.total_credits IS 'Total des crédits (base + bonus)';

-- -----------------------------------------------------
-- 4. FONCTION: Créditer automatiquement après achat de pack
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION credit_pack_purchase_completed()
RETURNS TRIGGER AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Si le statut passe à 'completed', créditer le compte
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Utiliser la fonction add_credits pour ajouter les crédits de manière atomique
    PERFORM add_credits(
      p_professional_id := NEW.professional_id,
      p_amount := NEW.total_credits,
      p_type := 'purchase',
      p_description := format('Achat pack: %s crédits + %s bonus', NEW.credits_purchased, NEW.bonus_credits),
      p_stripe_payment_intent_id := NEW.stripe_payment_intent_id
    );
    
    -- Mettre à jour la date de complétion
    NEW.completed_at := NOW();
    
    RAISE NOTICE 'Pack de crédits crédité: % crédits pour professional_id=%', NEW.total_credits, NEW.professional_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_credit_pack_purchase_completed ON credit_pack_purchases;
CREATE TRIGGER trigger_credit_pack_purchase_completed
  BEFORE INSERT OR UPDATE ON credit_pack_purchases
  FOR EACH ROW
  EXECUTE FUNCTION credit_pack_purchase_completed();

COMMENT ON FUNCTION credit_pack_purchase_completed IS 'Crédite automatiquement le compte professionnel après achat de pack';

-- -----------------------------------------------------
-- 5. FONCTION ADMIN: Offrir des crédits manuellement
--    Utilisable uniquement par les admins/modérateurs
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION admin_grant_credits(
  p_professional_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_admin_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_role TEXT;
  v_result JSONB;
BEGIN
  -- Vérifier que l'utilisateur est admin ou moderator
  SELECT role INTO v_admin_role
  FROM profiles
  WHERE id = p_admin_user_id;
  
  IF v_admin_role NOT IN ('admin', 'super_admin', 'moderator') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: Only admins and moderators can grant credits',
      'error_code', 'UNAUTHORIZED'
    );
  END IF;
  
  -- Vérifier que le montant est positif
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Amount must be positive',
      'error_code', 'INVALID_AMOUNT'
    );
  END IF;
  
  -- Ajouter les crédits via la fonction atomique
  SELECT add_credits(
    p_professional_id := p_professional_id,
    p_amount := p_amount,
    p_type := 'bonus',
    p_description := format('Offre admin: %s', p_reason),
    p_stripe_payment_intent_id := NULL
  ) INTO v_result;
  
  -- Si succès, logger l'action admin
  IF (v_result->>'success')::boolean THEN
    INSERT INTO admin_actions (
      admin_id,
      action_type,
      target_type,
      target_id,
      details
    ) VALUES (
      p_admin_user_id,
      'grant_credits',
      'professional',
      p_professional_id,
      jsonb_build_object(
        'credits_granted', p_amount,
        'reason', p_reason,
        'new_balance', v_result->'new_balance'
      )
    );
    
    -- Créer une notification pour le professionnel
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      data
    )
    SELECT 
      user_id,
      'credits_granted',
      '🎁 Crédits offerts !',
      format('%s crédits ont été ajoutés à votre compte. Raison: %s', p_amount, p_reason),
      jsonb_build_object(
        'credits_amount', p_amount,
        'reason', p_reason,
        'new_balance', v_result->'new_balance'
      )
    FROM professionals
    WHERE id = p_professional_id;
  END IF;
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Database error',
      'error_code', 'DATABASE_ERROR',
      'error_message', SQLERRM
    );
END;
$$;

COMMENT ON FUNCTION admin_grant_credits IS 'Permet aux admins/modérateurs d''offrir des crédits manuellement à un professionnel';

-- -----------------------------------------------------
-- 6. FONCTION: Récupérer les packs actifs
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_active_credit_packs()
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  credits_amount INTEGER,
  bonus_credits INTEGER,
  total_credits INTEGER,
  price_euros DECIMAL,
  is_featured BOOLEAN,
  price_per_credit DECIMAL
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.id,
    cp.name,
    cp.description,
    cp.credits_amount,
    cp.bonus_credits,
    (cp.credits_amount + cp.bonus_credits) AS total_credits,
    cp.price_euros,
    cp.is_featured,
    ROUND(cp.price_euros / (cp.credits_amount + cp.bonus_credits), 2) AS price_per_credit
  FROM credit_packs cp
  WHERE cp.is_active = true
  ORDER BY cp.display_order ASC, cp.price_cents ASC;
END;
$$;

COMMENT ON FUNCTION get_active_credit_packs IS 'Récupère tous les packs de crédits actifs avec calcul du prix par crédit';

-- -----------------------------------------------------
-- 7. VUE: Statistiques des achats de packs
-- -----------------------------------------------------
CREATE OR REPLACE VIEW credit_pack_purchase_stats AS
SELECT 
  DATE_TRUNC('day', cpp.created_at) AS date,
  COUNT(*) AS total_purchases,
  COUNT(*) FILTER (WHERE cpp.status = 'completed') AS completed_purchases,
  COUNT(*) FILTER (WHERE cpp.status = 'pending') AS pending_purchases,
  COUNT(*) FILTER (WHERE cpp.status = 'failed') AS failed_purchases,
  SUM(cpp.total_credits) FILTER (WHERE cpp.status = 'completed') AS total_credits_sold,
  SUM(cpp.price_paid_euros) FILTER (WHERE cpp.status = 'completed') AS total_revenue,
  COUNT(DISTINCT cpp.professional_id) AS unique_buyers,
  AVG(cpp.price_paid_euros) FILTER (WHERE cpp.status = 'completed') AS avg_purchase_amount
FROM credit_pack_purchases cpp
GROUP BY DATE_TRUNC('day', cpp.created_at)
ORDER BY date DESC;

COMMENT ON VIEW credit_pack_purchase_stats IS 'Statistiques quotidiennes des achats de packs de crédits';

-- -----------------------------------------------------
-- 8. POLITIQUE RLS pour credit_packs (lecture publique pour pros)
-- -----------------------------------------------------
ALTER TABLE credit_packs ENABLE ROW LEVEL SECURITY;

-- Les professionnels peuvent voir les packs actifs
CREATE POLICY "Professionals can view active credit packs"
  ON credit_packs FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Les admins peuvent tout voir et modifier
CREATE POLICY "Admins can manage credit packs"
  ON credit_packs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- -----------------------------------------------------
-- 9. POLITIQUE RLS pour credit_pack_purchases
-- -----------------------------------------------------
ALTER TABLE credit_pack_purchases ENABLE ROW LEVEL SECURITY;

-- Les professionnels peuvent voir leurs propres achats
CREATE POLICY "Professionals can view own purchases"
  ON credit_pack_purchases FOR SELECT
  TO authenticated
  USING (
    professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  );

-- Les admins peuvent tout voir
CREATE POLICY "Admins can view all purchases"
  ON credit_pack_purchases FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'moderator')
    )
  );

-- -----------------------------------------------------
-- 10. MISE À JOUR de la fonction add_credits existante
--     pour supporter les références aux packs
-- -----------------------------------------------------
DROP FUNCTION IF EXISTS add_credits(UUID, INTEGER, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION add_credits(
  p_professional_id UUID,
  p_amount INTEGER,
  p_type TEXT, -- 'purchase', 'bonus', 'refund'
  p_description TEXT,
  p_stripe_payment_intent_id TEXT DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Valider le type
  IF p_type NOT IN ('purchase', 'bonus', 'refund') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid transaction type',
      'error_code', 'INVALID_TYPE'
    );
  END IF;
  
  -- Lock la ligne du professionnel
  SELECT credits_balance INTO v_current_balance
  FROM professionals
  WHERE id = p_professional_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Professional not found',
      'error_code', 'PROFESSIONAL_NOT_FOUND'
    );
  END IF;
  
  -- Calculer le nouveau solde
  v_new_balance := v_current_balance + p_amount;
  
  -- Mettre à jour le solde
  UPDATE professionals
  SET 
    credits_balance = v_new_balance,
    updated_at = NOW()
  WHERE id = p_professional_id;
  
  -- Créer la transaction
  INSERT INTO credit_transactions (
    professional_id,
    type,
    amount,
    balance_after,
    description,
    stripe_payment_intent_id,
    reference_type,
    reference_id,
    created_at
  ) VALUES (
    p_professional_id,
    p_type,
    p_amount,
    v_new_balance,
    p_description,
    p_stripe_payment_intent_id,
    p_reference_type,
    p_reference_id,
    NOW()
  )
  RETURNING id INTO v_transaction_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'previous_balance', v_current_balance,
    'new_balance', v_new_balance,
    'added', p_amount,
    'transaction_id', v_transaction_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Database error',
      'error_code', 'DATABASE_ERROR',
      'error_message', SQLERRM
    );
END;
$$;

-- -----------------------------------------------------
-- 11. VÉRIFIER que credit_transactions a les bonnes colonnes
-- -----------------------------------------------------
DO $$
BEGIN
  -- Ajouter reference_type si manquant
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'credit_transactions' AND column_name = 'reference_type'
  ) THEN
    ALTER TABLE credit_transactions ADD COLUMN reference_type TEXT;
    COMMENT ON COLUMN credit_transactions.reference_type IS 'Type de référence (credit_pack, contact_unlock, etc.)';
  END IF;
  
  -- Ajouter reference_id si manquant
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'credit_transactions' AND column_name = 'reference_id'
  ) THEN
    ALTER TABLE credit_transactions ADD COLUMN reference_id UUID;
    COMMENT ON COLUMN credit_transactions.reference_id IS 'ID de la référence associée';
  END IF;
END $$;

-- =====================================================
-- FIN MIGRATION
-- =====================================================

-- Résumé de ce qui a été créé:
-- ✅ Table credit_packs avec 4 packs par défaut
-- ✅ Table credit_pack_purchases pour l'historique
-- ✅ Trigger automatique pour créditer après achat
-- ✅ Fonction admin_grant_credits pour offrir des crédits
-- ✅ Fonction get_active_credit_packs pour récupérer les packs
-- ✅ Vue credit_pack_purchase_stats pour les statistiques
-- ✅ Politiques RLS pour sécuriser l'accès
-- ✅ Mise à jour de add_credits pour supporter les références
