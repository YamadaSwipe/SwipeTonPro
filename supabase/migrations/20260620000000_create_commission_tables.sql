-- Create lead_purchases table for commission dashboard
CREATE TABLE IF NOT EXISTS lead_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  purchase_price NUMERIC NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  purchased_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create commission_payouts table for commission dashboard
CREATE TABLE IF NOT EXISTS commission_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  requested_at TIMESTAMPTZ DEFAULT now(),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE lead_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_payouts ENABLE ROW LEVEL SECURITY;

-- Create policies for lead_purchases
CREATE POLICY "Users can view their own lead purchases"
  ON lead_purchases FOR SELECT
  USING (auth.uid() = buyer_id);

CREATE POLICY "Admins can view all lead purchases"
  ON lead_purchases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users can insert their own lead purchases"
  ON lead_purchases FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Admins can insert lead purchases"
  ON lead_purchases FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users can update their own lead purchases"
  ON lead_purchases FOR UPDATE
  USING (auth.uid() = buyer_id);

CREATE POLICY "Admins can update lead purchases"
  ON lead_purchases FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Create policies for commission_payouts
CREATE POLICY "Users can view their own commission payouts"
  ON commission_payouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all commission payouts"
  ON commission_payouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can insert commission payouts"
  ON commission_payouts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update commission payouts"
  ON commission_payouts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lead_purchases_buyer_id ON lead_purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_lead_purchases_payment_status ON lead_purchases(payment_status);
CREATE INDEX IF NOT EXISTS idx_lead_purchases_purchased_at ON lead_purchases(purchased_at);

CREATE INDEX IF NOT EXISTS idx_commission_payouts_user_id ON commission_payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_commission_payouts_status ON commission_payouts(status);
CREATE INDEX IF NOT EXISTS idx_commission_payouts_requested_at ON commission_payouts(requested_at);
