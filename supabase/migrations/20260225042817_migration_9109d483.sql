-- 1. Ajouter le rayon d'intervention
ALTER TABLE professionals 
ADD COLUMN IF NOT EXISTS coverage_radius integer DEFAULT 50; -- Rayon par défaut 50km

-- 2. Index pour la recherche géographique (nécessite extension postgis idéalement, mais on fera un calcul simple lat/lon)
-- On va ajouter lat/lon aux projets et profils pour le calcul de distance
ALTER TABLE projects ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS longitude double precision;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longitude double precision;

-- 3. Fonction de calcul de distance (Haversine simple)
CREATE OR REPLACE FUNCTION calculate_distance(lat1 float, lon1 float, lat2 float, lon2 float)
RETURNS float
LANGUAGE plpgsql
AS $$
DECLARE
    R float := 6371; -- Rayon de la Terre en km
    dLat float;
    dLon float;
    a float;
    c float;
BEGIN
    IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
        RETURN 999999;
    END IF;

    dLat := radians(lat2 - lat1);
    dLon := radians(lon2 - lon1);
    a := sin(dLat/2) * sin(dLat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dLon/2) * sin(dLon/2);
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    RETURN R * c;
END;
$$;