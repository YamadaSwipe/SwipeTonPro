-- =====================================================
-- MIGRATION: Amélioration du système de paiement de matching
-- Date: 2026-06-19
-- Description: Ajoute le champ is_unlocked et améliore la logique de déblocage
-- =====================================================

-- -----------------------------------------------------
-- 1. AJOUT colonne is_unlocked sur project_interests
--    Pour suivre le statut de déblocage du contact
-- -----------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_interests' AND column_name = 'is_unlocked'
  ) THEN
    ALTER TABLE project_interests ADD COLUMN is_unlocked BOOLEAN DEFAULT false;
    COMMENT ON COLUMN project_interests.is_unlocked IS 'Indique si le contact a été débloqué par paiement';
  END IF;
END $$;

-- -----------------------------------------------------
-- 2. AJOUT colonne unlocked_at sur project_interests
--    Pour tracer la date de déblocage
-- -----------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_interests' AND column_name = 'unlocked_at'
  ) THEN
    ALTER TABLE project_interests ADD COLUMN unlocked_at TIMESTAMP WITH TIME ZONE;
    COMMENT ON COLUMN project_interests.unlocked_at IS 'Date et heure du déblocage du contact';
  END IF;
END $$;

-- -----------------------------------------------------
-- 3. AJOUT colonne payment_method sur match_payments
--    Pour distinguer paiement par carte vs crédits
-- -----------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'match_payments' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE match_payments ADD COLUMN payment_method TEXT CHECK (payment_method IN ('card', 'credits', 'free_promo'));
    COMMENT ON COLUMN match_payments.payment_method IS 'Méthode de paiement utilisée: card, credits, ou free_promo';
  END IF;
END $$;

-- -----------------------------------------------------
-- 4. AJOUT colonne match_payment_id sur conversations
--    Pour lier une conversation au paiement qui l'a débloquée
-- -----------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'match_payment_id'
  ) THEN
    ALTER TABLE conversations ADD COLUMN match_payment_id UUID REFERENCES match_payments(id) ON DELETE SET NULL;
    COMMENT ON COLUMN conversations.match_payment_id IS 'Référence au paiement de matching qui a débloqué cette conversation';
  END IF;
END $$;

-- -----------------------------------------------------
-- 5. INDEX pour performances
-- -----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_project_interests_unlocked 
  ON project_interests(is_unlocked) WHERE is_unlocked = true;

CREATE INDEX IF NOT EXISTS idx_match_payments_method 
  ON match_payments(payment_method) WHERE payment_method IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_match_payment 
  ON conversations(match_payment_id) WHERE match_payment_id IS NOT NULL;

-- -----------------------------------------------------
-- 6. FONCTION: unlock_contact_after_payment
--    Débloque automatiquement le contact après paiement réussi
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION unlock_contact_after_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le paiement passe à 'paid' ou 'completed', débloquer le contact
  IF NEW.status IN ('paid', 'completed') AND (OLD.status IS NULL OR OLD.status NOT IN ('paid', 'completed')) THEN
    
    -- Mettre à jour project_interests
    UPDATE project_interests
    SET 
      is_unlocked = true,
      unlocked_at = NOW(),
      status = 'matched'
    WHERE project_id = NEW.project_id
      AND professional_id = NEW.professional_id
      AND is_unlocked = false;
    
    -- Créer ou activer la conversation si elle n'existe pas
    INSERT INTO conversations (
      project_id,
      professional_id,
      client_id,
      status,
      match_payment_id
    )
    SELECT 
      NEW.project_id,
      NEW.professional_id,
      p.client_id,
      'active',
      NEW.id
    FROM projects p
    WHERE p.id = NEW.project_id
    ON CONFLICT (project_id, professional_id) 
    DO UPDATE SET 
      status = 'active',
      match_payment_id = NEW.id,
      updated_at = NOW();
    
    RAISE NOTICE 'Contact débloqué pour professional_id=% project_id=%', NEW.professional_id, NEW.project_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_unlock_contact_after_payment ON match_payments;
CREATE TRIGGER trigger_unlock_contact_after_payment
  AFTER INSERT OR UPDATE ON match_payments
  FOR EACH ROW
  EXECUTE FUNCTION unlock_contact_after_payment();

-- -----------------------------------------------------
-- 7. FONCTION: check_contact_unlocked
--    Vérifie si un contact est débloqué pour un professionnel
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION check_contact_unlocked(
  p_professional_id UUID,
  p_project_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_is_unlocked BOOLEAN;
BEGIN
  -- Vérifier dans project_interests
  SELECT is_unlocked INTO v_is_unlocked
  FROM project_interests
  WHERE professional_id = p_professional_id
    AND project_id = p_project_id
  LIMIT 1;
  
  -- Si pas trouvé dans project_interests, vérifier dans match_payments
  IF v_is_unlocked IS NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM match_payments
      WHERE professional_id = p_professional_id
        AND project_id = p_project_id
        AND status IN ('paid', 'completed')
    ) INTO v_is_unlocked;
  END IF;
  
  RETURN COALESCE(v_is_unlocked, false);
END;
$$;

-- -----------------------------------------------------
-- 8. FONCTION: get_unlocked_contacts
--    Récupère tous les contacts débloqués pour un professionnel
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_unlocked_contacts(p_professional_id UUID)
RETURNS TABLE (
  project_id UUID,
  project_title TEXT,
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  payment_method TEXT,
  amount_paid DECIMAL
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.client_first_name || ' ' || p.client_last_name AS client_name,
    p.client_email,
    p.client_phone,
    pi.unlocked_at,
    mp.payment_method,
    mp.amount_euros
  FROM project_interests pi
  JOIN projects p ON p.id = pi.project_id
  LEFT JOIN match_payments mp ON mp.project_id = pi.project_id 
    AND mp.professional_id = pi.professional_id
  WHERE pi.professional_id = p_professional_id
    AND pi.is_unlocked = true
  ORDER BY pi.unlocked_at DESC;
END;
$$;

-- -----------------------------------------------------
-- 9. MISE À JOUR des données existantes
--    Marquer comme débloqués les matchs déjà payés
-- -----------------------------------------------------
DO $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  -- Débloquer les project_interests qui ont un paiement réussi
  UPDATE project_interests pi
  SET 
    is_unlocked = true,
    unlocked_at = mp.paid_at,
    status = 'matched'
  FROM match_payments mp
  WHERE mp.project_id = pi.project_id
    AND mp.professional_id = pi.professional_id
    AND mp.status IN ('paid', 'completed')
    AND pi.is_unlocked = false;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RAISE NOTICE '✅ % contacts existants ont été marqués comme débloqués', v_updated_count;
END $$;

-- -----------------------------------------------------
-- 10. POLITIQUE RLS pour protéger les données sensibles
--     Les coordonnées ne sont visibles que si is_unlocked = true
-- -----------------------------------------------------

-- Fonction helper pour vérifier si l'utilisateur peut voir les coordonnées
CREATE OR REPLACE FUNCTION can_view_client_contact(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_professional_id UUID;
  v_is_unlocked BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  
  -- Si c'est le client du projet, il peut toujours voir
  IF EXISTS (
    SELECT 1 FROM projects 
    WHERE id = p_project_id AND client_id = v_user_id
  ) THEN
    RETURN true;
  END IF;
  
  -- Si c'est un admin, il peut voir
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = v_user_id AND role IN ('admin', 'super_admin')
  ) THEN
    RETURN true;
  END IF;
  
  -- Si c'est un professionnel, vérifier s'il a débloqué
  SELECT id INTO v_professional_id
  FROM professionals
  WHERE user_id = v_user_id;
  
  IF v_professional_id IS NOT NULL THEN
    RETURN check_contact_unlocked(v_professional_id, p_project_id);
  END IF;
  
  RETURN false;
END;
$$;

-- -----------------------------------------------------
-- 11. VIEW: masked_projects
--     Vue qui masque les coordonnées si non débloquées
-- -----------------------------------------------------
CREATE OR REPLACE VIEW masked_projects AS
SELECT 
  p.*,
  CASE 
    WHEN can_view_client_contact(p.id) THEN p.client_email
    ELSE '***@***.**'
  END AS visible_client_email,
  CASE 
    WHEN can_view_client_contact(p.id) THEN p.client_phone
    ELSE '** ** ** ** **'
  END AS visible_client_phone,
  CASE 
    WHEN can_view_client_contact(p.id) THEN p.client_first_name
    ELSE 'Client'
  END AS visible_client_first_name,
  CASE 
    WHEN can_view_client_contact(p.id) THEN p.client_last_name
    ELSE '***'
  END AS visible_client_last_name,
  can_view_client_contact(p.id) AS contact_unlocked
FROM projects p;

COMMENT ON VIEW masked_projects IS 'Vue des projets avec masquage automatique des coordonnées selon le statut de déblocage';

-- -----------------------------------------------------
-- 12. STATISTIQUES: Vue pour le dashboard admin
-- -----------------------------------------------------
CREATE OR REPLACE VIEW match_payment_stats AS
SELECT 
  DATE_TRUNC('day', mp.created_at) AS date,
  COUNT(*) AS total_payments,
  COUNT(*) FILTER (WHERE mp.status = 'paid') AS successful_payments,
  COUNT(*) FILTER (WHERE mp.status = 'pending') AS pending_payments,
  COUNT(*) FILTER (WHERE mp.status = 'failed') AS failed_payments,
  COUNT(*) FILTER (WHERE mp.payment_method = 'card') AS card_payments,
  COUNT(*) FILTER (WHERE mp.payment_method = 'credits') AS credit_payments,
  COUNT(*) FILTER (WHERE mp.payment_method = 'free_promo') AS free_payments,
  SUM(mp.amount_euros) FILTER (WHERE mp.status = 'paid') AS total_revenue,
  SUM(mp.credits_used) FILTER (WHERE mp.payment_method = 'credits') AS total_credits_used,
  COUNT(DISTINCT mp.professional_id) AS unique_professionals,
  COUNT(DISTINCT mp.project_id) AS unique_projects
FROM match_payments mp
GROUP BY DATE_TRUNC('day', mp.created_at)
ORDER BY date DESC;

COMMENT ON VIEW match_payment_stats IS 'Statistiques quotidiennes des paiements de matching pour le dashboard admin';

-- =====================================================
-- COMMENTAIRES ET DOCUMENTATION
-- =====================================================

COMMENT ON TABLE match_payments IS 'Paiements pour débloquer les coordonnées client après un match mutuel';
COMMENT ON TABLE project_interests IS 'Intérêts des professionnels pour les projets (swipes right) avec statut de déblocage';

-- =====================================================
-- FIN MIGRATION
-- =====================================================
