-- Créer la table pour enregistrer les acceptations de clause de responsabilité
CREATE TABLE IF NOT EXISTS liability_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  payment_intent_id TEXT,
  clause_text TEXT NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les recherches rapides
CREATE INDEX idx_liability_acceptances_project_id ON liability_acceptances(project_id);
CREATE INDEX idx_liability_acceptances_professional_id ON liability_acceptances(professional_id);
CREATE INDEX idx_liability_acceptances_payment_intent ON liability_acceptances(payment_intent_id);

-- Ajouter les champs pour la notification de séquestration dans la table projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS escrow_notified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS escrow_notified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS escrow_notified_by UUID REFERENCES auth.users(id);

-- Index pour les notifications de séquestration
CREATE INDEX idx_projects_escrow_notified ON projects(escrow_notified);

-- RLS (Row Level Security) pour la table liability_acceptances
ALTER TABLE liability_acceptances ENABLE ROW LEVEL SECURITY;

-- Politique RLS : les utilisateurs peuvent voir leurs propres acceptations
CREATE POLICY "Users can view their own liability acceptances"
  ON liability_acceptances
  FOR SELECT
  USING (
    auth.uid() = professional_id
    OR auth.uid() IN (
      SELECT client_id FROM projects WHERE id = project_id
    )
  );

-- Politique RLS : les professionnels peuvent insérer leurs acceptations
CREATE POLICY "Professionals can insert their acceptances"
  ON liability_acceptances
  FOR INSERT
  WITH CHECK (auth.uid() = professional_id);

-- Politique RLS : admin peut tout voir
CREATE POLICY "Admins can view all liability acceptances"
  ON liability_acceptances
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Mettre à jour le timestamp updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_liability_acceptances_updated_at 
  BEFORE UPDATE ON liability_acceptances 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
