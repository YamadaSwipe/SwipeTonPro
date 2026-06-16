-- =====================================================
-- SYSTÈME DE SUIVI DES JALONS DE PROJET
-- =====================================================
-- Description: Système collaboratif de suivi de l'avancement des projets
-- par jalons avec validation mutuelle entre client et artisan
-- Date: 2026-06-23
-- Version: 1.0.0
-- =====================================================

-- =====================================================
-- 1. ENUM POUR LES TYPES DE JALONS
-- =====================================================

DO $$ BEGIN
  CREATE TYPE milestone_type AS ENUM (
    'quote_accepted',      -- Devis accepté
    'quote_rejected',      -- Devis refusé
    'work_started',        -- Début du chantier
    'progress_30',         -- Avancement à 30%
    'progress_60',         -- Avancement à 60%
    'work_completed'       -- Fin de chantier
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- 2. ENUM POUR LE STATUT DE VALIDATION
-- =====================================================

DO $$ BEGIN
  CREATE TYPE milestone_validation_status AS ENUM (
    'pending_validation',  -- En attente de validation par l'autre partie
    'validated',           -- Validé par les deux parties
    'rejected'             -- Rejeté
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- 3. TABLE DES JALONS DE PROJET
-- =====================================================

CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Références
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Informations du jalon
  milestone_type milestone_type NOT NULL,
  validation_status milestone_validation_status DEFAULT 'pending_validation',
  
  -- Qui a proposé ce changement de statut
  proposed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  proposed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Qui a validé (null si en attente)
  validated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  validated_at TIMESTAMP WITH TIME ZONE,
  
  -- Commentaires optionnels
  proposed_comment TEXT,
  validation_comment TEXT,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT unique_project_milestone_type UNIQUE (project_id, milestone_type)
);

-- =====================================================
-- 4. TABLE D'HISTORIQUE DES VALIDATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS milestone_validation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Référence au jalon
  milestone_id UUID NOT NULL REFERENCES project_milestones(id) ON DELETE CASCADE,
  
  -- Action effectuée
  action TEXT NOT NULL CHECK (action IN ('proposed', 'validated', 'rejected', 'updated')),
  
  -- Qui a effectué l'action
  performed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Détails de l'action
  previous_status milestone_validation_status,
  new_status milestone_validation_status,
  
  -- Commentaire
  comment TEXT,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}',
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. INDEX POUR OPTIMISATION
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id 
  ON project_milestones(project_id);

CREATE INDEX IF NOT EXISTS idx_project_milestones_status 
  ON project_milestones(validation_status);

CREATE INDEX IF NOT EXISTS idx_project_milestones_type 
  ON project_milestones(milestone_type);

CREATE INDEX IF NOT EXISTS idx_project_milestones_proposed_by 
  ON project_milestones(proposed_by);

CREATE INDEX IF NOT EXISTS idx_project_milestones_validated_by 
  ON project_milestones(validated_by);

CREATE INDEX IF NOT EXISTS idx_milestone_history_milestone_id 
  ON milestone_validation_history(milestone_id);

CREATE INDEX IF NOT EXISTS idx_milestone_history_performed_by 
  ON milestone_validation_history(performed_by);

-- =====================================================
-- 6. TRIGGER POUR MISE À JOUR AUTOMATIQUE
-- =====================================================

CREATE OR REPLACE FUNCTION update_milestone_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_milestone_timestamp
  BEFORE UPDATE ON project_milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_milestone_updated_at();

-- =====================================================
-- 7. FONCTION POUR PROPOSER UN JALON
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
    (SELECT professional_id FROM project_interests 
     WHERE project_id = p.id AND status = 'accepted' 
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
  
  -- Vérifier si le jalon existe déjà
  SELECT id, validation_status 
  INTO v_milestone_id, v_existing_status
  FROM project_milestones
  WHERE project_id = p_project_id 
    AND milestone_type = p_milestone_type;
  
  IF v_milestone_id IS NOT NULL THEN
    -- Mettre à jour le jalon existant
    UPDATE project_milestones
    SET 
      proposed_by = p_proposed_by,
      proposed_at = NOW(),
      proposed_comment = p_comment,
      validation_status = 'pending_validation',
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
      v_existing_status, 'pending_validation', p_comment
    );
  ELSE
    -- Créer un nouveau jalon
    INSERT INTO project_milestones (
      project_id, milestone_type, proposed_by, 
      proposed_comment, validation_status
    ) VALUES (
      p_project_id, p_milestone_type, p_proposed_by,
      p_comment, 'pending_validation'
    )
    RETURNING id INTO v_milestone_id;
    
    -- Enregistrer dans l'historique
    INSERT INTO milestone_validation_history (
      milestone_id, action, performed_by, 
      new_status, comment
    ) VALUES (
      v_milestone_id, 'proposed', p_proposed_by,
      'pending_validation', p_comment
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
-- 8. FONCTION POUR VALIDER UN JALON
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
  -- Récupérer les informations du jalon
  SELECT 
    pm.project_id, 
    pm.proposed_by,
    pm.validation_status,
    p.client_id,
    (SELECT professional_id FROM project_interests 
     WHERE project_id = pm.project_id AND status = 'accepted' 
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
    v_new_status := 'validated';
  ELSE
    v_new_status := 'rejected';
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
    'status', v_new_status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. FONCTION POUR RÉCUPÉRER LES JALONS D'UN PROJET
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
-- 10. POLITIQUES RLS
-- =====================================================

ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_validation_history ENABLE ROW LEVEL SECURITY;

-- Les clients peuvent voir les jalons de leurs projets
CREATE POLICY "Clients can view milestones of their projects"
  ON project_milestones
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE client_id = auth.uid()
    )
  );

-- Les professionnels peuvent voir les jalons des projets où ils sont matchés
CREATE POLICY "Professionals can view milestones of matched projects"
  ON project_milestones
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
CREATE POLICY "Admins can view all milestones"
  ON project_milestones
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Politique pour l'historique (même logique)
CREATE POLICY "Users can view milestone history of their projects"
  ON milestone_validation_history
  FOR SELECT
  USING (
    milestone_id IN (
      SELECT id FROM project_milestones pm
      WHERE pm.project_id IN (
        SELECT id FROM projects WHERE client_id = auth.uid()
      )
      OR pm.project_id IN (
        SELECT project_id FROM project_interests 
        WHERE professional_id IN (
          SELECT id FROM professionals WHERE user_id = auth.uid()
        ) AND status = 'accepted'
      )
    )
  );

-- =====================================================
-- 11. COMMENTAIRES
-- =====================================================

COMMENT ON TABLE project_milestones IS 
  'Jalons de projet avec validation collaborative entre client et artisan';

COMMENT ON TABLE milestone_validation_history IS 
  'Historique complet des actions sur les jalons';

COMMENT ON FUNCTION propose_milestone IS 
  'Permet à un client ou artisan de proposer un changement de jalon';

COMMENT ON FUNCTION validate_milestone IS 
  'Permet à l''autre partie de valider ou rejeter un jalon proposé';

COMMENT ON FUNCTION get_project_milestones IS 
  'Récupère tous les jalons d''un projet avec les informations des utilisateurs';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================
