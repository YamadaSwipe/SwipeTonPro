-- Ajouter les champs pour l'accord mutuel dans la table projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS accord_pdf_url TEXT,
ADD COLUMN IF NOT EXISTS accord_pdf_path TEXT,
ADD COLUMN IF NOT EXISTS accord_status VARCHAR(20) DEFAULT 'draft' CHECK (accord_status IN ('draft', 'generated', 'signed', 'cancelled')),
ADD COLUMN IF NOT EXISTS accord_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS accord_data JSONB,
ADD COLUMN IF NOT EXISTS accord_client_signed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS accord_professional_signed_at TIMESTAMP WITH TIME ZONE;

-- Index pour les recherches rapides sur les accords
CREATE INDEX IF NOT EXISTS idx_projects_accord_status ON projects(accord_status);
CREATE INDEX IF NOT EXISTS idx_projects_accord_generated_at ON projects(accord_generated_at);

-- Créer le bucket pour les documents si'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Politiques RLS pour le bucket documents
CREATE POLICY "Users can view their own project documents"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'documents' AND
    (auth.uid() IN (
      SELECT client_id FROM projects WHERE id::text = (storage.foldername(name))[1]
    ) OR auth.uid() IN (
      SELECT p.user_id FROM matches m 
      JOIN professionals p ON m.professional_id = p.id 
      WHERE m.project_id::text = (storage.foldername(name))[1] AND m.status = 'accepted'
    ))
  );

CREATE POLICY "Users can upload their own project documents"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid() IN (
      SELECT client_id FROM projects WHERE id::text = (storage.foldername(name))[1]
    )
  );

-- Politique RLS pour les champs d'accord dans projects
CREATE POLICY "Users can view accord status for their projects"
  ON projects
  FOR SELECT
  USING (
    auth.uid() = client_id OR
    auth.uid() IN (
      SELECT p.user_id FROM matches m 
      JOIN professionals p ON m.professional_id = p.id 
      WHERE m.project_id = projects.id AND m.status = 'accepted'
    )
  );

CREATE POLICY "Clients can update accord for their projects"
  ON projects
  FOR UPDATE
  USING (
    auth.uid() = client_id
  )
  WITH CHECK (
    auth.uid() = client_id
  );

-- Trigger pour mettre à jour le timestamp de modification
CREATE OR REPLACE FUNCTION update_accord_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.accord_status IS DISTINCT FROM NEW.accord_status THEN
    NEW.updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_accord_timestamp 
  BEFORE UPDATE ON projects 
  FOR EACH ROW 
  EXECUTE FUNCTION update_accord_timestamp();
