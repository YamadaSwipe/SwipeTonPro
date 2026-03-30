-- Vérification de toutes les colonnes utilisées dans le formulaire
-- Date: 2026-03-02

-- Colonnes du formulaire new-project.tsx (sans desired_end_date)
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name IN (
  'title', 'description', 'category', 'city', 'postal_code',
  'estimated_budget_min', 'estimated_budget_max', 'desired_start_period',
  'urgency', 'surface', 'property_type',
  'status', 'ai_estimation', 'matched_professionnels'
)
ORDER BY column_name;
