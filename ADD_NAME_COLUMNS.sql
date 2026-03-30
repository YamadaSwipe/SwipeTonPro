-- AJOUT DES COLONNES PRENOM, NOM, ENTREPRISE
-- Pour meilleure identification dans l'admin et CRM

-- 1. Ajouter les colonnes first_name, last_name, company_name à la table profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT;

-- 2. Mettre à jour les données existantes (si full_name existe)
UPDATE profiles 
SET 
  first_name = SPLIT_PART(full_name, ' ', 1),
  last_name = TRIM(REPLACE(full_name, SPLIT_PART(full_name, ' ', 1), '')),
  company_name = CASE 
    WHEN role = 'professional' THEN full_name 
    ELSE NULL 
  END
WHERE full_name IS NOT NULL AND first_name IS NULL;

-- 3. Créer un index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_profiles_first_name ON profiles(first_name);
CREATE INDEX IF NOT EXISTS idx_profiles_last_name ON profiles(last_name);
CREATE INDEX IF NOT EXISTS idx_profiles_company_name ON profiles(company_name);

-- 4. Mettre à jour les métadonnées pour la recherche
COMMENT ON COLUMN profiles.first_name IS 'Prénom de l''utilisateur pour personnalisation et CRM';
COMMENT ON COLUMN profiles.last_name IS 'Nom de famille de l''utilisateur pour personnalisation et CRM';
COMMENT ON COLUMN profiles.company_name IS 'Nom de l''entreprise pour les professionnels';

-- 5. Validation des données
SELECT 
  id,
  email,
  role,
  first_name,
  last_name,
  company_name,
  full_name,
  created_at
FROM profiles 
ORDER BY created_at DESC
LIMIT 10;
