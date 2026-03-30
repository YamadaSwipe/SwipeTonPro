-- Now create RLS policies safely
DO $$
BEGIN
    -- Reviews policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Anyone can view reviews') THEN
        CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Clients can create reviews for their projects') THEN
        CREATE POLICY "Clients can create reviews for their projects" ON reviews FOR INSERT WITH CHECK (auth.uid() = client_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Clients can update their own reviews') THEN
        CREATE POLICY "Clients can update their own reviews" ON reviews FOR UPDATE USING (auth.uid() = client_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Professionals can update their response') THEN
        CREATE POLICY "Professionals can update their response" ON reviews FOR UPDATE USING (
          auth.uid() IN (SELECT user_id FROM professionals WHERE id = professional_id)
        );
    END IF;

    -- Review helpful policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'review_helpful' AND policyname = 'Anyone can view helpful votes') THEN
        CREATE POLICY "Anyone can view helpful votes" ON review_helpful FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'review_helpful' AND policyname = 'Authenticated users can vote helpful') THEN
        CREATE POLICY "Authenticated users can vote helpful" ON review_helpful FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'review_helpful' AND policyname = 'Users can remove their helpful vote') THEN
        CREATE POLICY "Users can remove their helpful vote" ON review_helpful FOR DELETE USING (auth.uid() = user_id);
    END IF;

    -- Stripe customers policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stripe_customers' AND policyname = 'Users can view their own stripe customer') THEN
        CREATE POLICY "Users can view their own stripe customer" ON stripe_customers FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stripe_customers' AND policyname = 'System can insert stripe customers') THEN
        CREATE POLICY "System can insert stripe customers" ON stripe_customers FOR INSERT WITH CHECK (true);
    END IF;

    -- Stripe payment intents policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stripe_payment_intents' AND policyname = 'Users can view their own payment intents') THEN
        CREATE POLICY "Users can view their own payment intents" ON stripe_payment_intents FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stripe_payment_intents' AND policyname = 'System can manage payment intents') THEN
        CREATE POLICY "System can manage payment intents" ON stripe_payment_intents FOR ALL USING (true);
    END IF;
END $$;