-- =====================================================
-- MIGRATION: Mise à jour des paliers tarifaires
-- Date: 2026-06-19
-- Description: Met à jour les paliers avec les nouveaux prix (19€ à 599€)
-- =====================================================

-- Désactiver les anciens paliers
UPDATE match_pricing_tiers
SET is_active = false
WHERE key IN ('small', 'medium', 'large', 'xlarge', 'enterprise');

-- Insérer ou mettre à jour les nouveaux paliers
INSERT INTO match_pricing_tiers (key, label, description, budget_min, budget_max, credits_cost, price_cents, sort_order, is_active)
VALUES 
  ('tier_1', 'Petit projet', 'Projets jusqu a 1000 euros d estimation', 0, 100000, 4, 1900, 1, true),
  ('tier_2', 'Projet standard', 'Projets de 1000 a 2000 euros d estimation', 100000, 200000, 8, 3900, 2, true),
  ('tier_3', 'Projet moyen', 'Projets de 2000 a 5000 euros d estimation', 200000, 500000, 14, 6900, 3, true),
  ('tier_4', 'Gros projet', 'Projets de 5000 a 10000 euros d estimation', 500000, 1000000, 26, 12900, 4, true),
  ('tier_5', 'Tres gros projet', 'Projets de 10000 a 15000 euros d estimation', 1000000, 1500000, 40, 19900, 5, true),
  ('tier_6', 'Projet important', 'Projets de 15000 a 25000 euros d estimation', 1500000, 2500000, 50, 25000, 6, true),
  ('tier_7', 'Projet majeur', 'Projets de 25000 a 50000 euros d estimation', 2500000, 5000000, 70, 34900, 7, true),
  ('tier_8', 'Projet exceptionnel', 'Projets > 50000 euros d estimation', 5000000, NULL, 120, 59900, 8, true)
ON CONFLICT (key) 
DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  budget_min = EXCLUDED.budget_min,
  budget_max = EXCLUDED.budget_max,
  credits_cost = EXCLUDED.credits_cost,
  price_cents = EXCLUDED.price_cents,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- =====================================================
-- FIN MIGRATION
-- =====================================================
