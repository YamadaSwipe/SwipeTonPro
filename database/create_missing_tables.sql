-- Tables manquantes pour le système CRM et Leads

-- Table leads (qualification)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
  
  -- Qualification
  qualification_score INTEGER DEFAULT 0 CHECK (qualification_score >= 0 AND qualification_score <= 100),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'hot', 'cold', 'converted', 'lost', 'for_sale')),
  budget DECIMAL(10,2) DEFAULT 0,
  timeline TEXT DEFAULT '',
  urgency TEXT DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'urgent')),
  
  -- Suivi
  notes TEXT DEFAULT '',
  contact_attempts INTEGER DEFAULT 0,
  last_contact_date TIMESTAMPTZ,
  next_action_date TIMESTAMPTZ,
  next_action TEXT DEFAULT '',
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Source
  source TEXT DEFAULT 'organic' CHECK (source IN ('organic', 'paid', 'referral', 'direct')),
  
  -- Métadonnées
  qualification_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table leads_for_sale (marketplace)
CREATE TABLE IF NOT EXISTS leads_for_sale (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Informations projet
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  city TEXT NOT NULL,
  budget_min DECIMAL(10,2) DEFAULT 0,
  budget_max DECIMAL(10,2) DEFAULT 0,
  description TEXT DEFAULT '',
  
  -- Qualification
  qualification_score INTEGER DEFAULT 0 CHECK (qualification_score >= 0 AND qualification_score <= 100),
  status TEXT DEFAULT 'cold' CHECK (status IN ('hot', 'warm', 'cold')),
  urgency TEXT DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'urgent')),
  timeline TEXT DEFAULT '',
  
  -- Contact (masqué initialement)
  contact_info JSONB DEFAULT '{}',
  
  -- Détails projet
  project_details JSONB DEFAULT '{}',
  
  -- Vente
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  sold_count INTEGER DEFAULT 0 CHECK (sold_count >= 0),
  max_sales INTEGER DEFAULT 3 CHECK (max_sales > 0),
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table lead_purchases (achats de leads)
CREATE TABLE IF NOT EXISTS lead_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads_for_sale(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Achat
  purchase_price DECIMAL(10,2) NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  
  -- Accès
  contact_details_revealed BOOLEAN DEFAULT false,
  access_granted_at TIMESTAMPTZ,
  
  -- Métadonnées
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table planning_events (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS planning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Événement
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  duration INTEGER DEFAULT 60 CHECK (duration > 0),
  location TEXT NOT NULL,
  type TEXT DEFAULT 'phone' CHECK (type IN ('phone', 'video', 'inperson')),
  
  -- Statut
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  
  -- Notes
  notes TEXT DEFAULT '',
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_leads_project_id ON leads(project_id);
CREATE INDEX IF NOT EXISTS idx_leads_client_id ON leads(client_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_qualification_score ON leads(qualification_score);

CREATE INDEX IF NOT EXISTS idx_leads_for_sale_category ON leads_for_sale(category);
CREATE INDEX IF NOT EXISTS idx_leads_for_sale_city ON leads_for_sale(city);
CREATE INDEX IF NOT EXISTS idx_leads_for_sale_is_available ON leads_for_sale(is_available);
CREATE INDEX IF NOT EXISTS idx_leads_for_sale_qualification_score ON leads_for_sale(qualification_score);

CREATE INDEX IF NOT EXISTS idx_lead_purchases_buyer_id ON lead_purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_lead_purchases_lead_id ON lead_purchases(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_purchases_payment_status ON lead_purchases(payment_status);

CREATE INDEX IF NOT EXISTS idx_planning_events_project_id ON planning_events(project_id);
CREATE INDEX IF NOT EXISTS idx_planning_events_professional_id ON planning_events(professional_id);
CREATE INDEX IF NOT EXISTS idx_planning_events_client_id ON planning_events(client_id);
CREATE INDEX IF NOT EXISTS idx_planning_events_event_date ON planning_events(event_date);
CREATE INDEX IF NOT EXISTS idx_planning_events_status ON planning_events(status);

-- RLS (Row Level Security) - Activer si nécessaire
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads_for_sale ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_events ENABLE ROW LEVEL SECURITY;

-- Politiques RLS (à adapter selon vos besoins)
-- Exemple : Les utilisateurs peuvent voir leurs propres leads
CREATE POLICY "Users can view their own leads" ON leads
  FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Users can view their own purchases" ON lead_purchases
  FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Users can view their own events" ON planning_events
  FOR SELECT USING (auth.uid() = client_id OR auth.uid() = professional_id);
