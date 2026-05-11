-- Créer une fonction SQL pour exécuter des commandes SQL
-- À exécuter directement dans le dashboard Supabase SQL Editor

-- Créer la fonction exec_sql si elle n'existe pas
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS TABLE(result json)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_record RECORD;
    result_json json;
BEGIN
    -- Exécuter la requête SQL dynamique
    FOR result_record IN EXECUTE sql_query LOOP
        -- Convertir le résultat en JSON
        result_json := row_to_json(result_record);
        RETURN NEXT;
    END LOOP;
    
    RETURN;
END;
$$;

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION exec_sql TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql TO service_role;

-- Créer une fonction plus simple pour les mises à jour de config
CREATE OR REPLACE FUNCTION update_auth_config()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Mettre à jour SITE_URL
    UPDATE auth.config 
    SET value = 'https://www.swipetonpro.fr' 
    WHERE key = 'SITE_URL';
    
    -- Mettre à jour URI_ALLOW_LIST
    UPDATE auth.config 
    SET value = 'https://www.swipetonpro.fr/auth/callback' 
    WHERE key = 'URI_ALLOW_LIST';
    
    -- Mettre à jour REDIRECT_URLS
    UPDATE auth.config 
    SET value = 'https://www.swipetonpro.fr/auth/reset-password' 
    WHERE key = 'REDIRECT_URLS';
    
    -- Insérer si n'existe pas
    INSERT INTO auth.config (key, value) 
    VALUES ('SITE_URL', 'https://www.swipetonpro.fr')
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
    
    INSERT INTO auth.config (key, value) 
    VALUES ('URI_ALLOW_LIST', 'https://www.swipetonpro.fr/auth/callback')
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
    
    INSERT INTO auth.config (key, value) 
    VALUES ('REDIRECT_URLS', 'https://www.swipetonpro.fr/auth/reset-password')
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
END;
$$;

-- Donner les permissions
GRANT EXECUTE ON FUNCTION update_auth_config TO authenticated;
GRANT EXECUTE ON FUNCTION update_auth_config TO service_role;
