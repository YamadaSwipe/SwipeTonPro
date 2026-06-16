-- =====================================================
-- MIGRATION: Vues et Fonctions pour Dashboard Utilisateur
-- =====================================================
-- Description: Crée les vues SQL optimisées pour le dashboard utilisateur
-- - Historique complet des messages par projet
-- - Suivi des actions (match, rendez-vous, devis)
-- - Statut financier Stripe
-- - Activation paiement séquestré
-- =====================================================

-- =====================================================
-- 1. VUE: Historique des messages par projet
-- =====================================================
CREATE OR REPLACE VIEW user_project_messages_history AS
SELECT 
  p.id AS project_id,
  p.title AS project_title,
  p.client_id,
  c.id AS conversation_id,
  c.professional_id,
  prof.company_name AS professional_name,
  m.id AS message_id,
  m.sender_id,
  m.content AS message_content,
  m.created_at AS message_date,
  m.is_read,
  CASE 
    WHEN m.sender_id = p.client_id THEN 'client'
    ELSE 'professional'
  END AS sender_type,
  -- Mini-messages pré-match
  mm.content AS mini_message_content,
  mm.created_at AS mini_message_date,
  mm.sender_type AS mini_sender_type,
  mm.is_pre_match
FROM projects p
LEFT JOIN conversations c ON c.project_id = p.id
LEFT JOIN messages m ON m.conversation_id = c.id
LEFT JOIN professionals prof ON prof.id = c.professional_id
LEFT JOIN mini_messages mm ON mm.project_id = p.id AND mm.professional_id = c.professional_id
ORDER BY 
  p.created_at DESC,
  COALESCE(m.created_at, mm.created_at) DESC;

COMMENT ON VIEW user_project_messages_history IS 'Historique complet des messages (conversations + mini-messages) par projet pour le dashboard utilisateur';

-- =====================================================
-- 2. VUE: Suivi des actions par projet
-- =====================================================
CREATE OR REPLACE VIEW user_project_actions_timeline AS
SELECT 
  p.id AS project_id,
  p.title AS project_title,
  p.client_id,
  p.status AS project_status,
  p.created_at AS project_created_at,
  
  -- Informations sur les intérêts/matchs
  pi.id AS interest_id,
  pi.professional_id,
  prof.company_name AS professional_name,
  prof.user_id AS professional_user_id,
  pi.status AS interest_status,
  pi.created_at AS interest_date,
  pi.client_interested,
  
  -- Informations sur les paiements de match
  mp.id AS payment_id,
  mp.status AS payment_status,
  mp.amount AS payment_amount,
  mp.currency AS payment_currency,
  mp.stripe_payment_intent_id,
  mp.paid_at AS payment_date,
  mp.metadata AS payment_metadata,
  
  -- Informations sur les conversations
  c.id AS conversation_id,
  c.status AS conversation_status,
  c.created_at AS conversation_started_at,
  c.last_message_at,
  
  -- Informations sur les devis (bids)
  b.id AS bid_id,
  b.proposed_price AS bid_amount,
  b.status AS bid_status,
  b.message AS bid_message,
  b.created_at AS bid_date,
  
  -- Type d'action pour le timeline
  CASE 
    WHEN pi.id IS NOT NULL AND pi.created_at IS NOT NULL THEN 'interest_signaled'
    WHEN mp.id IS NOT NULL AND mp.paid_at IS NOT NULL THEN 'match_paid'
    WHEN c.id IS NOT NULL AND c.created_at IS NOT NULL THEN 'conversation_started'
    WHEN b.id IS NOT NULL AND b.created_at IS NOT NULL THEN 'bid_received'
    ELSE 'project_created'
  END AS action_type,
  
  -- Date de l'action pour le tri
  COALESCE(
    mp.paid_at,
    b.created_at,
    c.created_at,
    pi.created_at,
    p.created_at
  ) AS action_date

FROM projects p
LEFT JOIN project_interests pi ON pi.project_id = p.id
LEFT JOIN professionals prof ON prof.id = pi.professional_id
LEFT JOIN match_payments mp ON mp.project_id = p.id AND mp.professional_id = pi.professional_id
LEFT JOIN conversations c ON c.project_id = p.id AND c.professional_id = pi.professional_id
LEFT JOIN bids b ON b.project_id = p.id AND b.professional_id = pi.professional_id
ORDER BY action_date DESC;

COMMENT ON VIEW user_project_actions_timeline IS 'Timeline complète des actions par projet: intérêts, matchs, paiements, conversations, devis';

-- =====================================================
-- 3. VUE: Statut financier Stripe par projet
-- =====================================================
CREATE OR REPLACE VIEW user_project_financial_status AS
SELECT 
  p.id AS project_id,
  p.title AS project_title,
  p.client_id,
  p.budget_min,
  p.budget_max,
  p.estimated_budget_min,
  p.estimated_budget_max,
  
  -- Informations sur le paiement de match
  mp.id AS match_payment_id,
  mp.professional_id,
  prof.company_name AS professional_name,
  mp.amount AS match_fee_amount,
  mp.currency AS match_fee_currency,
  mp.status AS match_payment_status,
  mp.stripe_payment_intent_id,
  mp.stripe_charge_id,
  mp.paid_at AS match_paid_at,
  mp.metadata AS match_payment_metadata,
  
  -- Informations sur le séquestre (si activé)
  p.property_type,
  CASE 
    WHEN mp.metadata->>'escrow_enabled' = 'true' THEN true
    ELSE false
  END AS escrow_enabled,
  
  CASE 
    WHEN mp.metadata->>'escrow_amount' IS NOT NULL 
    THEN (mp.metadata->>'escrow_amount')::numeric
    ELSE NULL
  END AS escrow_amount,
  
  CASE 
    WHEN mp.metadata->>'escrow_status' IS NOT NULL 
    THEN mp.metadata->>'escrow_status'
    ELSE NULL
  END AS escrow_status,
  
  -- Informations sur les devis
  b.id AS bid_id,
  b.proposed_price AS bid_amount,
  b.status AS bid_status,
  
  -- Calcul du total potentiel
  COALESCE(mp.amount, 0) + COALESCE(b.proposed_price, 0) AS total_potential_cost,
  
  -- Statut global du paiement
  CASE 
    WHEN mp.status = 'succeeded' AND b.status = 'accepted' THEN 'fully_paid'
    WHEN mp.status = 'succeeded' THEN 'match_paid'
    WHEN mp.status = 'pending' THEN 'payment_pending'
    WHEN mp.status = 'failed' THEN 'payment_failed'
    ELSE 'no_payment'
  END AS overall_payment_status

FROM projects p
LEFT JOIN match_payments mp ON mp.project_id = p.id
LEFT JOIN professionals prof ON prof.id = mp.professional_id
LEFT JOIN bids b ON b.project_id = p.id AND b.professional_id = mp.professional_id
ORDER BY p.created_at DESC;

COMMENT ON VIEW user_project_financial_status IS 'Statut financier complet par projet: paiements match, séquestre Stripe, devis';

-- =====================================================
-- 4. FONCTION: Récupérer le dashboard complet d'un utilisateur
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_dashboard_data(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_projects JSON;
  v_messages JSON;
  v_actions JSON;
  v_financial JSON;
  v_stats JSON;
BEGIN
  -- Récupérer les projets de l'utilisateur
  SELECT json_agg(row_to_json(p.*))
  INTO v_projects
  FROM projects p
  WHERE p.client_id = p_user_id
  ORDER BY p.created_at DESC;
  
  -- Récupérer l'historique des messages
  SELECT json_agg(row_to_json(m.*))
  INTO v_messages
  FROM user_project_messages_history m
  WHERE m.client_id = p_user_id
  ORDER BY m.message_date DESC
  LIMIT 50;
  
  -- Récupérer la timeline des actions
  SELECT json_agg(row_to_json(a.*))
  INTO v_actions
  FROM user_project_actions_timeline a
  WHERE a.client_id = p_user_id
  ORDER BY a.action_date DESC
  LIMIT 100;
  
  -- Récupérer le statut financier
  SELECT json_agg(row_to_json(f.*))
  INTO v_financial
  FROM user_project_financial_status f
  WHERE f.client_id = p_user_id;
  
  -- Calculer les statistiques
  SELECT json_build_object(
    'total_projects', COUNT(*),
    'pending_projects', COUNT(*) FILTER (WHERE status = 'pending'),
    'published_projects', COUNT(*) FILTER (WHERE status = 'published'),
    'in_progress_projects', COUNT(*) FILTER (WHERE status = 'in_progress'),
    'completed_projects', COUNT(*) FILTER (WHERE status = 'completed'),
    'total_spent', COALESCE(SUM(budget_max), 0),
    'total_matches', (
      SELECT COUNT(*) 
      FROM match_payments mp 
      JOIN projects p2 ON p2.id = mp.project_id 
      WHERE p2.client_id = p_user_id AND mp.status = 'succeeded'
    ),
    'total_conversations', (
      SELECT COUNT(*) 
      FROM conversations c 
      JOIN projects p3 ON p3.id = c.project_id 
      WHERE p3.client_id = p_user_id
    )
  )
  INTO v_stats
  FROM projects
  WHERE client_id = p_user_id;
  
  -- Construire le résultat final
  v_result := json_build_object(
    'user_id', p_user_id,
    'generated_at', NOW(),
    'stats', v_stats,
    'projects', COALESCE(v_projects, '[]'::json),
    'messages_history', COALESCE(v_messages, '[]'::json),
    'actions_timeline', COALESCE(v_actions, '[]'::json),
    'financial_status', COALESCE(v_financial, '[]'::json)
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_dashboard_data(UUID) IS 'Récupère toutes les données du dashboard utilisateur en une seule requête optimisée';

-- =====================================================
-- 5. FONCTION: Récupérer les statistiques Stripe d'un utilisateur
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_stripe_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total_match_payments', COUNT(*),
    'successful_payments', COUNT(*) FILTER (WHERE mp.status = 'succeeded'),
    'pending_payments', COUNT(*) FILTER (WHERE mp.status = 'pending'),
    'failed_payments', COUNT(*) FILTER (WHERE mp.status = 'failed'),
    'total_amount_paid', COALESCE(SUM(mp.amount) FILTER (WHERE mp.status = 'succeeded'), 0),
    'total_escrow_amount', COALESCE(
      SUM((mp.metadata->>'escrow_amount')::numeric) 
      FILTER (WHERE mp.metadata->>'escrow_enabled' = 'true'), 
      0
    ),
    'active_escrows', COUNT(*) FILTER (
      WHERE mp.metadata->>'escrow_enabled' = 'true' 
      AND mp.metadata->>'escrow_status' = 'active'
    ),
    'payment_methods', json_agg(DISTINCT mp.metadata->>'payment_method') FILTER (WHERE mp.metadata->>'payment_method' IS NOT NULL),
    'last_payment_date', MAX(mp.paid_at)
  )
  INTO v_result
  FROM match_payments mp
  JOIN projects p ON p.id = mp.project_id
  WHERE p.client_id = p_user_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_stripe_stats(UUID) IS 'Statistiques détaillées des paiements Stripe pour un utilisateur';

-- =====================================================
-- 6. INDEX pour optimiser les performances
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_match_payments_client_lookup 
ON match_payments(project_id, professional_id, status);

CREATE INDEX IF NOT EXISTS idx_conversations_project_professional 
ON conversations(project_id, professional_id, status);

CREATE INDEX IF NOT EXISTS idx_project_interests_timeline 
ON project_interests(project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_date 
ON messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bids_project_professional 
ON bids(project_id, professional_id, status);

-- =====================================================
-- 7. Politiques RLS pour les vues
-- =====================================================

-- Les utilisateurs peuvent voir leurs propres données de dashboard
CREATE POLICY "Users can view their own dashboard data"
  ON projects
  FOR SELECT
  USING (client_id = auth.uid());

-- =====================================================
-- 8. Fonction helper pour formater les montants
-- =====================================================
CREATE OR REPLACE FUNCTION format_currency(amount NUMERIC, currency TEXT DEFAULT 'EUR')
RETURNS TEXT AS $$
BEGIN
  RETURN amount::TEXT || ' ' || currency;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- Message de succès
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migration dashboard utilisateur créée avec succès';
  RAISE NOTICE '📊 Vues créées: user_project_messages_history, user_project_actions_timeline, user_project_financial_status';
  RAISE NOTICE '🔧 Fonctions créées: get_user_dashboard_data(), get_user_stripe_stats()';
  RAISE NOTICE '⚡ Index optimisés pour les performances';
END $$;
