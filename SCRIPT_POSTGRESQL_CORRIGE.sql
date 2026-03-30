-- SCRIPT POSTGRESQL CORRIGÉ POUR SUPABASE
-- Copier/coller ce script dans Supabase SQL Editor

-- 1. Ajouter les colonnes si elles n'existent pas
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT;

-- 2. Mettre à jour les données existantes (seulement si first_name et last_name sont vides)
UPDATE profiles 
SET 
  first_name = CASE 
    WHEN first_name IS NULL OR first_name = '' THEN 
      CASE 
        WHEN POSITION(' ' IN full_name) > 0 THEN SPLIT_PART(full_name, ' ', 1)
        ELSE full_name
      END
    ELSE first_name
  END,
  last_name = CASE 
    WHEN last_name IS NULL OR last_name = '' THEN 
      CASE 
        WHEN POSITION(' ' IN full_name) > 0 THEN 
          TRIM(SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1))
        ELSE ''
      END
    ELSE last_name
  END,
  company_name = CASE 
    WHEN company_name IS NULL OR company_name = '' THEN 
      CASE 
        WHEN role = 'professional' THEN full_name 
        ELSE company_name 
      END
    ELSE company_name
  END
WHERE (first_name IS NULL OR first_name = '') OR (last_name IS NULL OR last_name = '');

-- 3. Vérification des résultats
SELECT 
  id, 
  email, 
  full_name,
  first_name,
  last_name,
  company_name,
  role,
  CASE 
    WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN 'COMPLET'
    ELSE 'INCOMPLET'
  END as status
FROM profiles 
ORDER BY created_at DESC 
LIMIT 5;
