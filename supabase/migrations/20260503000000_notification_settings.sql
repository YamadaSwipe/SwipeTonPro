-- Migration: Configuration des notifications admin pour les inscriptions
-- Permet à l'admin de choisir qui reçoit les notifications et de personnaliser les messages

-- ============================================
-- 1. TABLE: notification_settings
-- ============================================
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Type de notification
  notification_type VARCHAR(50) NOT NULL, -- 'pro_signup', 'client_signup', 'match_created', etc.
  
  -- Destinataires (JSON array)
  recipients JSONB NOT NULL DEFAULT '["admin"]'::jsonb,
  -- Valeurs possibles: "admin", "support", "team", ou emails spécifiques
  
  -- Activation
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- Message personnalisé
  subject_template VARCHAR(255) DEFAULT NULL, -- Sujet personnalisé, NULL = défaut
  message_template TEXT DEFAULT NULL, -- Corps HTML personnalisé, NULL = défaut
  
  -- Métadonnées
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Contrainte unique sur le type
  CONSTRAINT unique_notification_type UNIQUE (notification_type)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_notification_settings_type ON notification_settings(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_settings_enabled ON notification_settings(is_enabled);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notification_settings_updated_at ON notification_settings;
CREATE TRIGGER trigger_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_settings_updated_at();

-- ============================================
-- 2. RLS POLICIES
-- ============================================
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Admin full access
DROP POLICY IF EXISTS admin_full_access_notification_settings ON notification_settings;
CREATE POLICY admin_full_access_notification_settings
  ON notification_settings
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Policy: Read-only for authenticated users (lecture seule pour affichage dans admin)
DROP POLICY IF EXISTS read_notification_settings ON notification_settings;
CREATE POLICY read_notification_settings
  ON notification_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- 3. DONNÉES PAR DÉFAUT
-- ============================================

-- Notification inscription Pro
INSERT INTO notification_settings (notification_type, recipients, is_enabled, subject_template, message_template, description)
VALUES (
  'pro_signup',
  '["admin", "support", "team"]'::jsonb,
  true,
  null,
  null,
  'Notification envoyée lorsqu''un professionnel s''inscrit'
)
ON CONFLICT (notification_type) DO UPDATE SET
  recipients = EXCLUDED.recipients,
  is_enabled = EXCLUDED.is_enabled,
  description = EXCLUDED.description;

-- Notification inscription Client
INSERT INTO notification_settings (notification_type, recipients, is_enabled, subject_template, message_template, description)
VALUES (
  'client_signup',
  '["admin", "support"]'::jsonb,
  true,
  null,
  null,
  'Notification envoyée lorsqu''un particulier s''inscrit'
)
ON CONFLICT (notification_type) DO UPDATE SET
  recipients = EXCLUDED.recipients,
  is_enabled = EXCLUDED.is_enabled,
  description = EXCLUDED.description;

-- ============================================
-- 4. TABLE: welcome_messages
-- ============================================
CREATE TABLE IF NOT EXISTS welcome_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Type de message
  message_type VARCHAR(50) NOT NULL, -- 'pro', 'client'
  
  -- Contenu
  subject VARCHAR(255) NOT NULL,
  html_content TEXT NOT NULL,
  
  -- Variables disponibles (documentation)
  available_variables JSONB DEFAULT '[]'::jsonb,
  
  -- Activation
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Langue
  language VARCHAR(10) DEFAULT 'fr',
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index
CREATE UNIQUE INDEX IF NOT EXISTS idx_welcome_messages_type_lang ON welcome_messages(message_type, language) WHERE is_active = true;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS trigger_welcome_messages_updated_at ON welcome_messages;
CREATE TRIGGER trigger_welcome_messages_updated_at
  BEFORE UPDATE ON welcome_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_settings_updated_at();

-- RLS
ALTER TABLE welcome_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_full_access_welcome_messages ON welcome_messages;
CREATE POLICY admin_full_access_welcome_messages
  ON welcome_messages
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- ============================================
-- 5. MESSAGES PAR DÉFAUT
-- ============================================

-- Message de bienvenue Pro
INSERT INTO welcome_messages (message_type, subject, html_content, available_variables, language)
VALUES (
  'pro',
  '🎉 Bienvenue sur SwipeTonPro !',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h1 style="color: #f97316;">Bienvenue {{firstName}} !</h1>
    <p>Votre compte professionnel SwipeTonPro est maintenant actif.</p>
    <p><strong>Prochaines étapes :</strong></p>
    <ul>
      <li>Complétez votre profil</li>
      <li>Ajoutez vos réalisations au portfolio</li>
      <li>Configurez vos disponibilités</li>
    </ul>
    <p>À très bientôt,<br>L''équipe SwipeTonPro</p>
  </div>',
  '["firstName", "lastName", "email", "companyName", "siret", "dashboardUrl"]'::jsonb,
  'fr'
)
ON CONFLICT DO NOTHING;

-- Message de bienvenue Client
INSERT INTO welcome_messages (message_type, subject, html_content, available_variables, language)
VALUES (
  'client',
  '🎉 Bienvenue chez SwipeTonPro !',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h1 style="color: #f97316;">Bienvenue {{firstName}} !</h1>
    <p>Nous sommes ravis de vous compter parmi nos membres.</p>
    <p><strong>Prêt à démarrer votre projet ?</strong></p>
    <ul>
      <li>Faites votre diagnostic personnalisé</li>
      <li>Recevez des devis gratuits</li>
      <li>Comparez les professionnels</li>
    </ul>
    <p>À très bientôt,<br>L''équipe SwipeTonPro</p>
  </div>',
  '["firstName", "lastName", "email", "diagnosticUrl"]'::jsonb,
  'fr'
)
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. FONCTION UTILITAIRE: get_notification_recipients
-- ============================================
CREATE OR REPLACE FUNCTION get_notification_recipients(p_notification_type VARCHAR)
RETURNS TABLE (email VARCHAR, role VARCHAR) AS $$
DECLARE
  v_recipients JSONB;
  v_recipient TEXT;
BEGIN
  -- Récupérer les destinataires configurés
  SELECT ns.recipients INTO v_recipients
  FROM notification_settings ns
  WHERE ns.notification_type = p_notification_type
    AND ns.is_enabled = true;
  
  -- Si pas de configuration, retourner admin par défaut
  IF v_recipients IS NULL THEN
    RETURN QUERY SELECT 'admin@swipetonpro.fr'::VARCHAR, 'admin'::VARCHAR;
    RETURN;
  END IF;
  
  -- Retourner les emails selon les rôles configurés
  FOR v_recipient IN SELECT jsonb_array_elements_text(v_recipients)
  LOOP
    CASE v_recipient
      WHEN 'admin' THEN RETURN QUERY SELECT 'admin@swipetonpro.fr'::VARCHAR, 'admin'::VARCHAR;
      WHEN 'support' THEN RETURN QUERY SELECT 'support@swipetonpro.fr'::VARCHAR, 'support'::VARCHAR;
      WHEN 'team' THEN RETURN QUERY SELECT 'team@swipetonpro.fr'::VARCHAR, 'team'::VARCHAR;
      ELSE RETURN QUERY SELECT v_recipient::VARCHAR, 'custom'::VARCHAR;
    END CASE;
  END LOOP;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 7. FONCTION: get_welcome_message
-- ============================================
CREATE OR REPLACE FUNCTION get_welcome_message(
  p_message_type VARCHAR,
  p_language VARCHAR DEFAULT 'fr'
)
RETURNS TABLE (subject VARCHAR, html_content TEXT, available_variables JSONB) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wm.subject,
    wm.html_content,
    wm.available_variables
  FROM welcome_messages wm
  WHERE wm.message_type = p_message_type
    AND wm.language = p_language
    AND wm.is_active = true
  ORDER BY wm.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Commentaire pour documentation
COMMENT ON TABLE notification_settings IS 'Configuration des notifications envoyées aux équipes internes';
COMMENT ON TABLE welcome_messages IS 'Messages de bienvenue personnalisables envoyés aux nouveaux utilisateurs';
