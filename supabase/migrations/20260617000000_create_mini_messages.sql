-- =====================================================
-- MIGRATION: Système de Mini-Messages Pré-Match
-- =====================================================
-- Description: Implémente un système de messagerie limitée avant le matching
-- - 3 messages maximum par utilisateur (particulier et professionnel)
-- - 100 caractères maximum par message
-- - Détection et blocage des numéros de téléphone
-- - Sécurité contre le contournement du matching
-- =====================================================

-- Table pour les mini-messages pré-match
CREATE TABLE IF NOT EXISTS mini_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Contenu du message
  content TEXT NOT NULL CHECK (char_length(content) <= 100),
  
  -- Métadonnées
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'professional')),
  message_number INTEGER NOT NULL CHECK (message_number BETWEEN 1 AND 3),
  
  -- Modération et sécurité
  contains_digits BOOLEAN DEFAULT FALSE,
  moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'flagged', 'blocked')),
  blocked_reason TEXT,
  
  -- Statut du matching
  is_pre_match BOOLEAN DEFAULT TRUE,
  revealed_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contraintes uniques
  UNIQUE(project_id, professional_id, sender_type, message_number)
);

-- Index pour les performances
CREATE INDEX idx_mini_messages_project_id ON mini_messages(project_id);
CREATE INDEX idx_mini_messages_professional_id ON mini_messages(professional_id);
CREATE INDEX idx_mini_messages_sender_id ON mini_messages(sender_id);
CREATE INDEX idx_mini_messages_moderation ON mini_messages(moderation_status) WHERE moderation_status IN ('flagged', 'blocked');
CREATE INDEX idx_mini_messages_pre_match ON mini_messages(project_id, professional_id) WHERE is_pre_match = TRUE;

-- Fonction de validation stricte des messages
CREATE OR REPLACE FUNCTION validate_mini_message()
RETURNS TRIGGER AS $$
DECLARE
  existing_count INTEGER;
  total_chars INTEGER;
  has_numbers BOOLEAN;
BEGIN
  -- 1. Vérifier la longueur du message individuel
  IF char_length(NEW.content) > 100 THEN
    RAISE EXCEPTION 'Le message ne peut pas dépasser 100 caractères (actuellement: %)', char_length(NEW.content);
  END IF;
  
  -- 2. Vérifier la limite de 3 messages par utilisateur
  SELECT COUNT(*) INTO existing_count
  FROM mini_messages
  WHERE project_id = NEW.project_id
    AND professional_id = NEW.professional_id
    AND sender_type = NEW.sender_type
    AND is_pre_match = TRUE;
  
  IF existing_count >= 3 THEN
    RAISE EXCEPTION 'Limite de 3 messages pré-match atteinte. Veuillez procéder au matching pour continuer la conversation.';
  END IF;
  
  -- 3. Vérifier le total de caractères pour les 3 messages (100 max au total)
  SELECT COALESCE(SUM(char_length(content)), 0) INTO total_chars
  FROM mini_messages
  WHERE project_id = NEW.project_id
    AND professional_id = NEW.professional_id
    AND sender_type = NEW.sender_type
    AND is_pre_match = TRUE;
  
  IF (total_chars + char_length(NEW.content)) > 100 THEN
    RAISE EXCEPTION 'Limite totale de 100 caractères atteinte pour les 3 messages (actuellement: % + % = %/100)', 
      total_chars, char_length(NEW.content), (total_chars + char_length(NEW.content));
  END IF;
  
  -- 4. Détecter les chiffres (potentiels numéros de téléphone)
  has_numbers := NEW.content ~ '\d{2,}';
  NEW.contains_digits := has_numbers;
  
  -- 5. Bloquer si détection de numéros suspects
  IF NEW.content ~ '0[1-9][\s\.\-]?\d{2}[\s\.\-]?\d{2}[\s\.\-]?\d{2}[\s\.\-]?\d{2}' OR  -- Téléphone FR
     NEW.content ~ '\+33[\s\.\-]?[1-9][\s\.\-]?\d{2}[\s\.\-]?\d{2}[\s\.\-]?\d{2}[\s\.\-]?\d{2}' OR  -- Mobile FR international
     NEW.content ~ '\d{10,}' OR  -- Suite de 10 chiffres ou plus
     NEW.content ~ '@' OR  -- Email
     NEW.content ~ 'whatsapp|telegram|signal|viber|messenger' THEN
    
    NEW.moderation_status := 'blocked';
    NEW.blocked_reason := 'Coordonnées détectées - Veuillez utiliser uniquement la plateforme pour communiquer';
    
    RAISE EXCEPTION 'Message bloqué: %. Les échanges de coordonnées avant le matching sont interdits pour votre sécurité.', NEW.blocked_reason;
  END IF;
  
  -- 6. Flaguer si contient des chiffres (pour révision)
  IF has_numbers THEN
    NEW.moderation_status := 'flagged';
  ELSE
    NEW.moderation_status := 'approved';
  END IF;
  
  -- 7. Définir le numéro de message
  NEW.message_number := existing_count + 1;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger de validation
DROP TRIGGER IF EXISTS validate_mini_message_trigger ON mini_messages;
CREATE TRIGGER validate_mini_message_trigger
  BEFORE INSERT ON mini_messages
  FOR EACH ROW
  EXECUTE FUNCTION validate_mini_message();

-- Fonction pour révéler les messages après matching
CREATE OR REPLACE FUNCTION reveal_mini_messages(
  p_project_id UUID,
  p_professional_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE mini_messages
  SET 
    is_pre_match = FALSE,
    revealed_at = NOW(),
    updated_at = NOW()
  WHERE project_id = p_project_id
    AND professional_id = p_professional_id
    AND is_pre_match = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir le nombre de messages restants
CREATE OR REPLACE FUNCTION get_remaining_mini_messages(
  p_project_id UUID,
  p_professional_id UUID,
  p_sender_type TEXT
)
RETURNS INTEGER AS $$
DECLARE
  message_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO message_count
  FROM mini_messages
  WHERE project_id = p_project_id
    AND professional_id = p_professional_id
    AND sender_type = p_sender_type
    AND is_pre_match = TRUE;
  
  RETURN GREATEST(0, 3 - message_count);
END;
$$ LANGUAGE plpgsql;

-- Vue pour les statistiques de modération
CREATE OR REPLACE VIEW mini_messages_moderation_stats AS
SELECT 
  moderation_status,
  COUNT(*) as total_messages,
  COUNT(DISTINCT project_id) as unique_projects,
  COUNT(DISTINCT professional_id) as unique_professionals,
  AVG(char_length(content)) as avg_message_length,
  SUM(CASE WHEN contains_digits THEN 1 ELSE 0 END) as messages_with_digits
FROM mini_messages
WHERE is_pre_match = TRUE
GROUP BY moderation_status;

-- Politiques RLS (Row Level Security)
ALTER TABLE mini_messages ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres messages
CREATE POLICY "Users can view their own mini messages"
  ON mini_messages
  FOR SELECT
  USING (
    sender_id = auth.uid() OR
    -- Le client peut voir les messages de son projet
    project_id IN (
      SELECT id FROM projects WHERE client_id = auth.uid()
    ) OR
    -- Le professionnel peut voir les messages où il est impliqué
    professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  );

-- Les utilisateurs peuvent insérer leurs propres messages
CREATE POLICY "Users can insert their own mini messages"
  ON mini_messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    (
      -- Le client peut envoyer des messages pour ses projets
      (sender_type = 'client' AND project_id IN (
        SELECT id FROM projects WHERE client_id = auth.uid()
      )) OR
      -- Le professionnel peut envoyer des messages pour ses projets
      (sender_type = 'professional' AND professional_id IN (
        SELECT id FROM professionals WHERE user_id = auth.uid()
      ))
    )
  );

-- Les admins peuvent tout voir et modifier
CREATE POLICY "Admins can manage all mini messages"
  ON mini_messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_mini_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_mini_messages_updated_at_trigger ON mini_messages;
CREATE TRIGGER update_mini_messages_updated_at_trigger
  BEFORE UPDATE ON mini_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_mini_messages_updated_at();

-- Commentaires pour la documentation
COMMENT ON TABLE mini_messages IS 'Messages limités pré-match (3 max, 100 caractères) pour amorcer le contact avant le matching payant';
COMMENT ON COLUMN mini_messages.content IS 'Contenu du message (100 caractères maximum)';
COMMENT ON COLUMN mini_messages.message_number IS 'Numéro du message (1, 2 ou 3)';
COMMENT ON COLUMN mini_messages.contains_digits IS 'Indique si le message contient des chiffres (potentiel numéro)';
COMMENT ON COLUMN mini_messages.moderation_status IS 'Statut de modération: pending, approved, flagged, blocked';
COMMENT ON COLUMN mini_messages.is_pre_match IS 'TRUE si avant le matching, FALSE après révélation';
COMMENT ON FUNCTION validate_mini_message() IS 'Valide les messages: longueur, limite, détection de coordonnées';
COMMENT ON FUNCTION reveal_mini_messages(UUID, UUID) IS 'Révèle les messages après un matching réussi';
COMMENT ON FUNCTION get_remaining_mini_messages(UUID, UUID, TEXT) IS 'Retourne le nombre de messages restants (0-3)';

-- Insertion de paramètres de configuration (sans ON CONFLICT)
DO $$
BEGIN
  -- Insérer uniquement si les paramètres n'existent pas déjà
  IF NOT EXISTS (SELECT 1 FROM platform_settings WHERE setting_key = 'mini_messages_max_count') THEN
    INSERT INTO platform_settings (setting_key, category, setting_value, description, is_active)
    VALUES ('mini_messages_max_count', 'messaging', '3', 'Nombre maximum de mini-messages pré-match par utilisateur', TRUE);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM platform_settings WHERE setting_key = 'mini_messages_max_length') THEN
    INSERT INTO platform_settings (setting_key, category, setting_value, description, is_active)
    VALUES ('mini_messages_max_length', 'messaging', '100', 'Longueur maximum totale pour les 3 mini-messages', TRUE);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM platform_settings WHERE setting_key = 'mini_messages_moderation_enabled') THEN
    INSERT INTO platform_settings (setting_key, category, setting_value, description, is_active)
    VALUES ('mini_messages_moderation_enabled', 'messaging', 'true', 'Active la modération automatique des mini-messages', TRUE);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM platform_settings WHERE setting_key = 'mini_messages_block_digits') THEN
    INSERT INTO platform_settings (setting_key, category, setting_value, description, is_active)
    VALUES ('mini_messages_block_digits', 'messaging', 'true', 'Bloque les messages contenant des numéros de téléphone', TRUE);
  END IF;
  
  RAISE NOTICE '✅ Paramètres de configuration insérés';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Erreur lors de l''insertion des paramètres (peut-être déjà existants): %', SQLERRM;
END $$;

-- Message de succès
DO $$
BEGIN
  RAISE NOTICE '✅ Migration mini-messages créée avec succès';
  RAISE NOTICE '📝 Table: mini_messages';
  RAISE NOTICE '🔒 Sécurité: Validation stricte + RLS activé';
  RAISE NOTICE '📊 Limites: 3 messages max, 100 caractères TOTAL, pas de chiffres';
END $$;
