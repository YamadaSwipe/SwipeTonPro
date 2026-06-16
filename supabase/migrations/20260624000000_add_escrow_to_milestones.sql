-- =====================================================
-- SYSTÈME DE SÉQUESTRE (ESCROW) POUR LES JALONS
-- =====================================================
-- Description: Ajoute la gestion du paiement séquestré aux jalons de projet
-- Date: 2026-06-24
-- Version: 1.0.0
-- =====================================================

-- =====================================================
-- 1. AJOUTER LES CHAMPS DE SÉQUESTRE À LA TABLE PROJECTS
-- =====================================================

-- Ajouter le champ pour activer le séquestre sur un projet
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS escrow_enabled BOOLEAN DEFAULT false;

-- Ajouter le montant total séquestré
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS escrow_total_amount DECIMAL(10, 2) DEFAULT 0;

-- Ajouter l'ID du PaymentIntent Stripe pour le séquestre
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS escrow_stripe_payment_intent_id TEXT;

-- Ajouter le statut du séquestre
DO $$ BEGIN
  CREATE TYPE escrow_status AS ENUM (
    'pending',      -- En attente de paiement
    'held',         -- Fonds séquestrés
    'releasing',    -- En cours de déblocage
    'completed',    -- Tous les fonds débloqués
    'refunded'      -- Remboursé
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS escrow_status escrow_status DEFAULT 'pending';

-- =====================================================
-- 2. AJOUTER LES CHAMPS DE PAIEMENT AUX JALONS
-- =====================================================

-- Montant à débloquer pour ce jalon (en centimes)
ALTER TABLE project_milestones 
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10, 2) DEFAULT 0;

-- Pourcentage du montant total du projet
ALTER TABLE project_milestones 
ADD COLUMN IF NOT EXISTS payment_percentage DECIMAL(5, 2) DEFAULT 0;

-- Statut du paiement pour ce jalon
DO $$ BEGIN
  CREATE TYPE milestone_payment_status AS ENUM (
    'pending',           -- En attente de validation
    'ready_to_release',  -- Validé, prêt à débloquer
    'releasing',         -- En cours de déblocage
    'released',          -- Fonds débloqués
    'failed'             -- Échec du déblocage
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE project_milestones 
ADD COLUMN IF NOT EXISTS payment_status milestone_payment_status DEFAULT 'pending';

-- ID du transfert Stripe
ALTER TABLE project_milestones 
ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT;

-- Date de déblocage des fonds
ALTER TABLE project_milestones 
ADD COLUMN IF NOT EXISTS funds_released_at TIMESTAMP WITH TIME ZONE;

-- Métadonnées du paiement
ALTER TABLE project_milestones 
ADD COLUMN IF NOT EXISTS payment_metadata JSONB DEFAULT '{}';

-- =====================================================
-- 3. TABLE DES TRANSACTIONS DE SÉQUESTRE
-- =====================================================

CREATE TABLE IF NOT EXISTS escrow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Références
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES project_milestones(id) ON DELETE SET NULL,
  
  -- Type de transaction
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'deposit',      -- Dépôt initial
    'release',      -- Déblocage vers artisan
    'refund',       -- Remboursement au client
    'adjustment'    -- Ajustement
  )),
  
  -- Montant (en centimes)
  amount DECIMAL(10, 2) NOT NULL,
  
  -- Informations Stripe
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,
  stripe_refund_id TEXT,
  
  -- Statut
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'processing',
    'completed',
    'failed',
    'canceled'
  )),
  
  -- Détails
  description TEXT,
  error_message TEXT,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Index
  CONSTRAINT valid_amount CHECK (amount >= 0)
);

-- =====================================================
-- 4. INDEX POUR OPTIMISATION
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_projects_escrow_enabled 
  ON projects(escrow_enabled) WHERE escrow_enabled = true;

CREATE INDEX IF NOT EXISTS idx_projects_escrow_status 
  ON projects(escrow_status);

CREATE INDEX IF NOT EXISTS idx_milestones_payment_status 
  ON project_milestones(payment_status);

CREATE INDEX IF NOT EXISTS idx_escrow_transactions_project 
  ON escrow_transactions(project_id);

CREATE INDEX IF NOT EXISTS idx_escrow_transactions_milestone 
  ON escrow_transactions(milestone_id);

CREATE INDEX IF NOT EXISTS idx_escrow_transactions_status 
  ON escrow_transactions(status);

-- =====================================================
-- 5. FONCTION POUR INITIALISER LE SÉQUESTRE
-- =====================================================

CREATE OR REPLACE FUNCTION initialize_project_escrow(
  p_project_id UUID,
  p_total_amount DECIMAL,
  p_stripe_payment_intent_id TEXT
)
RETURNS JSON AS $$
BEGIN
  -- Mettre à jour le projet
  UPDATE projects
  SET 
    escrow_enabled = true,
    escrow_total_amount = p_total_amount,
    escrow_stripe_payment_intent_id = p_stripe_payment_intent_id,
    escrow_status = 'held',
    updated_at = NOW()
  WHERE id = p_project_id;
  
  -- Créer la transaction de dépôt
  INSERT INTO escrow_transactions (
    project_id,
    transaction_type,
    amount,
    stripe_payment_intent_id,
    status,
    description,
    completed_at
  ) VALUES (
    p_project_id,
    'deposit',
    p_total_amount,
    p_stripe_payment_intent_id,
    'completed',
    'Dépôt initial du séquestre',
    NOW()
  );
  
  RETURN json_build_object(
    'success', true,
    'project_id', p_project_id,
    'amount', p_total_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. FONCTION POUR DÉBLOQUER LES FONDS D'UN JALON
-- =====================================================

CREATE OR REPLACE FUNCTION release_milestone_funds(
  p_milestone_id UUID,
  p_released_by UUID,
  p_stripe_transfer_id TEXT
)
RETURNS JSON AS $$
DECLARE
  v_project_id UUID;
  v_milestone_amount DECIMAL;
  v_client_id UUID;
  v_professional_id UUID;
  v_is_client BOOLEAN := FALSE;
  v_escrow_enabled BOOLEAN;
  v_validation_status milestone_validation_status;
BEGIN
  -- Récupérer les informations du jalon et du projet
  SELECT 
    pm.project_id,
    pm.payment_amount,
    pm.validation_status,
    p.client_id,
    p.escrow_enabled,
    (SELECT professional_id FROM project_interests 
     WHERE project_id = pm.project_id AND status = 'accepted' 
     LIMIT 1)
  INTO 
    v_project_id,
    v_milestone_amount,
    v_validation_status,
    v_client_id,
    v_escrow_enabled,
    v_professional_id
  FROM project_milestones pm
  JOIN projects p ON pm.project_id = p.id
  WHERE pm.id = p_milestone_id;
  
  -- Vérifications
  IF v_project_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Jalon non trouvé'
    );
  END IF;
  
  IF NOT v_escrow_enabled THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Le séquestre n''est pas activé pour ce projet'
    );
  END IF;
  
  IF v_validation_status != 'validated' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Le jalon doit être validé avant de débloquer les fonds'
    );
  END IF;
  
  -- Vérifier que c'est bien le client qui débloque
  IF p_released_by = v_client_id THEN
    v_is_client := TRUE;
  END IF;
  
  IF NOT v_is_client THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Seul le client peut débloquer les fonds'
    );
  END IF;
  
  -- Mettre à jour le statut du jalon
  UPDATE project_milestones
  SET 
    payment_status = 'released',
    stripe_transfer_id = p_stripe_transfer_id,
    funds_released_at = NOW(),
    updated_at = NOW()
  WHERE id = p_milestone_id;
  
  -- Créer la transaction de déblocage
  INSERT INTO escrow_transactions (
    project_id,
    milestone_id,
    transaction_type,
    amount,
    stripe_transfer_id,
    status,
    description,
    completed_at
  ) VALUES (
    v_project_id,
    p_milestone_id,
    'release',
    v_milestone_amount,
    p_stripe_transfer_id,
    'completed',
    'Déblocage des fonds pour jalon validé',
    NOW()
  );
  
  -- Vérifier si tous les jalons sont débloqués
  PERFORM 1 FROM project_milestones
  WHERE project_id = v_project_id
    AND payment_amount > 0
    AND payment_status != 'released';
  
  IF NOT FOUND THEN
    -- Tous les jalons sont débloqués, marquer le projet comme terminé
    UPDATE projects
    SET escrow_status = 'completed'
    WHERE id = v_project_id;
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'milestone_id', p_milestone_id,
    'amount_released', v_milestone_amount,
    'transfer_id', p_stripe_transfer_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. FONCTION POUR CALCULER LA RÉPARTITION DES PAIEMENTS
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_milestone_payments(
  p_project_id UUID,
  p_total_amount DECIMAL
)
RETURNS JSON AS $$
DECLARE
  v_milestone RECORD;
  v_milestones_count INTEGER;
  v_amount_per_milestone DECIMAL;
BEGIN
  -- Compter les jalons de paiement (excluant quote_rejected)
  SELECT COUNT(*) INTO v_milestones_count
  FROM project_milestones
  WHERE project_id = p_project_id
    AND milestone_type NOT IN ('quote_rejected');
  
  IF v_milestones_count = 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Aucun jalon trouvé pour ce projet'
    );
  END IF;
  
  -- Répartition par défaut selon le type de jalon
  FOR v_milestone IN 
    SELECT id, milestone_type
    FROM project_milestones
    WHERE project_id = p_project_id
      AND milestone_type NOT IN ('quote_rejected')
    ORDER BY created_at
  LOOP
    -- Définir le pourcentage selon le type
    CASE v_milestone.milestone_type
      WHEN 'quote_accepted' THEN
        v_amount_per_milestone := p_total_amount * 0.10; -- 10%
      WHEN 'work_started' THEN
        v_amount_per_milestone := p_total_amount * 0.20; -- 20%
      WHEN 'progress_30' THEN
        v_amount_per_milestone := p_total_amount * 0.30; -- 30%
      WHEN 'progress_60' THEN
        v_amount_per_milestone := p_total_amount * 0.30; -- 30%
      WHEN 'work_completed' THEN
        v_amount_per_milestone := p_total_amount * 0.10; -- 10%
      ELSE
        v_amount_per_milestone := p_total_amount / v_milestones_count;
    END CASE;
    
    -- Mettre à jour le jalon
    UPDATE project_milestones
    SET 
      payment_amount = v_amount_per_milestone,
      payment_percentage = (v_amount_per_milestone / p_total_amount) * 100,
      payment_status = 'pending'
    WHERE id = v_milestone.id;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'total_amount', p_total_amount,
    'milestones_count', v_milestones_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. TRIGGER POUR METTRE À JOUR LE STATUT DE PAIEMENT
-- =====================================================

CREATE OR REPLACE FUNCTION update_milestone_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Quand un jalon est validé, le marquer comme prêt à débloquer
  IF NEW.validation_status = 'validated' AND OLD.validation_status != 'validated' THEN
    -- Vérifier si le projet a le séquestre activé
    IF EXISTS (
      SELECT 1 FROM projects 
      WHERE id = NEW.project_id 
        AND escrow_enabled = true
    ) THEN
      NEW.payment_status := 'ready_to_release';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_milestone_payment_status
  BEFORE UPDATE ON project_milestones
  FOR EACH ROW
  WHEN (NEW.validation_status IS DISTINCT FROM OLD.validation_status)
  EXECUTE FUNCTION update_milestone_payment_status();

-- =====================================================
-- 9. POLITIQUES RLS POUR LES TRANSACTIONS
-- =====================================================

ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;

-- Les clients peuvent voir les transactions de leurs projets
CREATE POLICY "Clients can view escrow transactions of their projects"
  ON escrow_transactions
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE client_id = auth.uid()
    )
  );

-- Les professionnels peuvent voir les transactions des projets où ils sont matchés
CREATE POLICY "Professionals can view escrow transactions of matched projects"
  ON escrow_transactions
  FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_interests 
      WHERE professional_id IN (
        SELECT id FROM professionals WHERE user_id = auth.uid()
      ) AND status = 'accepted'
    )
  );

-- Les admins peuvent tout voir
CREATE POLICY "Admins can view all escrow transactions"
  ON escrow_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- =====================================================
-- 10. COMMENTAIRES
-- =====================================================

COMMENT ON COLUMN projects.escrow_enabled IS 
  'Indique si le paiement séquestré est activé pour ce projet';

COMMENT ON COLUMN projects.escrow_total_amount IS 
  'Montant total séquestré pour ce projet';

COMMENT ON COLUMN projects.escrow_status IS 
  'Statut du séquestre: pending, held, releasing, completed, refunded';

COMMENT ON COLUMN project_milestones.payment_amount IS 
  'Montant à débloquer pour ce jalon';

COMMENT ON COLUMN project_milestones.payment_status IS 
  'Statut du paiement: pending, ready_to_release, releasing, released, failed';

COMMENT ON TABLE escrow_transactions IS 
  'Historique de toutes les transactions de séquestre';

COMMENT ON FUNCTION initialize_project_escrow IS 
  'Initialise le système de séquestre pour un projet';

COMMENT ON FUNCTION release_milestone_funds IS 
  'Débloque les fonds d''un jalon validé vers l''artisan';

COMMENT ON FUNCTION calculate_milestone_payments IS 
  'Calcule la répartition des paiements entre les jalons';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================
