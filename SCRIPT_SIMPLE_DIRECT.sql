-- SCRIPT SIMPLE ET DIRECT POUR SUPABASE
-- Crée les 3 colonnes directement

ALTER TABLE profiles ADD COLUMN first_name TEXT;
ALTER TABLE profiles ADD COLUMN last_name TEXT;
ALTER TABLE profiles ADD COLUMN company_name TEXT;

-- Met à jour votre utilisateur spécifique (remplacez VOTRE_ID)
UPDATE profiles 
SET first_name = 'Rida', last_name = 'SOTBI'
WHERE email = 'votre_email@example.com';

-- Vérification
SELECT id, email, first_name, last_name, company_name 
FROM profiles 
WHERE email = 'votre_email@example.com';
