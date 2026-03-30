-- Migration pour corriger définitivement les valeurs nulles dans location
-- Date: 2026-03-02

-- Mettre à jour toutes les valeurs nulles dans location
UPDATE projects 
SET location = COALESCE(city, 'Non spécifié') || ' ' || COALESCE(postal_code, '')
WHERE location IS NULL OR location = '' OR TRIM(location) = '';

-- Vérifier qu'il n'y a plus de valeurs nulles
SELECT COUNT(*) as null_locations_count 
FROM projects 
WHERE location IS NULL OR location = '' OR TRIM(location) = '';

-- Afficher quelques exemples pour vérification
SELECT id, city, postal_code, location 
FROM projects 
WHERE location IS NOT NULL 
ORDER BY id 
LIMIT 5;
