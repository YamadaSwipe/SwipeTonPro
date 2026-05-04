-- =====================================================
-- Migration: Architecture BTP - Tables Core
-- =====================================================

-- =====================================================
-- TABLE: app_settings - Configuration Key/Value
-- =====================================================
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general', -- general, quotas, pricing, features
  is_editable BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Valeurs par défaut pour les quotas
INSERT INTO app_settings (setting_key, setting_value, description, category) VALUES
('max_pro_estimates_daily', '{"value": 5}', 'Nombre max d''estimations gratuites par pro/24h', 'quotas'),
('max_user_estimates_per_project', '{"value": 3}', 'Nombre max de réponses pour un projet estimation', 'quotas'),
('max_client_estimates_weekly', '{"value": 2}', 'Nombre max d''estimations par client/semaine', 'quotas'),
('anonymous_message_limit', '{"value": 3}', 'Nombre de messages anonymes avant déblocage', 'quotas'),
('stripe_escrow_enabled', '{"enabled": true}', 'Activation du séquestre Stripe', 'features'),
('ai_qualification_enabled', '{"enabled": true}', 'Activation de la qualification IA', 'features')
ON CONFLICT (setting_key) DO NOTHING;

-- =====================================================
-- TABLE: matching_fees - Paliers de frais de mise en relation
-- =====================================================
CREATE TABLE IF NOT EXISTS matching_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  min_project_value INTEGER NOT NULL, -- en centimes
  max_project_value INTEGER NOT NULL,   -- en centimes
  fee_amount INTEGER NOT NULL,          -- en centimes
  fee_percentage DECIMAL(5,2),          -- pourcentage alternatif
  fee_type TEXT DEFAULT 'fixed' CHECK (fee_type IN ('fixed', 'percentage')),
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,           -- Ordre d'application
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Paliers par défaut
INSERT INTO matching_fees (min_project_value, max_project_value, fee_amount, fee_type, priority) VALUES
(0, 500000, 1500, 'fixed', 1),        -- 0-5000€ : 15€
(500001, 1000000, 2500, 'fixed', 2),  -- 5000-10000€ : 25€
(1000001, 2000000, 4000, 'fixed', 3), -- 10000-20000€ : 40€
(2000001, 5000000, 7500, 'fixed', 4), -- 20000-50000€ : 75€
(5000001, 999999999, 15000, 'fixed', 5) -- >50000€ : 150€
ON CONFLICT DO NOTHING;

-- =====================================================
-- TABLE: pro_profiles - Extension de professionals avec vérification
-- =====================================================
CREATE TABLE IF NOT EXISTS pro_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  
  -- Documents de vérification
  kbis_url TEXT,
  kbis_verified BOOLEAN DEFAULT false,
  insurance_url TEXT,
  insurance_verified BOOLEAN DEFAULT false,
  identity_url TEXT,
  identity_verified BOOLEAN DEFAULT false,
  
  -- Statut de vérification global
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended')),
  verification_notes TEXT,
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Statistiques
  daily_estimates_count INTEGER DEFAULT 0,
  last_estimate_date TIMESTAMP WITH TIME ZONE,
  total_matches INTEGER DEFAULT 0,
  completed_projects INTEGER DEFAULT 0,
  
  -- Préférences
  specialties TEXT[], -- ['Plomberie', 'Électricité']
  work_radius INTEGER DEFAULT 50, -- km
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(professional_id)
);

-- Créer les profils pro pour les pros existants
INSERT INTO pro_profiles (professional_id)
SELECT id FROM professionals
WHERE NOT EXISTS (
  SELECT 1 FROM pro_profiles WHERE pro_profiles.professional_id = professionals.id
);

-- =====================================================
-- MISE À JOUR TABLE: projects
-- =====================================================

-- Ajouter les nouvelles colonnes si elles n'existent pas
DO $$
BEGIN
  -- Type de projet
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'project_type') THEN
    ALTER TABLE projects ADD COLUMN project_type TEXT DEFAULT 'estimation' CHECK (project_type IN ('estimation', 'firm_project'));
  END IF;
  
  -- Badge Stripe escrow
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'stripe_escrow_active') THEN
    ALTER TABLE projects ADD COLUMN stripe_escrow_active BOOLEAN DEFAULT false;
  END IF;
  
  -- Estimation IA
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'ai_price_estimate') THEN
    ALTER TABLE projects ADD COLUMN ai_price_estimate JSONB;
  END IF;
  
  -- Statut d'estimation
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'estimation_status') THEN
    ALTER TABLE projects ADD COLUMN estimation_status TEXT DEFAULT 'open' CHECK (estimation_status IN ('open', 'completed', 'expired', 'converted'));
  END IF;
  
  -- Compteur de réponses
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'estimation_responses_count') THEN
    ALTER TABLE projects ADD COLUMN estimation_responses_count INTEGER DEFAULT 0;
  END IF;
  
  -- Date de conversion
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'converted_at') THEN
    ALTER TABLE projects ADD COLUMN converted_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- ID du projet parent (pour les conversions)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'parent_project_id') THEN
    ALTER TABLE projects ADD COLUMN parent_project_id UUID REFERENCES projects(id);
  END IF;
END $$;

-- =====================================================
-- TABLE: project_milestones - Étapes de paiement Stripe
-- =====================================================
CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Informations milestone
  milestone_name TEXT NOT NULL, -- 'Acompte', 'Étape 1', 'Finition'
  milestone_order INTEGER NOT NULL, -- 1, 2, 3
  percentage INTEGER NOT NULL, -- 30, 40, 30
  amount INTEGER NOT NULL, -- en centimes
  
  -- Statut
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'disputed')),
  
  -- Stripe
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,
  
  -- Validation
  pro_validation_photos TEXT[], -- URLs des photos de fin d'étape
  pro_validation_notes TEXT,
  pro_validated_at TIMESTAMP WITH TIME ZONE,
  
  client_validation_status TEXT DEFAULT 'pending' CHECK (client_validation_status IN ('pending', 'approved', 'rejected', 'disputed')),
  client_validation_notes TEXT,
  client_validated_at TIMESTAMP WITH TIME ZONE,
  
  -- Dates
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE: anonymous_messages - Messages avec limite et modération
-- =====================================================
CREATE TABLE IF NOT EXISTS anonymous_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES match_payments(id) ON DELETE CASCADE,
  
  sender_type TEXT NOT NULL CHECK (sender_type IN ('professional', 'client')),
  sender_id UUID NOT NULL,
  
  -- Contenu
  content TEXT NOT NULL,
  message_number INTEGER NOT NULL, -- 1, 2, 3
  
  -- Modération
  moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'blocked', 'flagged')),
  moderation_reason TEXT, -- 'phone_detected', 'email_detected', 'inappropriate'
  contains_contact_info BOOLEAN DEFAULT false,
  blocked_patterns TEXT[], -- ['phone', 'email']
  
  -- Métadonnées
  is_anonymous BOOLEAN DEFAULT true,
  revealed_at TIMESTAMP WITH TIME ZONE, -- Date de déblocage des coordonnées
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE: moderation_logs - Historique des messages bloqués
-- =====================================================
CREATE TABLE IF NOT EXISTS moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES anonymous_messages(id) ON DELETE CASCADE,
  
  -- Détails du blocage
  blocked_pattern TEXT NOT NULL, -- 'phone', 'email', 'website'
  detected_content TEXT NOT NULL, -- Le contenu détecté
  confidence_score DECIMAL(3,2), -- 0.95
  
  -- Contexte
  user_id UUID NOT NULL,
  match_id UUID NOT NULL,
  
  -- Action
  action_taken TEXT DEFAULT 'blocked' CHECK (action_taken IN ('blocked', 'flagged', 'allowed')),
  moderator_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Index pour app_settings
CREATE INDEX IF NOT EXISTS idx_app_settings_category ON app_settings(category);
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(setting_key);

-- Index pour matching_fees
CREATE INDEX IF NOT EXISTS idx_matching_fees_active ON matching_fees(is_active);
CREATE INDEX IF NOT EXISTS idx_matching_fees_range ON matching_fees(min_project_value, max_project_value);

-- Index pour pro_profiles
CREATE INDEX IF NOT EXISTS idx_pro_profiles_status ON pro_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_pro_profiles_professional ON pro_profiles(professional_id);
CREATE INDEX IF NOT EXISTS idx_pro_profiles_specialties ON pro_profiles USING GIN(specialties);

-- Index pour projects
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(project_type);
CREATE INDEX IF NOT EXISTS idx_projects_estimation_status ON projects(estimation_status);
CREATE INDEX IF NOT EXISTS idx_projects_stripe_escrow ON projects(stripe_escrow_active);
CREATE INDEX IF NOT EXISTS idx_projects_parent ON projects(parent_project_id);

-- Index pour project_milestones
CREATE INDEX IF NOT EXISTS idx_milestones_project ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON project_milestones(status);
CREATE INDEX IF NOT EXISTS idx_milestones_order ON project_milestones(project_id, milestone_order);

-- Index pour anonymous_messages
CREATE INDEX IF NOT EXISTS idx_messages_match ON anonymous_messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON anonymous_messages(sender_type, sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON anonymous_messages(moderation_status);
CREATE INDEX IF NOT EXISTS idx_messages_contact ON anonymous_messages(contains_contact_info);

-- Index pour moderation_logs
CREATE INDEX IF NOT EXISTS idx_moderation_logs_user ON moderation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_pattern ON moderation_logs(blocked_pattern);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_date ON moderation_logs(created_at);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger aux tables pertinentes
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matching_fees_updated_at BEFORE UPDATE ON matching_fees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pro_profiles_updated_at BEFORE UPDATE ON pro_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_milestones_updated_at BEFORE UPDATE ON project_milestones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour récupérer un paramètre d'application
CREATE OR REPLACE FUNCTION get_app_setting(p_key TEXT)
RETURNS JSONB AS $$
BEGIN
    RETURN (
        SELECT setting_value 
        FROM app_settings 
        WHERE setting_key = p_key
    );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer les frais de mise en relation
CREATE OR REPLACE FUNCTION calculate_matching_fee(p_project_value INTEGER)
RETURNS INTEGER AS $$
DECLARE
    v_fee INTEGER;
BEGIN
    SELECT fee_amount INTO v_fee
    FROM matching_fees
    WHERE is_active = true
      AND p_project_value >= min_project_value
      AND p_project_value <= max_project_value
    ORDER BY priority ASC
    LIMIT 1;
    
    IF v_fee IS NULL THEN
        -- Frais par défaut si aucun palier trouvé
        v_fee := 1500; -- 15€
    END IF;
    
    RETURN v_fee;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTAIRES
-- =====================================================
COMMENT ON TABLE app_settings IS 'Configuration de l''application (Key/Value)';
COMMENT ON TABLE matching_fees IS 'Paliers de frais de mise en relation';
COMMENT ON TABLE pro_profiles IS 'Extension des profils professionnels avec vérification';
COMMENT ON TABLE project_milestones IS 'Étapes de paiement et validation des projets';
COMMENT ON TABLE anonymous_messages IS 'Messages anonymes avec modération automatique';
COMMENT ON TABLE moderation_logs IS 'Historique de la modération des messages';
