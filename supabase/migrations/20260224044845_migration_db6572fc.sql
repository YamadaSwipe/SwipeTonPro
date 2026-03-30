-- 1. Fix reviews table
ALTER TABLE reviews RENAME COLUMN response TO professional_response;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- 2. Create credit_balances view for compatibility
CREATE OR REPLACE VIEW credit_balances AS
SELECT 
  user_id, 
  credits_balance as balance,
  updated_at
FROM professionals;

-- 3. Create RPC functions for reviews
CREATE OR REPLACE FUNCTION get_professional_average_rating(prof_id UUID)
RETURNS NUMERIC AS $$
BEGIN
  RETURN (
    SELECT COALESCE(AVG(rating), 0)
    FROM reviews
    WHERE professional_id = prof_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_professional_review_count(prof_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM reviews
    WHERE professional_id = prof_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger to update professional rating on new review
CREATE OR REPLACE FUNCTION update_professional_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE professionals
  SET 
    rating_average = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE professional_id = NEW.professional_id),
    rating_count = (SELECT COUNT(*) FROM reviews WHERE professional_id = NEW.professional_id)
  WHERE id = NEW.professional_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_created ON reviews;
CREATE TRIGGER on_review_created
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_professional_rating();