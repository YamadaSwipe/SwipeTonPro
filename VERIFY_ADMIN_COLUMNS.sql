-- SCRIPT DE VÉRIFICATION DES COLONNES ADMIN
-- Pour vérifier que les colonnes sont bien créées et utilisées

-- 1. Vérifier que les colonnes existent
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('first_name', 'last_name', 'company_name')
ORDER BY column_name;

-- 2. Vérifier les données actuelles
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
LIMIT 5;

-- 3. Tester la requête utilisée dans l'admin
SELECT 
  id,
  email,
  first_name,
  last_name,
  full_name,
  company_name,
  role,
  created_at,
  professional:professionals(
    company_name,
    status,
    credits_balance
  )
FROM profiles 
ORDER BY created_at DESC
LIMIT 3;

-- 4. Compter les utilisateurs avec des informations
SELECT 
  COUNT(*) as total,
  COUNT(first_name) as avec_prenom,
  COUNT(last_name) as avec_nom,
  COUNT(company_name) as avec_entreprise,
  COUNT(CASE WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN 1 END) as nom_complet
FROM profiles;

-- 5. Mettre à jour les utilisateurs sans prénom/nom (optionnel)
UPDATE profiles 
SET 
  first_name = SPLIT_PART(full_name, ' ', 1),
  last_name = TRIM(REPLACE(full_name, SPLIT_PART(full_name, ' ', 1), ''))
WHERE first_name IS NULL AND last_name IS NULL AND full_name IS NOT NULL;

-- 6. Pour les professionnels, mettre à jour company_name si vide
UPDATE profiles 
SET company_name = professional.company_name
FROM professionals professional 
WHERE profiles.id = professional.id 
AND profiles.company_name IS NULL 
AND professional.company_name IS NOT NULL;
