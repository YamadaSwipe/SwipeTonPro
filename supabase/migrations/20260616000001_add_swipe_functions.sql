-- =====================================================
-- MIGRATION: Fonctions SQL pour le système de swipe
-- Date: 16/06/2026
-- Auteur: Équipe Technique SwipeTonPro
-- Description: Fonctions optimisées pour gérer les swipes et récupérer
--              les projets non swipés
-- =====================================================

-- =====================================================
-- FONCTION: get_unswiped_projects
-- Retourne les projets que le professionnel n'a jamais swipés
-- =====================================================

CREATE OR REPLACE FUNCTION get_unswiped_projects(
  p_professional_id UUID,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  project_id UUID,
  title TEXT,
  category TEXT,
  city TEXT,
  estimated_budget_min INTEGER,
  estimated_budget_max INTEGER,
  urgency TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  work_types TEXT[],
  description TEXT,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Récupérer le user_id du professionnel
  SELECT user_id INTO v_user_id
  FROM professionals
  WHERE id = p_professional_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Professionnel non trouvé: %', p_professional_id;
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.category,
    p.city,
    p.estimated_budget_min,
    p.estimated_budget_max,
    p.urgency,
    p.created_at,
    p.work_types,
    p.description,
    p.status
  FROM projects p
  WHERE p.status = 'published'
    AND p.client_id != v_user_id  -- Ne pas montrer ses propres projets
    AND p.id NOT IN (
      -- Exclure les projets déjà swipés
      SELECT target_id
      FROM swipe_history
      WHERE swiper_id = v_user_id
      AND target_type = 'project'
    )
  ORDER BY p.created_at DESC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION get_unswiped_projects IS 
  'Retourne les projets que le professionnel n''a jamais swipés (optimisé avec index)';

-- =====================================================
-- FONCTION: record_swipe
-- Enregistre un swipe et retourne si c'est un doublon
-- =====================================================

CREATE OR REPLACE FUNCTION record_swipe(
  p_swiper_id UUID,
  p_swiper_type TEXT,
  p_target_id UUID,
  p_target_type TEXT,
  p_action TEXT,
  p_matching_score DECIMAL DEFAULT NULL,
  p_swipe_context JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  swipe_id UUID,
  is_duplicate BOOLEAN,
  previous_action TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_swipe_id UUID;
  v_is_duplicate BOOLEAN := FALSE;
  v_previous_action TEXT := NULL;
  v_existing_swipe RECORD;
BEGIN
  -- Vérifier si le swipe existe déjà
  SELECT id, action INTO v_existing_swipe
  FROM swipe_history
  WHERE swiper_id = p_swiper_id
    AND target_id = p_target_id
    AND target_type = p_target_type;
  
  IF v_existing_swipe.id IS NOT NULL THEN
    -- Swipe déjà existant
    v_is_duplicate := TRUE;
    v_previous_action := v_existing_swipe.action;
    v_swipe_id := v_existing_swipe.id;
    
    -- Mettre à jour le swipe existant (l'utilisateur a changé d'avis)
    UPDATE swipe_history
    SET 
      action = p_action,
      matching_score = COALESCE(p_matching_score, matching_score),
      swipe_context = p_swipe_context,
      created_at = NOW()  -- Mettre à jour la date
    WHERE id = v_swipe_id;
    
  ELSE
    -- Nouveau swipe
    INSERT INTO swipe_history (
      swiper_id, 
      swiper_type, 
      target_id, 
      target_type, 
      action, 
      matching_score,
      swipe_context
    )
    VALUES (
      p_swiper_id, 
      p_swiper_type, 
      p_target_id, 
      p_target_type, 
      p_action, 
      p_matching_score,
      p_swipe_context
    )
    RETURNING id INTO v_swipe_id;
  END IF;
  
  -- Si c'est un LIKE, créer aussi un project_interest pour compatibilité
  IF p_action IN ('like', 'super_like') AND p_target_type = 'project' THEN
    -- Récupérer le professional_id
    DECLARE
      v_professional_id UUID;
    BEGIN
      SELECT id INTO v_professional_id
      FROM professionals
      WHERE user_id = p_swiper_id;
      
      IF v_professional_id IS NOT NULL THEN
        -- Insérer dans project_interests (pour compatibilité avec le système existant)
        INSERT INTO project_interests (
          project_id,
          professional_id,
          status,
          matching_score
        )
        VALUES (
          p_target_id,
          v_professional_id,
          'interested',
          p_matching_score
        )
        ON CONFLICT (professional_id, project_id) DO NOTHING;
      END IF;
    END;
  END IF;
  
  RETURN QUERY SELECT v_swipe_id, v_is_duplicate, v_previous_action;
END;
$$;

COMMENT ON FUNCTION record_swipe IS 
  'Enregistre un swipe et gère les doublons (mise à jour si l''utilisateur change d''avis)';

-- =====================================================
-- FONCTION: get_swipe_stats
-- Retourne les statistiques de swipe d'un utilisateur
-- =====================================================

CREATE OR REPLACE FUNCTION get_swipe_stats(
  p_user_id UUID
)
RETURNS TABLE (
  total_swipes BIGINT,
  likes BIGINT,
  dislikes BIGINT,
  super_likes BIGINT,
  maybe BIGINT,
  swipes_today BIGINT,
  swipes_this_week BIGINT,
  swipes_this_month BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_swipes,
    COUNT(*) FILTER (WHERE action = 'like')::BIGINT as likes,
    COUNT(*) FILTER (WHERE action = 'dislike')::BIGINT as dislikes,
    COUNT(*) FILTER (WHERE action = 'super_like')::BIGINT as super_likes,
    COUNT(*) FILTER (WHERE action = 'maybe')::BIGINT as maybe,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::BIGINT as swipes_today,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days')::BIGINT as swipes_this_week,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days')::BIGINT as swipes_this_month
  FROM swipe_history
  WHERE swiper_id = p_user_id;
END;
$$;

COMMENT ON FUNCTION get_swipe_stats IS 
  'Retourne les statistiques de swipe d''un utilisateur (total, par type, par période)';

-- =====================================================
-- FONCTION: get_maybe_projects
-- Retourne les projets sauvegardés "pour plus tard"
-- =====================================================

CREATE OR REPLACE FUNCTION get_maybe_projects(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  project_id UUID,
  title TEXT,
  category TEXT,
  city TEXT,
  estimated_budget_min INTEGER,
  estimated_budget_max INTEGER,
  urgency TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  swiped_at TIMESTAMP WITH TIME ZONE,
  matching_score DECIMAL(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.category,
    p.city,
    p.estimated_budget_min,
    p.estimated_budget_max,
    p.urgency,
    p.created_at,
    sh.created_at as swiped_at,
    sh.matching_score
  FROM swipe_history sh
  JOIN projects p ON p.id = sh.target_id
  WHERE sh.swiper_id = p_user_id
    AND sh.target_type = 'project'
    AND sh.action = 'maybe'
    AND p.status = 'published'  -- Seulement les projets encore actifs
  ORDER BY sh.created_at DESC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION get_maybe_projects IS 
  'Retourne les projets sauvegardés "pour plus tard" par un utilisateur';

-- =====================================================
-- FONCTION: delete_old_swipes
-- Nettoie les swipes anciens (pour GDPR et performance)
-- =====================================================

CREATE OR REPLACE FUNCTION delete_old_swipes(
  p_days_to_keep INTEGER DEFAULT 365
)
RETURNS TABLE (
  deleted_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count BIGINT;
BEGIN
  -- Supprimer les swipes "dislike" et "maybe" de plus de X jours
  -- (garder les "like" pour l'historique)
  DELETE FROM swipe_history
  WHERE action IN ('dislike', 'maybe')
    AND created_at < NOW() - (p_days_to_keep || ' days')::INTERVAL;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN QUERY SELECT v_deleted_count;
END;
$$;

COMMENT ON FUNCTION delete_old_swipes IS 
  'Nettoie les swipes anciens (dislike/maybe) pour GDPR et performance';

-- =====================================================
-- VÉRIFICATION des fonctions créées
-- =====================================================

DO $$
DECLARE
  v_function_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_function_count
  FROM pg_proc
  WHERE proname IN (
    'get_unswiped_projects',
    'record_swipe',
    'get_swipe_stats',
    'get_maybe_projects',
    'delete_old_swipes'
  );
  
  IF v_function_count = 5 THEN
    RAISE NOTICE '✅ Toutes les fonctions de swipe créées avec succès (5/5)';
  ELSE
    RAISE WARNING '⚠️ Seulement % fonctions créées sur 5', v_function_count;
  END IF;
END $$;
