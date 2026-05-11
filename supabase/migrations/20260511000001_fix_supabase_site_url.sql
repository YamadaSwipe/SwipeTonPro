-- Migration pour configurer l'URL du site Supabase
-- Cette migration corrige les liens de réinitialisation de mot de passe

-- Mettre à jour la configuration du site dans auth.config
-- Cela force Supabase à utiliser le domaine de production pour les liens de réinitialisation
UPDATE auth.config 
SET value = 'https://www.swipetonpro.fr'
WHERE key = 'SITE_URL';

-- Mettre à jour les URLs de redirection pour s'assurer qu'elles pointent vers le domaine de production
UPDATE auth.config 
SET value = 'https://www.swipetonpro.fr/auth/callback'
WHERE key = 'URI_ALLOW_LIST';

-- Mettre à jour les URLs de redirection pour les emails de réinitialisation
UPDATE auth.config 
SET value = 'https://www.swipetonpro.fr/auth/reset-password'
WHERE key = 'REDIRECT_URLS';

-- Insérer les configurations si elles n'existent pas déjà
INSERT INTO auth.config (key, value) 
VALUES 
  ('SITE_URL', 'https://www.swipetonpro.fr'),
  ('URI_ALLOW_LIST', 'https://www.swipetonpro.fr/auth/callback'),
  ('REDIRECT_URLS', 'https://www.swipetonpro.fr/auth/reset-password')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value;

-- Commentaire explicatif
COMMENT ON TABLE auth.config IS 'Configuration Supabase pour les URLs de redirection et réinitialisation';
COMMENT ON COLUMN auth.config.key IS 'Clé de configuration (SITE_URL, URI_ALLOW_LIST, REDIRECT_URLS)';
COMMENT ON COLUMN auth.config.value IS 'Valeur de l''URL - doit être le domaine de production';
