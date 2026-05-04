-- =====================================================
-- Migration: Ajout des colonnes pour le rate limiting
-- =====================================================

-- Ajouter daily_estimates_count dans professionals
ALTER TABLE professionals 
ADD COLUMN daily_estimates_count INTEGER DEFAULT 0;

-- Ajouter last_estimate_date pour suivre la date de dernière estimation
ALTER TABLE professionals 
ADD COLUMN last_estimate_date TIMESTAMP WITH TIME ZONE;

-- Ajouter estimation_responses_count dans projects pour suivre les réponses
ALTER TABLE projects 
ADD COLUMN estimation_responses_count INTEGER DEFAULT 0;

-- Ajouter estimation_status pour gérer le statut 'Complet'
ALTER TABLE projects 
ADD COLUMN estimation_status TEXT DEFAULT 'open' CHECK (estimation_status IN ('open', 'completed', 'expired'));

-- Index pour optimiser les requêtes de rate limiting
CREATE INDEX IF NOT EXISTS idx_professionals_daily_estimates 
  ON professionals(daily_estimates_count);

CREATE INDEX IF NOT EXISTS idx_professionals_last_estimate_date 
  ON professionals(last_estimate_date);

CREATE INDEX IF NOT EXISTS idx_projects_estimation_status 
  ON projects(estimation_status);

CREATE INDEX IF NOT EXISTS idx_projects_estimation_responses_count 
  ON projects(estimation_responses_count);

-- =====================================================
-- Fonction: Vérifier la limite quotidienne d'estimations pour un pro
-- =====================================================
CREATE OR REPLACE FUNCTION check_professional_daily_estimate_limit(
  p_professional_id UUID,
  p_max_daily_estimations INTEGER DEFAULT 5
)
RETURNS TABLE (
  can_send_estimate BOOLEAN,
  current_count INTEGER,
  remaining_count INTEGER,
  reset_time TIMESTAMP WITH TIME ZONE,
  error_message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_today_start TIMESTAMP WITH TIME ZONE;
  v_today_end TIMESTAMP WITH TIME ZONE;
  v_current_count INTEGER;
  v_last_estimate_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Définir la plage de temps (aujourd'hui)
  v_today_start := date_trunc('day', NOW() AT TIME ZONE 'Europe/Paris');
  v_today_end := v_today_start + INTERVAL '1 day';
  
  -- Compter les estimations envoyées aujourd'hui
  SELECT COUNT(*), MAX(created_at)
  INTO v_current_count, v_last_estimate_date
  FROM match_payments
  WHERE professional_id = p_professional_id
    AND created_at >= v_today_start
    AND created_at < v_today_end
    AND status IN ('pending', 'completed');
  
  -- Déterminer si le pro peut envoyer une estimation
  IF v_current_count >= p_max_daily_estimations THEN
    RETURN QUERY SELECT 
      false, 
      v_current_count,
      0,
      v_today_end,
      'Limite quotidienne atteinte (' || p_max_daily_estimations || ' estimations/jour)';
  ELSE
    RETURN QUERY SELECT 
      true, 
      v_current_count,
      p_max_daily_estimations - v_current_count,
      v_today_end,
      NULL;
  END IF;
END;
$$;

-- =====================================================
-- Fonction: Vérifier si un projet peut recevoir plus d'estimations
-- =====================================================
CREATE OR REPLACE FUNCTION check_project_estimation_limit(
  p_project_id UUID,
  p_max_estimations INTEGER DEFAULT 3
)
RETURNS TABLE (
  can_receive_estimate BOOLEAN,
  current_count INTEGER,
  remaining_count INTEGER,
  project_status TEXT,
  error_message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_count INTEGER;
  v_project_status TEXT;
BEGIN
  -- Récupérer le statut actuel et le nombre de réponses
  SELECT estimation_status, estimation_responses_count
  INTO v_project_status, v_current_count
  FROM projects
  WHERE id = p_project_id;
  
  -- Si le projet n'existe pas
  IF v_project_status IS NULL THEN
    RETURN QUERY SELECT 
      false, 
      0,
      0,
      'not_found',
      'Projet non trouvé';
    RETURN;
  END IF;
  
  -- Si le projet est déjà complet
  IF v_project_status = 'completed' THEN
    RETURN QUERY SELECT 
      false, 
      v_current_count,
      0,
      v_project_status,
      'Ce projet a déjà reçu assez d''estimations';
    RETURN;
  END IF;
  
  -- Si la limite est atteinte, marquer comme complet
  IF v_current_count >= p_max_estimations THEN
    -- Mettre à jour le statut du projet
    UPDATE projects
    SET estimation_status = 'completed',
        updated_at = NOW()
    WHERE id = p_project_id;
    
    RETURN QUERY SELECT 
      false, 
      v_current_count,
      0,
      'completed',
      'Ce projet a déjà reçu assez d''estimations';
    RETURN;
  END IF;
  
  -- Le projet peut recevoir des estimations
  RETURN QUERY SELECT 
    true, 
    v_current_count,
    p_max_estimations - v_current_count,
    v_project_status,
    NULL;
END;
$$;

-- =====================================================
-- Fonction: Vérifier la limite hebdomadaire pour un particulier
-- =====================================================
CREATE OR REPLACE FUNCTION check_client_weekly_estimation_limit(
  p_client_id UUID,
  p_max_weekly_estimations INTEGER DEFAULT 2
)
RETURNS TABLE (
  can_create_estimate BOOLEAN,
  current_count INTEGER,
  remaining_count INTEGER,
  reset_time TIMESTAMP WITH TIME ZONE,
  error_message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_week_start TIMESTAMP WITH TIME ZONE;
  v_week_end TIMESTAMP WITH TIME ZONE;
  v_current_count INTEGER;
  v_has_firm_project BOOLEAN;
BEGIN
  -- Définir la plage de temps (cette semaine)
  v_week_start := date_trunc('week', NOW() AT TIME ZONE 'Europe/Paris');
  v_week_end := v_week_start + INTERVAL '1 week';
  
  -- Compter les estimations créées cette semaine
  SELECT COUNT(*)
  INTO v_current_count
  FROM projects
  WHERE client_id = p_client_id
    AND created_at >= v_week_start
    AND created_at < v_week_end
    AND project_type = 'estimation';
  
  -- Vérifier si le client a au moins un projet ferme validé
  SELECT EXISTS(
    SELECT 1 FROM projects
    WHERE client_id = p_client_id
      AND project_type = 'firm_project'
      AND validation_status = 'approved'
  ) INTO v_has_firm_project;
  
  -- Si le client a un projet ferme validé, pas de limite
  IF v_has_firm_project THEN
    RETURN QUERY SELECT 
      true, 
      v_current_count,
      999, -- Illimité
      v_week_end,
      NULL;
    RETURN;
  END IF;
  
  -- Si la limite est atteinte
  IF v_current_count >= p_max_weekly_estimations THEN
    RETURN QUERY SELECT 
      false, 
      v_current_count,
      0,
      v_week_end,
      'Limite hebdomadaire atteinte (' || p_max_weekly_estimations || ' estimations/semaine. Créez un projet ferme pour déblover cette limite.)';
    RETURN;
  END IF;
  
  -- Le client peut créer une estimation
  RETURN QUERY SELECT 
    true, 
    v_current_count,
    p_max_weekly_estimations - v_current_count,
    v_week_end,
    NULL;
END;
$$;

-- =====================================================
-- Trigger: Mettre à jour le compteur d'estimations du pro
-- =====================================================
CREATE OR REPLACE FUNCTION update_professional_estimate_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour le compteur quotidien
  UPDATE professionals
  SET 
    daily_estimates_count = daily_estimates_count + 1,
    last_estimate_date = NOW()
  WHERE user_id = NEW.professional_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger sur les match_payments
DROP TRIGGER IF EXISTS trigger_update_professional_estimate_count ON match_payments;
CREATE TRIGGER trigger_update_professional_estimate_count
  AFTER INSERT ON match_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_professional_estimate_count();

-- =====================================================
-- Trigger: Remettre à zéro les compteurs quotidiens
-- =====================================================
CREATE OR REPLACE FUNCTION reset_daily_estimate_counters()
RETURNS void AS $$
BEGIN
  UPDATE professionals
  SET 
    daily_estimates_count = 0
  WHERE last_estimate_date < date_trunc('day', NOW() AT TIME ZONE 'Europe/Paris')
     OR last_estimate_date IS NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Commentaires
-- =====================================================
COMMENT ON COLUMN professionals.daily_estimates_count IS 'Compteur d''estimations envoyées aujourd''hui';
COMMENT ON COLUMN professionals.last_estimate_date IS 'Date de la dernière estimation envoyée';
COMMENT ON COLUMN projects.estimation_responses_count IS 'Nombre d''estimations reçues pour ce projet';
COMMENT ON COLUMN projects.estimation_status IS 'Statut de l''estimation: open, completed, expired';
COMMENT ON FUNCTION check_professional_daily_estimate_limit IS 'Vérifie la limite quotidienne d''estimations pour un professionnel';
COMMENT ON FUNCTION check_project_estimation_limit IS 'Vérifie si un projet peut recevoir plus d''estimations';
COMMENT ON FUNCTION check_client_weekly_estimation_limit IS 'Vérifie la limite hebdomadaire d''estimations pour un particulier';
