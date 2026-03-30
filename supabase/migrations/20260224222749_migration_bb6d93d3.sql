-- Fonction pour ajuster automatiquement le solde de crédits lors d'une transaction
CREATE OR REPLACE FUNCTION update_professional_credits_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour le solde dans la table professionals
  UPDATE professionals
  SET 
    credits_balance = NEW.balance_after,
    updated_at = NOW()
  WHERE id = NEW.professional_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour mettre à jour automatiquement le solde
DROP TRIGGER IF EXISTS trigger_update_credits_balance ON credit_transactions;
CREATE TRIGGER trigger_update_credits_balance
  AFTER INSERT ON credit_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_professional_credits_balance();

COMMENT ON FUNCTION update_professional_credits_balance IS 'Met à jour automatiquement le solde de crédits du professionnel';