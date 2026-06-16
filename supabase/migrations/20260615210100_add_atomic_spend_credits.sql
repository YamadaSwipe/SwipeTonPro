-- =====================================================
-- MIGRATION: Fonction atomique pour dépense de crédits
-- Date: 15 juin 2026
-- Description: Empêche les race conditions sur le solde de crédits
-- =====================================================

-- Fonction atomique pour dépenser des crédits
CREATE OR REPLACE FUNCTION spend_credits(
  p_professional_id UUID,
  p_amount INTEGER,
  p_description TEXT,
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
  -- Lock la ligne du professionnel pour éviter race condition
  SELECT credits_balance INTO v_current_balance
  FROM professionals
  WHERE id = p_professional_id
  FOR UPDATE;
  
  -- Vérifier si le professionnel existe
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Professional not found',
      'error_code', 'PROFESSIONAL_NOT_FOUND'
    );
  END IF;
  
  -- Vérifier si le solde est suffisant
  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient credits',
      'error_code', 'INSUFFICIENT_CREDITS',
      'current_balance', v_current_balance,
      'required', p_amount,
      'shortfall', p_amount - v_current_balance
    );
  END IF;
  
  -- Calculer le nouveau solde
  v_new_balance := v_current_balance - p_amount;
  
  -- Mettre à jour le solde (transaction atomique)
  UPDATE professionals
  SET 
    credits_balance = v_new_balance,
    updated_at = NOW()
  WHERE id = p_professional_id;
  
  -- Créer la transaction de crédit
  INSERT INTO credit_transactions (
    professional_id,
    type,
    amount,
    balance_after,
    description,
    reference_type,
    reference_id,
    created_at
  ) VALUES (
    p_professional_id,
    'usage',
    -p_amount,
    v_new_balance,
    p_description,
    p_reference_type,
    p_reference_id,
    NOW()
  )
  RETURNING id INTO v_transaction_id;
  
  -- Retourner le succès avec les détails
  RETURN jsonb_build_object(
    'success', true,
    'previous_balance', v_current_balance,
    'new_balance', v_new_balance,
    'spent', p_amount,
    'transaction_id', v_transaction_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, rollback automatique et retour d'erreur
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Database error',
      'error_code', 'DATABASE_ERROR',
      'error_message', SQLERRM
    );
END;
$$;

-- Fonction pour ajouter des crédits (achat, bonus, etc.)
CREATE OR REPLACE FUNCTION add_credits(
  p_professional_id UUID,
  p_amount INTEGER,
  p_type TEXT, -- 'purchase', 'bonus', 'refund'
  p_description TEXT,
  p_stripe_payment_intent_id TEXT DEFAULT NULL
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
    created_at
  ) VALUES (
    p_professional_id,
    p_type,
    p_amount,
    v_new_balance,
    p_description,
    p_stripe_payment_intent_id,
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

-- Commentaires
COMMENT ON FUNCTION spend_credits IS 'Fonction atomique pour dépenser des crédits avec protection contre les race conditions';
COMMENT ON FUNCTION add_credits IS 'Fonction atomique pour ajouter des crédits (achat, bonus, remboursement)';
