-- Drop the partially created table if it exists
DROP TABLE IF EXISTS project_interests CASCADE;

-- Create project_interests table with correct column references
CREATE TABLE project_interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('interested', 'pre_matched', 'accepted', 'payment_pending', 'paid', 'rejected', 'expired')),
  client_interested BOOLEAN DEFAULT false,
  payment_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, professional_id)
);

-- Enable RLS
ALTER TABLE project_interests ENABLE ROW LEVEL SECURITY;

-- Policies using the correct column name (user_id)
CREATE POLICY "Professionals can view their own interests" ON project_interests
  FOR SELECT USING (auth.uid() IN (
    SELECT user_id FROM professionals WHERE id = professional_id
  ));

CREATE POLICY "Professionals can create interests" ON project_interests
  FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT user_id FROM professionals WHERE id = professional_id
  ));

CREATE POLICY "Clients can view interests for their projects" ON project_interests
  FOR SELECT USING (auth.uid() IN (
    SELECT client_id FROM projects WHERE id = project_id
  ));

CREATE POLICY "Clients can update interests for their projects" ON project_interests
  FOR UPDATE USING (auth.uid() IN (
    SELECT client_id FROM projects WHERE id = project_id
  ));

-- Index for performance
CREATE INDEX idx_project_interests_project_id ON project_interests(project_id);
CREATE INDEX idx_project_interests_professional_id ON project_interests(professional_id);
CREATE INDEX idx_project_interests_status ON project_interests(status);

-- Trigger for updated_at
CREATE TRIGGER update_project_interests_updated_at
  BEFORE UPDATE ON project_interests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-expire payment_pending interests after 15 minutes
CREATE OR REPLACE FUNCTION expire_payment_pending_interests()
RETURNS void AS $$
BEGIN
  UPDATE project_interests
  SET status = 'expired'
  WHERE status = 'payment_pending'
    AND payment_deadline < NOW();
END;
$$ LANGUAGE plpgsql;