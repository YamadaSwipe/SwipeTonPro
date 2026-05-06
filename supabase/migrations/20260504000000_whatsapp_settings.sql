-- Migration: Configuration WhatsApp
-- Crée la table pour stocker les paramètres WhatsApp (numéro, message, activation)

-- Table des paramètres de contact WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(20) NOT NULL DEFAULT '',
  default_message TEXT DEFAULT 'Bonjour, j''ai une question concernant Swipe Ton Pro.',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  "position" VARCHAR(20) NOT NULL DEFAULT 'bottom-right',
  show_on_mobile BOOLEAN NOT NULL DEFAULT true,
  show_on_desktop BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insérer la configuration par défaut
INSERT INTO whatsapp_settings (phone_number, default_message, is_enabled)
VALUES ('', 'Bonjour, j''ai une question concernant Swipe Ton Pro.', true)
ON CONFLICT DO NOTHING;

-- Politique RLS: lecture publique
CREATE POLICY "whatsapp_settings_public_read" 
ON whatsapp_settings FOR SELECT 
TO public 
USING (true);

-- Politique RLS: modification uniquement admin
CREATE POLICY "whatsapp_settings_admin_write" 
ON whatsapp_settings FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Fonction pour récupérer les paramètres WhatsApp actifs
CREATE OR REPLACE FUNCTION get_whatsapp_settings()
RETURNS TABLE (
  phone_number VARCHAR(20),
  default_message TEXT,
  is_enabled BOOLEAN,
  "position" VARCHAR(20),
  show_on_mobile BOOLEAN,
  show_on_desktop BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    phone_number,
    default_message,
    is_enabled,
    "position",
    show_on_mobile,
    show_on_desktop
  FROM whatsapp_settings
  ORDER BY created_at DESC
  LIMIT 1;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION get_whatsapp_settings() TO public;

COMMENT ON TABLE whatsapp_settings IS 'Configuration du bouton WhatsApp (numéro, message, position)';
