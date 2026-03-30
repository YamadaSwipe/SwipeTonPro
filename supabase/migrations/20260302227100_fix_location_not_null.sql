-- Migration pour corriger les valeurs nulles dans location
-- Date: 2026-03-02

-- Mettre à jour les valeurs nulles en utilisant city + postal_code
UPDATE projects 
SET location = COALESCE(city, 'Non spécifié') || ' ' || COALESCE(postal_code, '')
WHERE location IS NULL OR location = '';

-- Vérifier qu'il n'y a plus de valeurs nulles
SELECT COUNT(*) as null_locations_count 
FROM projects 
WHERE location IS NULL OR location = '';
