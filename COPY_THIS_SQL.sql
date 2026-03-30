-- ========================================
-- SwipeTonPro 2.0 - Schema Initial
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'professional', 'client');
CREATE TYPE professional_status AS ENUM ('pending', 'verified', 'suspended', 'rejected');
CREATE TYPE project_status AS ENUM ('draft', 'published', 'matched', 'in_progress', 'completed', 'cancelled');
CREATE TYPE work_type AS ENUM ('plumbing', 'electrical', 'masonry', 'carpentry', 'painting', 'roofing', 'landscaping', 'hvac', 'flooring', 'insulation', 'demolition', 'other');
CREATE TYPE bid_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');
CREATE TYPE document_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE document_type AS ENUM ('siret', 'insurance', 'certification', 'id', 'other');

-- Core Tables
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  address TEXT,
  postal_code TEXT,
  city TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  role user_role DEFAULT 'client',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE professionals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  siret TEXT NOT NULL,
  company_name TEXT NOT NULL,
  specialties TEXT[],
  certifications JSONB,
  experience_years INTEGER,
  coverage_radius INTEGER,
  credits_balance INTEGER DEFAULT 0,
  rating_average DECIMAL(3,2),
  rating_count INTEGER DEFAULT 0,
  total_projects INTEGER DEFAULT 0,
  certification_badge BOOLEAN DEFAULT FALSE,
  certification_date TIMESTAMP WITH TIME ZONE,
  insurance_expiry_date TIMESTAMP WITH TIME ZONE,
  has_rge BOOLEAN DEFAULT FALSE,
  has_qualibat BOOLEAN DEFAULT FALSE,
  has_qualibois BOOLEAN DEFAULT FALSE,
  has_qualipac BOOLEAN DEFAULT FALSE,
  has_qualipv BOOLEAN DEFAULT FALSE,
  has_qualitenr BOOLEAN DEFAULT FALSE,
  has_eco_artisan BOOLEAN DEFAULT FALSE,
  other_certifications TEXT[],
  status professional_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  latitude DECIMAL,
  longitude DECIMAL,
  work_types work_type[],
  budget_min INTEGER,
  budget_max INTEGER,
  estimated_budget_min INTEGER,
  estimated_budget_max INTEGER,
  urgency TEXT,
  desired_start_date DATE,
  desired_deadline DATE,
  property_type TEXT,
  property_surface INTEGER,
  property_address TEXT,
  photos TEXT[],
  photos_optional BOOLEAN DEFAULT FALSE,
  ai_analysis JSONB,
  views_count INTEGER DEFAULT 0,
  bids_count INTEGER DEFAULT 0,
  status project_status DEFAULT 'draft',
  client_first_name TEXT,
  client_last_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  required_certifications TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  proposed_price INTEGER NOT NULL,
  message TEXT,
  estimated_duration INTEGER,
  credits_spent INTEGER DEFAULT 1,
  status bid_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE project_interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  client_interested BOOLEAN DEFAULT FALSE,
  payment_deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active',
  client_unread_count INTEGER DEFAULT 0,
  professional_unread_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  type document_type NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  status document_status DEFAULT 'pending',
  rejection_reason TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  created_by UUID REFERENCES profiles(id),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  professional_response TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE review_helpful (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE match_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'EUR',
  status TEXT DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Tables
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE platform_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category, setting_key)
);

CREATE TABLE pricing_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_type TEXT NOT NULL,
  price INTEGER NOT NULL,
  currency TEXT DEFAULT 'EUR',
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL,
  discount_value INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  min_purchase_amount INTEGER,
  target_user_type TEXT,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE settings_homepage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  projects TEXT NOT NULL,
  professionals TEXT NOT NULL,
  satisfaction TEXT NOT NULL,
  response_time TEXT NOT NULL,
  steps JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_professionals_user_id ON professionals(user_id);
CREATE INDEX idx_professionals_status ON professionals(status);
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_work_types ON projects USING GIN(work_types);
CREATE INDEX idx_bids_project_id ON bids(project_id);
CREATE INDEX idx_bids_professional_id ON bids(professional_id);
CREATE INDEX idx_conversations_project_id ON conversations(project_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Spatial indexes (created after tables are verified)
CREATE INDEX idx_professionals_location ON professionals USING GIST(ST_Point(longitude, latitude));
CREATE INDEX idx_projects_location ON projects USING GIST(ST_Point(longitude, latitude));

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Professionals
CREATE POLICY "Professionals can view own profile" ON professionals FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Professionals can update own profile" ON professionals FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can view all professionals" ON professionals FOR SELECT USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
));

-- Projects
CREATE POLICY "Clients can view own projects" ON projects FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Professionals can view published projects" ON projects FOR SELECT USING (status = 'published');
CREATE POLICY "Clients can insert own projects" ON projects FOR INSERT WITH CHECK (client_id = auth.uid());
CREATE POLICY "Clients can update own projects" ON projects FOR UPDATE USING (client_id = auth.uid());

-- Bids
CREATE POLICY "Professionals can view own bids" ON bids FOR SELECT USING (professional_id IN (
  SELECT id FROM professionals WHERE user_id = auth.uid()
));
CREATE POLICY "Clients can view project bids" ON bids FOR SELECT USING (project_id IN (
  SELECT id FROM projects WHERE client_id = auth.uid()
));

-- Conversations
CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT USING (
  client_id = auth.uid() OR professional_id IN (
    SELECT id FROM professionals WHERE user_id = auth.uid()
  )
);

-- Messages
CREATE POLICY "Users can view conversation messages" ON messages FOR SELECT USING (
  conversation_id IN (
    SELECT id FROM conversations WHERE 
      client_id = auth.uid() OR 
      professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
  )
);

-- Documents
CREATE POLICY "Professionals can view own documents" ON documents FOR SELECT USING (professional_id IN (
  SELECT id FROM professionals WHERE user_id = auth.uid()
));
CREATE POLICY "Admins can view all documents" ON documents FOR SELECT USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
));

-- Credit Transactions
CREATE POLICY "Professionals can view own transactions" ON credit_transactions FOR SELECT USING (professional_id IN (
  SELECT id FROM professionals WHERE user_id = auth.uid()
));

-- Reviews
CREATE POLICY "Users can view relevant reviews" ON reviews FOR SELECT USING (
  client_id = auth.uid() OR 
  professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
);

-- Notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_professionals_updated_at BEFORE UPDATE ON professionals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bids_updated_at BEFORE UPDATE ON bids
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_settings_updated_at BEFORE UPDATE ON platform_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_config_updated_at BEFORE UPDATE ON pricing_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial data
INSERT INTO platform_settings (category, setting_key, setting_value, description) VALUES
('general', 'site_name', '"SwipeTonPro"', 'Nom du site'),
('general', 'maintenance_mode', 'false', 'Mode maintenance'),
('credits', 'bid_cost', '1', 'Coût en crédits pour une candidature'),
('credits', 'initial_credits', '3', 'Crédits initiaux pour nouveaux professionnels'),
('pricing', 'currency', '"EUR"', 'Devise par défaut');

INSERT INTO pricing_config (service_type, price, description) VALUES
('credit_pack_5', 500, 'Pack de 5 crédits'),
('credit_pack_10', 900, 'Pack de 10 crédits'),
('credit_pack_25', 2000, 'Pack de 25 crédits');

INSERT INTO settings_homepage (projects, professionals, satisfaction, response_time, steps) VALUES
('1200+', '500+', '4.8/5', '2h en moyenne', '[
  {"title": "Décrivez votre projet", "description": "Remplissez notre formulaire simple"},
  {"title": "Recevez des devis", "description": "Les professionnels vous contactent"},
  {"title": "Choisissez le meilleur", "description": "Comparez et sélectionnez votre artisan"}
]');

INSERT INTO permissions (category, name, description) VALUES
('admin', 'manage_users', 'Gérer les utilisateurs'),
('admin', 'manage_projects', 'Gérer les projets'),
('admin', 'manage_professionals', 'Gérer les professionnels'),
('admin', 'view_analytics', 'Voir les analytics'),
('admin', 'manage_settings', 'Gérer les paramètres');
