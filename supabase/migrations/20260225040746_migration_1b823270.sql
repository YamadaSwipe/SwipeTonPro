-- Phase 1: Créer l'ENUM pour les types de travaux avec les nouveaux types
CREATE TYPE work_type AS ENUM (
  'renovation_complete',
  'plomberie',
  'electricite',
  'peinture',
  'carrelage',
  'maconnerie',
  'menuiserie',
  'isolation',
  'climatisation',
  'pompe_a_chaleur',
  'fenetres',
  'panneaux_solaires',
  'autre'
);

-- Phase 2: Ajouter colonnes manquantes à la table projects
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS work_types work_type[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS client_first_name text,
ADD COLUMN IF NOT EXISTS client_last_name text,
ADD COLUMN IF NOT EXISTS client_phone text,
ADD COLUMN IF NOT EXISTS client_email text,
ADD COLUMN IF NOT EXISTS property_address text,
ADD COLUMN IF NOT EXISTS property_type text,
ADD COLUMN IF NOT EXISTS property_surface numeric(10,2),
ADD COLUMN IF NOT EXISTS budget_min numeric(10,2),
ADD COLUMN IF NOT EXISTS budget_max numeric(10,2),
ADD COLUMN IF NOT EXISTS desired_deadline text,
ADD COLUMN IF NOT EXISTS required_certifications text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS photos_optional boolean DEFAULT false;

-- Phase 3: Ajouter colonnes certifications à la table professionals
ALTER TABLE professionals
ADD COLUMN IF NOT EXISTS certifications jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS has_qualibat boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_rge boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_eco_artisan boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_qualitenr boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_qualipv boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_qualipac boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_qualibois boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS other_certifications text[] DEFAULT '{}';

-- Phase 4: Créer les paramètres IA dans platform_settings
INSERT INTO platform_settings (setting_key, setting_value, description, category)
VALUES
  ('ai_estimation_enabled', 'true', 'Active/désactive l''estimation IA globalement', 'features'),
  ('ai_estimation_modes', '["text", "photo", "text_photo"]', 'Modes d''estimation disponibles: text, photo, text_photo', 'features'),
  ('ai_credit_threshold', '10', 'Seuil de crédits OpenAI avant désactivation auto', 'limits'),
  ('ai_current_credits', '100', 'Crédits OpenAI restants (estimatifs)', 'limits')
ON CONFLICT (setting_key) DO NOTHING;

COMMENT ON COLUMN projects.work_types IS 'Types de travaux sélectionnés par le client (multi-sélection)';
COMMENT ON COLUMN projects.required_certifications IS 'Certifications requises pour postuler au projet';
COMMENT ON COLUMN professionals.certifications IS 'Détails des certifications (numéros, dates expiration, etc.)';