-- VÉRIFICATION RAPIDE - COPIER/COLLER
-- Juste pour vérifier que tout fonctionne

-- Voir les utilisateurs avec prénom/nom
SELECT email, first_name, last_name, company_name, role,
  CASE 
    WHEN role = 'client' THEN '👋 Bienvenue, ' || COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') || ' !'
    WHEN role = 'professional' THEN 'Bienvenue, ' || COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') || ' "' || COALESCE(company_name, '') || '"'
    ELSE 'Bienvenue, ' || COALESCE(full_name, email, '')
  END as message_test
FROM profiles 
WHERE first_name IS NOT NULL OR last_name IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
