-- SCRIPT DE MISE À JOUR DES DASHBOARDS POUR UTILISER LES NOUVELLES COLONNES
-- Pour personnaliser les messages et le CRM

-- 1. Mettre à jour le dashboard particulier pour utiliser first_name et last_name
-- Le dashboard particulier utilisera: {user.first_name} {user.last_name}

-- 2. Mettre à jour le dashboard professionnel pour utiliser first_name, last_name et company_name
-- Le dashboard professionnel utilisera: {user.first_name} {user.last_name} "{user.company_name}"

-- 3. Mettre à jour les templates d'emails pour personnalisation
-- Emails: "Bonjour {first_name}," au lieu de générique

-- 4. Mettre à jour le CRM pour afficher les informations complètes
-- CRM affichera: Prénom, Nom, Entreprise, Email

-- Exemple de requête pour le CRM:
SELECT 
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.company_name,
  p.full_name,
  p.role,
  p.created_at,
  pr.company_name as professional_company,
  pr.status as professional_status
FROM profiles p
LEFT JOIN professionals pr ON p.id = pr.id
ORDER BY p.created_at DESC;

-- 5. Validation des données après migration
SELECT 
  COUNT(*) as total_users,
  COUNT(first_name) as users_with_first_name,
  COUNT(last_name) as users_with_last_name,
  COUNT(company_name) as users_with_company_name,
  COUNT(CASE WHEN role = 'professional' THEN 1 END) as professionals,
  COUNT(CASE WHEN role = 'client' THEN 1 END) as clients
FROM profiles;

-- 6. Test de personnalisation des messages
-- Message de bienvenue particulier: "Bienvenue, {first_name} {last_name} !"
-- Message de bienvenue professionnel: "Bienvenue, {first_name} {last_name} \"{company_name}\" !"
-- Email: "Bonjour {first_name},"
