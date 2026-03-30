-- Autoriser la lecture publique des paramètres actifs SANS condition restrictive complexe
DROP POLICY IF EXISTS "Anyone can view active settings" ON platform_settings;

CREATE POLICY "Anyone can view active settings" 
ON platform_settings FOR SELECT 
USING (is_active = true);