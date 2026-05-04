-- Trigger auto-matching simple
CREATE OR REPLACE FUNCTION auto_match()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer match automatiquement
  INSERT INTO matches (project_id, professional_id, status, created_at)
  VALUES (NEW.project_id, NEW.professional_id, 'pending', NOW())
  ON CONFLICT (project_id, professional_id) DO NOTHING;
  
  -- Mettre à jour statut
  NEW.status := 'pre_matched';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_match_trigger ON project_interests;
CREATE TRIGGER auto_match_trigger
  BEFORE INSERT ON project_interests
  FOR EACH ROW EXECUTE FUNCTION auto_match();

-- Table matches si manquante
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, professional_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS match_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id),
  recipient_id UUID REFERENCES profiles(id),
  type TEXT NOT NULL,
  title TEXT,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_recipient ON match_notifications(recipient_id, is_read);
