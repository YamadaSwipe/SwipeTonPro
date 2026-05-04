-- 🔍 VÉRIFIER L'ENUM PROJECT_STATUS ACTUEL
-- Exécuter dans Supabase SQL Editor

-- 1. Voir toutes les valeurs de l'enum project_status
SELECT unnest(enum_range(NULL::project_status)) as status_values;

-- 2. Vérifier les statuts utilisés dans la table projects
SELECT DISTINCT status as used_status, COUNT(*) as count
FROM projects 
GROUP BY status
ORDER BY status;

-- 3. Voir la définition complète de l'enum
SELECT 
  t.typname as enum_name,
  e.enumlabel as enum_value,
  e.enumsortorder as sort_order
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'project_status'
ORDER BY e.enumsortorder;
