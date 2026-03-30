-- SCRIPT SIMPLE - COPIER/COLLER DANS SUPABASE
-- Test rapide des colonnes prénom, nom, entreprise

-- 1. Vérifier les colonnes existent
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name IN ('first_name', 'last_name', 'company_name');

-- 2. Créer un utilisateur test
INSERT INTO profiles (id, email, first_name, last_name, company_name, full_name, role, created_at)
VALUES (gen_random_uuid(), 'test@example.com', 'Jean', 'Dupont', 'Entreprise Test', 'Jean Dupont', 'professional', NOW())
ON CONFLICT (email) DO UPDATE SET 
  first_name = EXCLUDED.first_name, 
  last_name = EXCLUDED.last_name, 
  company_name = EXCLUDED.company_name;

-- 3. Vérifier le résultat
SELECT email, first_name, last_name, company_name, 
  'Bienvenue, ' || first_name || ' ' || last_name || ' "' || company_name || '"' as message
FROM profiles WHERE email = 'test@example.com';

-- 4. Nettoyer (optionnel)
-- DELETE FROM profiles WHERE email = 'test@example.com';
