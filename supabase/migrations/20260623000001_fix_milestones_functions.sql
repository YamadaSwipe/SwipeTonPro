-- =====================================================
-- FIX: Correction des fonctions de jalons
-- =====================================================
-- Description: Correction de l'erreur "column validation_status does not exist"
-- Date: 2026-06-23
-- Version: 1.0.1
-- =====================================================

-- Supprimer les fonctions existantes
DROP FUNCTION IF EXISTS propose_milestone(UUID, milestone_type, UUID, TEXT);
DROP FUNCTION IF EXISTS validate_milestone(UUID, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_project_milestones(UUID);

-- =====================================================
-- FONCTION POUR PROPOSER UN JALON (CORRIGÉE)
-- =====================================================

CREATE OR REPLACE FUNCTION propose_milestone(
  p_project_id UUID,
  p_milestone_type milestone_type,
  p_proposed_by UUID,
  p_comment TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_milestone_id UUID;
  v_existing_status milestone_validation_status;
  v_client_id UUID;
  v_professional_id UUID;
  v_is_authorized BOOLEAN := FALSE;
BEGIN
  -- Vérifier que le projet existe et récupérer les participants
  SELECT 
    p.client_id,
    (SELECT pi.professional_id FROM project_interests pi
     WHERE pi.project_id = p.id AND pi.status = 'accepted' 
     LIMIT 1)
  INTO v_client_id, v_professional_id
  FROM projects p
  WHERE p.id = p_project_id;
  
  IF v_client_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Projet non trouvé'
    );
  END IF;
  
  -- Vérifier que l'utilisateur est autorisé (client ou professionnel du projet)
  IF p_proposed_by = v_client_id OR p_proposed_by = v_professional_id THEN
    v_is_authorized := TRUE;
  END IF;
  
  IF NOT v_is_authorized THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Non autorisé à proposer ce jalon'
    );
  END IF;
  
  -- Vérifier si le jalon existe déjà (avec alias de table)
  SELECT pm.id, pm.validation_status 
  INTO v_milestone_id, v_existing_status
  FROM project_milestones pm
  WHERE pm.project_id = p_project_id 
    AND pm.milestone_type = p_milestone_type;
  
  IF v_milestone_id IS NOT NULL THEN
    -- Mettre à jour le jalon existant
    UPDATE project_milestones
    SET 
      proposed_by = p_proposed_by,
      proposed_at = NOW(),
      proposed_comment = p_comment,
      validation_status = 'pending_validation'::milestone_validation_status,
      validated_by = NULL,
      validated_at = NULL,
      validation_comment = NULL
    WHERE id = v_milestone_id;
    
    -- Enregistrer dans l'historique
    INSERT INTO milestone_validation_history (
      milestone_id, action, performed_by, 
      previous_status, new_status, comment
    ) VALUES (
      v_milestone_id, 'updated', p_proposed_by,
      v_existing_status, 'pending_validation'::milestone_validation_status, p_comment
    );
  ELSE
    -- Créer un nouveau jalon
    INSERT INTO project_milestones (
      project_id, milestone_type, proposed_by, 
      proposed_comment, validation_status
    ) VALUES (
      p_project_id, p_milestone_type, p_proposed_by,
      p_comment, 'pending_validation'::milestone_validation_status
    )
    RETURNING id INTO v_milestone_id;
    
    -- Enregistrer dans l'historique
    INSERT INTO milestone_validation_history (
      milestone_id, action, performed_by, 
      new_status, comment
    ) VALUES (
      v_milestone_id, 'proposed', p_proposed_by,
      'pending_validation'::milestone_validation_status, p_comment
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'milestone_id', v_milestone_id,
    'status', 'pending_validation'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FONCTION POUR VALIDER UN JALON (CORRIGÉE)
-- =====================================================

CREATE OR REPLACE FUNCTION validate_milestone(
  p_milestone_id UUID,
  p_validated_by UUID,
  p_comment TEXT DEFAULT NULL,
  p_action TEXT DEFAULT 'validate' -- 'validate' ou 'reject'
)
RETURNS JSON AS $$
DECLARE
  v_project_id UUID;
  v_proposed_by UUID;
  v_client_id UUID;
  v_professional_id UUID;
  v_is_authorized BOOLEAN := FALSE;
  v_new_status milestone_validation_status;
  v_old_status milestone_validation_status;
BEGIN
  -- Récupérer les informations du jalon (avec alias de table)
  SELECT 
    pm.project_id, 
    pm.proposed_by,
    pm.validation_status,
    p.client_id,
    (SELECT pi.professional_id FROM project_interests pi
     WHERE pi.project_id = pm.project_id AND pi.status = 'accepted' 
     LIMIT 1)
  INTO v_project_id, v_proposed_by, v_old_status, v_client_id, v_professional_id
  FROM project_milestones pm
  JOIN projects p ON pm.project_id = p.id
  WHERE pm.id = p_milestone_id;
  
  IF v_project_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Jalon non trouvé'
    );
  END IF;
  
  -- Vérifier que l'utilisateur est l'autre partie (pas celui qui a proposé)
  IF p_validated_by != v_proposed_by AND 
     (p_validated_by = v_client_id OR p_validated_by = v_professional_id) THEN
    v_is_authorized := TRUE;
  END IF;
  
  IF NOT v_is_authorized THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Non autorisé à valider ce jalon'
    );
  END IF;
  
  -- Déterminer le nouveau statut
  IF p_action = 'validate' THEN
    v_new_status := 'validated'::milestone_validation_status;
  ELSE
    v_new_status := 'rejected'::milestone_validation_status;
  END IF;
  
  -- Mettre à jour le jalon
  UPDATE project_milestones
  SET 
    validation_status = v_new_status,
    validated_by = p_validated_by,
    validated_at = NOW(),
    validation_comment = p_comment
  WHERE id = p_milestone_id;
  
  -- Enregistrer dans l'historique
  INSERT INTO milestone_validation_history (
    milestone_id, action, performed_by,
    previous_status, new_status, comment
  ) VALUES (
    p_milestone_id, p_action, p_validated_by,
    v_old_status, v_new_status, p_comment
  );
  
  RETURN json_build_object(
    'success', true,
    'milestone_id', p_milestone_id,
    'status', v_new_status::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FONCTION POUR RÉCUPÉRER LES JALONS (CORRIGÉE)
-- =====================================================

CREATE OR REPLACE FUNCTION get_project_milestones(p_project_id UUID)
RETURNS TABLE (
  id UUID,
  milestone_type milestone_type,
  validation_status milestone_validation_status,
  proposed_by UUID,
  proposed_by_name TEXT,
  proposed_by_role TEXT,
  proposed_at TIMESTAMP WITH TIME ZONE,
  proposed_comment TEXT,
  validated_by UUID,
  validated_by_name TEXT,
  validated_by_role TEXT,
  validated_at TIMESTAMP WITH TIME ZONE,
  validation_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pm.id,
    pm.milestone_type,
    pm.validation_status,
    pm.proposed_by,
    p1.full_name AS proposed_by_name,
    p1.role::TEXT AS proposed_by_role,
    pm.proposed_at,
    pm.proposed_comment,
    pm.validated_by,
    p2.full_name AS validated_by_name,
    p2.role::TEXT AS validated_by_role,
    pm.validated_at,
    pm.validation_comment,
    pm.created_at,
    pm.updated_at
  FROM project_milestones pm
  LEFT JOIN profiles p1 ON pm.proposed_by = p1.id
  LEFT JOIN profiles p2 ON pm.validated_by = p2.id
  WHERE pm.project_id = p_project_id
  ORDER BY pm.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTAIRES
-- =====================================================

COMMENT ON FUNCTION propose_milestone IS 
  'Permet à un client ou artisan de proposer un changement de jalon (CORRIGÉ)';

COMMENT ON FUNCTION validate_milestone IS 
  'Permet à l''autre partie de valider ou rejeter un jalon proposé (CORRIGÉ)';

COMMENT ON FUNCTION get_project_milestones IS 
  'Récupère tous les jalons d''un projet avec les informations des utilisateurs (CORRIGÉ)';

-- =====================================================
-- FIN DE LA MIGRATION DE CORRECTION
-- =====================================================
