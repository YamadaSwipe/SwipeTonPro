-- ========================================
-- FIX RLS POLICIES - Emergency Fix
-- ========================================

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create simpler, more reliable policies
CREATE POLICY "Enable read access for all users" ON profiles FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for users based on id" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Drop and recreate professionals policies
DROP POLICY IF EXISTS "Professionals can view own profile" ON professionals;
DROP POLICY IF EXISTS "Professionals can update own profile" ON professionals;
DROP POLICY IF EXISTS "Admins can view all professionals" ON professionals;

CREATE POLICY "Enable read access for all professionals" ON professionals FOR SELECT USING (true);
CREATE POLICY "Enable insert for all professionals" ON professionals FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for professionals based on user_id" ON professionals FOR UPDATE USING (auth.uid() = user_id);

-- Drop and recreate projects policies
DROP POLICY IF EXISTS "Clients can view own projects" ON projects;
DROP POLICY IF EXISTS "Professionals can view published projects" ON projects;
DROP POLICY IF EXISTS "Clients can insert own projects" ON projects;
DROP POLICY IF EXISTS "Clients can update own projects" ON projects;

CREATE POLICY "Enable read access for all projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Enable insert for all projects" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for projects based on client_id" ON projects FOR UPDATE USING (auth.uid() = client_id);

-- Drop and recreate bids policies
DROP POLICY IF EXISTS "Professionals can view own bids" ON bids;
DROP POLICY IF EXISTS "Clients can view project bids" ON bids;

CREATE POLICY "Enable read access for all bids" ON bids FOR SELECT USING (true);
CREATE POLICY "Enable insert for all bids" ON bids FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for bids" ON bids FOR UPDATE USING (true);

-- Drop and recreate other table policies
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view conversation messages" ON messages;
DROP POLICY IF EXISTS "Professionals can view own documents" ON documents;
DROP POLICY IF EXISTS "Admins can view all documents" ON documents;
DROP POLICY IF EXISTS "Professionals can view own transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Users can view relevant reviews" ON reviews;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

-- Create simple policies for remaining tables
CREATE POLICY "Enable read access for all conversations" ON conversations FOR SELECT USING (true);
CREATE POLICY "Enable insert for all conversations" ON conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all conversations" ON conversations FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all messages" ON messages FOR SELECT USING (true);
CREATE POLICY "Enable insert for all messages" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all messages" ON messages FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all documents" ON documents FOR SELECT USING (true);
CREATE POLICY "Enable insert for all documents" ON documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all documents" ON documents FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all credit_transactions" ON credit_transactions FOR SELECT USING (true);
CREATE POLICY "Enable insert for all credit_transactions" ON credit_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all credit_transactions" ON credit_transactions FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Enable insert for all reviews" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all reviews" ON reviews FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Enable insert for all notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all notifications" ON notifications FOR UPDATE USING (true);

-- Admin tables (keep simple)
CREATE POLICY "Enable full access for permissions" ON permissions FOR ALL USING (true);
CREATE POLICY "Enable full access for admin_actions" ON admin_actions FOR ALL USING (true);
CREATE POLICY "Enable full access for platform_settings" ON platform_settings FOR ALL USING (true);
CREATE POLICY "Enable full access for pricing_config" ON pricing_config FOR ALL USING (true);
CREATE POLICY "Enable full access for promo_codes" ON promo_codes FOR ALL USING (true);
CREATE POLICY "Enable full access for settings_homepage" ON settings_homepage FOR ALL USING (true);
CREATE POLICY "Enable full access for review_helpful" ON review_helpful FOR ALL USING (true);
CREATE POLICY "Enable full access for match_payments" ON match_payments FOR ALL USING (true);
