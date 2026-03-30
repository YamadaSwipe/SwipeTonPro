-- =====================================================
-- PHASE 1: SUPPRESSION SYSTÈME CRÉDITS
-- =====================================================

-- 1. Supprimer la vue credit_balances
DROP VIEW IF EXISTS credit_balances CASCADE;

-- 2. Supprimer les colonnes de crédits de la table professionals
ALTER TABLE professionals 
DROP COLUMN IF EXISTS credits CASCADE,
DROP COLUMN IF EXISTS total_credits_purchased CASCADE;

-- 3. Supprimer les tables liées aux crédits
DROP TABLE IF EXISTS credit_transactions CASCADE;
DROP TABLE IF EXISTS credit_packages CASCADE;

-- 4. Supprimer les fonctions RPC liées aux crédits
DROP FUNCTION IF EXISTS deduct_credits(uuid, integer) CASCADE;
DROP FUNCTION IF EXISTS get_professional_credits(uuid) CASCADE;
DROP FUNCTION IF EXISTS add_credits(uuid, integer, text) CASCADE;