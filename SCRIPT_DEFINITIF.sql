-- SCRIPT DÉFINITIF SANS ERREURS
-- Copier/coller ce script dans Supabase SQL Editor

-- 1. Vérifier si les colonnes existent déjà
DO $$
BEGIN
    -- Ajouter first_name si n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'first_name') THEN
        ALTER TABLE profiles ADD COLUMN first_name TEXT;
    END IF;
    
    -- Ajouter last_name si n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_name') THEN
        ALTER TABLE profiles ADD COLUMN last_name TEXT;
    END IF;
    
    -- Ajouter company_name si n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company_name') THEN
        ALTER TABLE profiles ADD COLUMN company_name TEXT;
    END IF;
END $$;

-- 2. Mettre à jour les données existantes (seulement si vides)
UPDATE profiles 
SET 
  first_name = SPLIT_PART(full_name, ' ', 1),
  last_name = TRIM(REPLACE(full_name, SPLIT_PART(full_name, ' ', 1), '')),
  company_name = CASE 
    WHEN role = 'professional' THEN full_name 
    ELSE company_name 
  END
WHERE full_name IS NOT NULL 
AND (first_name IS NULL OR last_name IS NULL OR first_name = '');

-- 3. Créer un utilisateur test (sans ON CONFLICT)
DELETE FROM profiles WHERE email = 'test@example.com';

INSERT INTO profiles (id, email, first_name, last_name, company_name, full_name, role, created_at)
VALUES (gen_random_uuid(), 'test@example.com', 'Jean', 'Dupont', 'Entreprise Test', 'Jean Dupont', 'professional', NOW());

-- 4. Vérifier que tout fonctionne
SELECT 
  '✅ COLONNES FONCTIONNELLES' as status,
  email, 
  first_name, 
  last_name, 
  company_name, 
  role,
  CASE 
    WHEN role = 'client' THEN '👋 Bienvenue, ' || COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') || ' !'
    WHEN role = 'professional' THEN 'Bienvenue, ' || COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') || ' "' || COALESCE(company_name, '') || '"'
    ELSE 'Bienvenue, ' || COALESCE(full_name, email, '')
  END as message_personnalise
FROM profiles 
WHERE email = 'test@example.com';

-- 5. Statistiques finales
SELECT 
  '📊 STATISTIQUES' as info,
  COUNT(*) as total_utilisateurs,
  COUNT(first_name) as avec_prenom,
  COUNT(last_name) as avec_nom,
  COUNT(company_name) as avec_entreprise
FROM profiles;

-- 6. Nettoyage optionnel (exécutez cette commande séparément si besoin)
-- DELETE FROM profiles WHERE email = 'test@example.com';
