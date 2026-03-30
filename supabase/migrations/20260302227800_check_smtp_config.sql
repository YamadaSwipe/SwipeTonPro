-- Vérification de la configuration SMTP actuelle
-- Date: 2026-03-02

-- Vérifier les variables d'environnement SMTP
SELECT 
  'SMTP_HOST' as variable,
  COALESCE(current_setting('smtp_host'), 'NON DÉFINI') as valeur
UNION ALL
SELECT 
  'SMTP_PORT' as variable,
  COALESCE(current_setting('smtp_port'), 'NON DÉFINI') as valeur
UNION ALL
SELECT 
  'SMTP_USER' as variable,
  COALESCE(current_setting('smtp_user'), 'NON DÉFINI') as valeur
UNION ALL
SELECT 
  'SMTP_PASS' as variable,
  COALESCE(current_setting('smtp_pass'), 'NON DÉFINI') as valeur;

-- Afficher les variables système (si définies en dur)
DO $$
BEGIN
  RAISE NOTICE '=== VÉRIFICATION DES VARIABLES D''ENVIRONNEMENT ===';
  IF EXISTS (SELECT 1 FROM pg_settings WHERE name = 'smtp_host') THEN
    RAISE NOTICE 'smtp_host: DÉFINI dans pg_settings';
  ELSE
    RAISE NOTICE 'smtp_host: NON DÉFINI';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_settings WHERE name = 'smtp_port') THEN
    RAISE NOTICE 'smtp_port: DÉFINI dans pg_settings';
  ELSE
    RAISE NOTICE 'smtp_port: NON DÉFINI';
  END IF;
END $$;
