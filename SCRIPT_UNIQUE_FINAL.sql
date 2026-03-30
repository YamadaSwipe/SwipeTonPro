-- SCRIPT UNIQUE - TOUT CE QU'IL FAUT FAIRE
-- Copier/coller ce script dans Supabase SQL Editor

-- 1. Ajouter les colonnes si elles n'existent pas
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT;

-- 2. Mettre à jour les données existantes
UPDATE profiles 
SET 
  first_name = SPLIT_PART(full_name, ' ', 1),
  last_name = TRIM(REPLACE(full_name, SPLIT_PART(full_name, ' ', 1), '')),
  company_name = CASE 
    WHEN role = 'professional' THEN full_name 
    ELSE company_name 
  END
WHERE full_name IS NOT NULL AND (first_name IS NULL OR last_name IS NULL);

-- 3. Créer un utilisateur test
INSERT INTO profiles (id, email, first_name, last_name, company_name, full_name, role, created_at)
VALUES (gen_random_uuid(), 'test@example.com', 'Jean', 'Dupont', 'Entreprise Test', 'Jean Dupont', 'professional', NOW())
ON CONFLICT (email) DO UPDATE SET 
  first_name = EXCLUDED.first_name, 
  last_name = EXCLUDED.last_name, 
  company_name = EXCLUDED.company_name;

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

-- 6. Nettoyage optionnel (décommentez pour supprimer le test)
-- DELETE FROM profiles WHERE email = 'test@example.com';
