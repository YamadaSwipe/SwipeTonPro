-- ============================================
-- SWIPETON PRO 2.0 - COMPLETE DATABASE SCHEMA
-- ============================================

-- 1. ENUM TYPES
CREATE TYPE user_role AS ENUM ('client', 'professional', 'admin');
CREATE TYPE professional_status AS ENUM ('pending', 'verified', 'rejected', 'suspended');
CREATE TYPE project_status AS ENUM ('draft', 'published', 'in_progress', 'completed', 'cancelled');
CREATE TYPE bid_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');
CREATE TYPE credit_transaction_type AS ENUM ('purchase', 'bid', 'refund', 'bonus');
CREATE TYPE document_type AS ENUM ('siret', 'insurance', 'portfolio', 'identity');
CREATE TYPE document_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE notification_type AS ENUM ('new_project', 'new_bid', 'bid_accepted', 'bid_rejected', 'credit_low', 'message', 'system');

-- 2. EXTEND PROFILES TABLE
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'client';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS postal_code text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;

-- 3. PROFESSIONALS TABLE
CREATE TABLE IF NOT EXISTS professionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  siret text NOT NULL UNIQUE,
  specialties text[] DEFAULT '{}',
  experience_years integer DEFAULT 0,
  status professional_status DEFAULT 'pending',
  certification_badge boolean DEFAULT false,
  certification_date timestamptz,
  insurance_expiry_date date,
  credits_balance integer DEFAULT 0,
  total_projects integer DEFAULT 0,
  rating_average decimal(3,2) DEFAULT 0.00,
  rating_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- 4. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  location text NOT NULL,
  city text NOT NULL,
  postal_code text NOT NULL,
  estimated_budget_min integer,
  estimated_budget_max integer,
  desired_start_date date,
  photos text[] DEFAULT '{}',
  status project_status DEFAULT 'draft',
  ai_analysis jsonb,
  views_count integer DEFAULT 0,
  bids_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. BIDS TABLE
CREATE TABLE IF NOT EXISTS bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  proposed_price integer NOT NULL,
  estimated_duration integer,
  message text,
  status bid_status DEFAULT 'pending',
  credits_spent integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(project_id, professional_id)
);

-- 6. CREDIT TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  type credit_transaction_type NOT NULL,
  description text,
  reference_id uuid,
  balance_after integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 7. DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  type document_type NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  status document_status DEFAULT 'pending',
  rejection_reason text,
  verified_at timestamptz,
  verified_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 8. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  response text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(project_id, professional_id)
);

-- 9. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 10. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 11. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_professionals_user_id ON professionals(user_id);
CREATE INDEX IF NOT EXISTS idx_professionals_status ON professionals(status);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_city ON projects(city);
CREATE INDEX IF NOT EXISTS idx_bids_project_id ON bids(project_id);
CREATE INDEX IF NOT EXISTS idx_bids_professional_id ON bids(professional_id);
CREATE INDEX IF NOT EXISTS idx_bids_status ON bids(status);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_professional_id ON credit_transactions(professional_id);
CREATE INDEX IF NOT EXISTS idx_documents_professional_id ON documents(professional_id);
CREATE INDEX IF NOT EXISTS idx_reviews_professional_id ON reviews(professional_id);
CREATE INDEX IF NOT EXISTS idx_messages_project_id ON messages(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);

-- 12. ROW LEVEL SECURITY POLICIES

-- Profiles: Already configured, keep existing policies

-- Professionals: View all verified, manage own
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view verified professionals" ON professionals
  FOR SELECT USING (status = 'verified');

CREATE POLICY "Users can insert their own professional profile" ON professionals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own professional profile" ON professionals
  FOR UPDATE USING (auth.uid() = user_id);

-- Projects: View published, manage own
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published projects" ON projects
  FOR SELECT USING (status = 'published' OR auth.uid() = client_id);

CREATE POLICY "Clients can insert their own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update their own projects" ON projects
  FOR UPDATE USING (auth.uid() = client_id);

CREATE POLICY "Clients can delete their own projects" ON projects
  FOR DELETE USING (auth.uid() = client_id);

-- Bids: View own bids, project owner can view all
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can view their own bids" ON bids
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM professionals WHERE id = professional_id
    )
  );

CREATE POLICY "Project owners can view all bids on their projects" ON bids
  FOR SELECT USING (
    auth.uid() IN (
      SELECT client_id FROM projects WHERE id = project_id
    )
  );

CREATE POLICY "Professionals can insert bids" ON bids
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM professionals WHERE id = professional_id
    )
  );

CREATE POLICY "Professionals can update their own bids" ON bids
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM professionals WHERE id = professional_id
    )
  );

-- Credit Transactions: View own only
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can view their own transactions" ON credit_transactions
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM professionals WHERE id = professional_id
    )
  );

CREATE POLICY "System can insert transactions" ON credit_transactions
  FOR INSERT WITH CHECK (true);

-- Documents: View and manage own only
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can view their own documents" ON documents
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM professionals WHERE id = professional_id
    )
  );

CREATE POLICY "Professionals can insert their own documents" ON documents
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM professionals WHERE id = professional_id
    )
  );

CREATE POLICY "Professionals can update their own documents" ON documents
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM professionals WHERE id = professional_id
    )
  );

-- Reviews: Public read, restricted write
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Clients can insert reviews for their projects" ON reviews
  FOR INSERT WITH CHECK (
    auth.uid() = client_id AND
    auth.uid() IN (
      SELECT client_id FROM projects WHERE id = project_id
    )
  );

CREATE POLICY "Professionals can respond to their reviews" ON reviews
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM professionals WHERE id = professional_id
    )
  );

-- Messages: Participants only
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages they sent or received" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages" ON messages
  FOR UPDATE USING (auth.uid() = receiver_id);

-- Notifications: Own only
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- 13. TRIGGERS FOR UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_professionals_updated_at BEFORE UPDATE ON professionals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bids_updated_at BEFORE UPDATE ON bids
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 14. FUNCTION: Update professional rating
CREATE OR REPLACE FUNCTION update_professional_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE professionals SET
    rating_average = (
      SELECT COALESCE(AVG(rating)::decimal(3,2), 0.00)
      FROM reviews WHERE professional_id = NEW.professional_id
    ),
    rating_count = (
      SELECT COUNT(*) FROM reviews WHERE professional_id = NEW.professional_id
    )
  WHERE id = NEW.professional_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_on_review AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_professional_rating();

-- 15. FUNCTION: Update project bids count
CREATE OR REPLACE FUNCTION update_project_bids_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects SET
    bids_count = (SELECT COUNT(*) FROM bids WHERE project_id = NEW.project_id)
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bids_count AFTER INSERT OR DELETE ON bids
  FOR EACH ROW EXECUTE FUNCTION update_project_bids_count();