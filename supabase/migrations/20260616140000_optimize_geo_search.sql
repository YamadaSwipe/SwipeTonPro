-- ========================================
-- Optimisation de la recherche géographique
-- Amélioration des performances avec PostGIS
-- ========================================

-- 1. Activer l'extension PostGIS si disponible
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Ajouter des colonnes géométriques pour une meilleure performance
-- Vérifier si les colonnes existent déjà avant de les ajouter
DO $$ 
BEGIN
    -- Ajouter une colonne geometry pour les profiles si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'location_point'
    ) THEN
        ALTER TABLE profiles ADD COLUMN location_point GEOGRAPHY(POINT, 4326);
    END IF;

    -- Ajouter une colonne geometry pour les projects si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'location_point'
    ) THEN
        ALTER TABLE projects ADD COLUMN location_point GEOGRAPHY(POINT, 4326);
    END IF;
END $$;

-- 3. Mettre à jour les points géographiques existants
-- Pour les profiles
UPDATE profiles 
SET location_point = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE latitude IS NOT NULL 
  AND longitude IS NOT NULL 
  AND location_point IS NULL;

-- Pour les projects
UPDATE projects 
SET location_point = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE latitude IS NOT NULL 
  AND longitude IS NOT NULL 
  AND location_point IS NULL;

-- 4. Créer des index spatiaux pour améliorer les performances
DROP INDEX IF EXISTS idx_profiles_location_point;
CREATE INDEX idx_profiles_location_point ON profiles USING GIST(location_point);

DROP INDEX IF EXISTS idx_projects_location_point;
CREATE INDEX idx_projects_location_point ON projects USING GIST(location_point);

-- 5. Créer des index sur les colonnes latitude/longitude pour le fallback
CREATE INDEX IF NOT EXISTS idx_profiles_lat_lon ON profiles(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_lat_lon ON projects(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- 6. Fonction optimisée pour trouver les professionnels à proximité d'un projet
CREATE OR REPLACE FUNCTION find_nearby_professionals(
    p_project_id UUID,
    p_max_distance_km FLOAT DEFAULT 50,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    professional_id UUID,
    user_id UUID,
    company_name TEXT,
    distance_km FLOAT,
    within_coverage BOOLEAN,
    score INTEGER
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_project_location GEOGRAPHY;
    v_project_lat FLOAT;
    v_project_lon FLOAT;
BEGIN
    -- Récupérer la localisation du projet
    SELECT location_point, latitude, longitude
    INTO v_project_location, v_project_lat, v_project_lon
    FROM projects
    WHERE id = p_project_id;

    -- Si pas de localisation, retourner vide
    IF v_project_location IS NULL AND (v_project_lat IS NULL OR v_project_lon IS NULL) THEN
        RETURN;
    END IF;

    -- Si location_point n'existe pas, le créer à la volée
    IF v_project_location IS NULL THEN
        v_project_location := ST_SetSRID(ST_MakePoint(v_project_lon, v_project_lat), 4326)::geography;
    END IF;

    -- Rechercher les professionnels à proximité
    RETURN QUERY
    SELECT 
        prof.id AS professional_id,
        prof.user_id,
        prof.company_name,
        ROUND(
            CASE 
                WHEN p.location_point IS NOT NULL THEN
                    ST_Distance(v_project_location, p.location_point) / 1000.0
                ELSE
                    calculate_distance(v_project_lat, v_project_lon, p.latitude, p.longitude)
            END::numeric, 
            1
        )::FLOAT AS distance_km,
        CASE 
            WHEN p.location_point IS NOT NULL THEN
                ST_Distance(v_project_location, p.location_point) / 1000.0 <= COALESCE(prof.coverage_radius, 50)
            ELSE
                calculate_distance(v_project_lat, v_project_lon, p.latitude, p.longitude) <= COALESCE(prof.coverage_radius, 50)
        END AS within_coverage,
        -- Score simple basé sur la distance (peut être amélioré)
        GREATEST(0, 100 - ROUND(
            CASE 
                WHEN p.location_point IS NOT NULL THEN
                    ST_Distance(v_project_location, p.location_point) / 1000.0 * 2
                ELSE
                    calculate_distance(v_project_lat, v_project_lon, p.latitude, p.longitude) * 2
            END
        ))::INTEGER AS score
    FROM professionals prof
    INNER JOIN profiles p ON p.id = prof.user_id
    WHERE prof.status = 'verified'
      AND (
          (p.location_point IS NOT NULL AND ST_DWithin(v_project_location, p.location_point, p_max_distance_km * 1000))
          OR
          (p.latitude IS NOT NULL AND p.longitude IS NOT NULL AND 
           calculate_distance(v_project_lat, v_project_lon, p.latitude, p.longitude) <= p_max_distance_km)
      )
    ORDER BY 
        CASE 
            WHEN p.location_point IS NOT NULL THEN
                ST_Distance(v_project_location, p.location_point)
            ELSE
                calculate_distance(v_project_lat, v_project_lon, p.latitude, p.longitude) * 1000
        END ASC
    LIMIT p_limit;
END;
$$;

-- 7. Fonction pour trouver les projets à proximité d'un professionnel
CREATE OR REPLACE FUNCTION find_nearby_projects(
    p_professional_id UUID,
    p_max_distance_km FLOAT DEFAULT 50,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    project_id UUID,
    title TEXT,
    category TEXT,
    city TEXT,
    postal_code TEXT,
    distance_km FLOAT,
    within_coverage BOOLEAN
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_pro_location GEOGRAPHY;
    v_pro_lat FLOAT;
    v_pro_lon FLOAT;
    v_coverage_radius INTEGER;
BEGIN
    -- Récupérer la localisation du professionnel et son rayon de couverture
    SELECT p.location_point, p.latitude, p.longitude, prof.coverage_radius
    INTO v_pro_location, v_pro_lat, v_pro_lon, v_coverage_radius
    FROM professionals prof
    INNER JOIN profiles p ON p.id = prof.user_id
    WHERE prof.id = p_professional_id;

    -- Si pas de localisation, retourner vide
    IF v_pro_location IS NULL AND (v_pro_lat IS NULL OR v_pro_lon IS NULL) THEN
        RETURN;
    END IF;

    -- Si location_point n'existe pas, le créer à la volée
    IF v_pro_location IS NULL THEN
        v_pro_location := ST_SetSRID(ST_MakePoint(v_pro_lon, v_pro_lat), 4326)::geography;
    END IF;

    -- Utiliser le rayon de couverture du professionnel ou la valeur par défaut
    v_coverage_radius := COALESCE(v_coverage_radius, 50);

    -- Rechercher les projets à proximité
    RETURN QUERY
    SELECT 
        proj.id AS project_id,
        proj.title,
        proj.category,
        proj.city,
        proj.postal_code,
        ROUND(
            CASE 
                WHEN proj.location_point IS NOT NULL THEN
                    ST_Distance(v_pro_location, proj.location_point) / 1000.0
                ELSE
                    calculate_distance(v_pro_lat, v_pro_lon, proj.latitude, proj.longitude)
            END::numeric, 
            1
        )::FLOAT AS distance_km,
        CASE 
            WHEN proj.location_point IS NOT NULL THEN
                ST_Distance(v_pro_location, proj.location_point) / 1000.0 <= v_coverage_radius
            ELSE
                calculate_distance(v_pro_lat, v_pro_lon, proj.latitude, proj.longitude) <= v_coverage_radius
        END AS within_coverage
    FROM projects proj
    WHERE proj.status = 'published'
      AND (
          (proj.location_point IS NOT NULL AND ST_DWithin(v_pro_location, proj.location_point, p_max_distance_km * 1000))
          OR
          (proj.latitude IS NOT NULL AND proj.longitude IS NOT NULL AND 
           calculate_distance(v_pro_lat, v_pro_lon, proj.latitude, proj.longitude) <= p_max_distance_km)
      )
    ORDER BY 
        CASE 
            WHEN proj.location_point IS NOT NULL THEN
                ST_Distance(v_pro_location, proj.location_point)
            ELSE
                calculate_distance(v_pro_lat, v_pro_lon, proj.latitude, proj.longitude) * 1000
        END ASC
    LIMIT p_limit;
END;
$$;

-- 8. Fonction pour rechercher par code postal avec rayon
CREATE OR REPLACE FUNCTION search_by_postal_code(
    p_postal_code TEXT,
    p_radius_km FLOAT DEFAULT 30,
    p_search_type TEXT DEFAULT 'professionals' -- 'professionals' ou 'projects'
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    city TEXT,
    postal_code TEXT,
    distance_km FLOAT
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_center_lat FLOAT;
    v_center_lon FLOAT;
    v_center_location GEOGRAPHY;
BEGIN
    -- Récupérer les coordonnées du code postal de référence
    -- D'abord essayer de trouver dans les profiles
    SELECT latitude, longitude, location_point
    INTO v_center_lat, v_center_lon, v_center_location
    FROM profiles
    WHERE profiles.postal_code = p_postal_code
      AND latitude IS NOT NULL 
      AND longitude IS NOT NULL
    LIMIT 1;

    -- Si pas trouvé, essayer dans les projects
    IF v_center_lat IS NULL THEN
        SELECT latitude, longitude, location_point
        INTO v_center_lat, v_center_lon, v_center_location
        FROM projects
        WHERE projects.postal_code = p_postal_code
          AND latitude IS NOT NULL 
          AND longitude IS NOT NULL
        LIMIT 1;
    END IF;

    -- Si toujours pas de coordonnées, retourner vide
    IF v_center_lat IS NULL THEN
        RETURN;
    END IF;

    -- Créer le point géographique si nécessaire
    IF v_center_location IS NULL THEN
        v_center_location := ST_SetSRID(ST_MakePoint(v_center_lon, v_center_lat), 4326)::geography;
    END IF;

    -- Rechercher selon le type
    IF p_search_type = 'professionals' THEN
        RETURN QUERY
        SELECT 
            prof.id,
            prof.company_name AS name,
            p.city,
            p.postal_code,
            ROUND(
                CASE 
                    WHEN p.location_point IS NOT NULL THEN
                        ST_Distance(v_center_location, p.location_point) / 1000.0
                    ELSE
                        calculate_distance(v_center_lat, v_center_lon, p.latitude, p.longitude)
                END::numeric, 
                1
            )::FLOAT AS distance_km
        FROM professionals prof
        INNER JOIN profiles p ON p.id = prof.user_id
        WHERE prof.status = 'verified'
          AND (
              (p.location_point IS NOT NULL AND ST_DWithin(v_center_location, p.location_point, p_radius_km * 1000))
              OR
              (p.latitude IS NOT NULL AND p.longitude IS NOT NULL AND 
               calculate_distance(v_center_lat, v_center_lon, p.latitude, p.longitude) <= p_radius_km)
          )
        ORDER BY distance_km ASC;
    ELSE
        RETURN QUERY
        SELECT 
            proj.id,
            proj.title AS name,
            proj.city,
            proj.postal_code,
            ROUND(
                CASE 
                    WHEN proj.location_point IS NOT NULL THEN
                        ST_Distance(v_center_location, proj.location_point) / 1000.0
                    ELSE
                        calculate_distance(v_center_lat, v_center_lon, proj.latitude, proj.longitude)
                END::numeric, 
                1
            )::FLOAT AS distance_km
        FROM projects proj
        WHERE proj.status = 'published'
          AND (
              (proj.location_point IS NOT NULL AND ST_DWithin(v_center_location, proj.location_point, p_radius_km * 1000))
              OR
              (proj.latitude IS NOT NULL AND proj.longitude IS NOT NULL AND 
               calculate_distance(v_center_lat, v_center_lon, proj.latitude, proj.longitude) <= p_radius_km)
          )
        ORDER BY distance_km ASC;
    END IF;
END;
$$;

-- 9. Trigger pour mettre à jour automatiquement location_point lors de l'insertion/mise à jour
CREATE OR REPLACE FUNCTION update_location_point()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location_point := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur profiles
DROP TRIGGER IF EXISTS trigger_update_profiles_location ON profiles;
CREATE TRIGGER trigger_update_profiles_location
    BEFORE INSERT OR UPDATE OF latitude, longitude ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_location_point();

-- Appliquer le trigger sur projects
DROP TRIGGER IF EXISTS trigger_update_projects_location ON projects;
CREATE TRIGGER trigger_update_projects_location
    BEFORE INSERT OR UPDATE OF latitude, longitude ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_location_point();

-- 10. Commentaires pour la documentation
COMMENT ON FUNCTION find_nearby_professionals IS 'Trouve les professionnels à proximité d''un projet avec calcul de distance optimisé';
COMMENT ON FUNCTION find_nearby_projects IS 'Trouve les projets à proximité d''un professionnel avec calcul de distance optimisé';
COMMENT ON FUNCTION search_by_postal_code IS 'Recherche par code postal avec rayon en kilomètres';
COMMENT ON COLUMN profiles.location_point IS 'Point géographique PostGIS pour recherche optimisée';
COMMENT ON COLUMN projects.location_point IS 'Point géographique PostGIS pour recherche optimisée';
