-- Ajouter les champs étendus pour le profil professionnel
ALTER TABLE professionals 
ADD COLUMN IF NOT EXISTS profile_photo TEXT,
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS vat_number TEXT,
ADD COLUMN IF NOT EXISTS company_size TEXT,
ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS intervention_radius INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS languages TEXT[];

-- Créer la table pour les documents des professionnels
CREATE TABLE IF NOT EXISTS professional_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID REFERENCES professionals(user_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified BOOLEAN DEFAULT FALSE
);

-- Créer la table pour les références clients
CREATE TABLE IF NOT EXISTS professional_references (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID REFERENCES professionals(user_id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  project_title TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  date DATE
);

-- Créer la table pour les certifications
CREATE TABLE IF NOT EXISTS professional_certifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID REFERENCES professionals(user_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  organization TEXT NOT NULL,
  date_obtained DATE NOT NULL,
  expiry_date DATE,
  url TEXT
);

-- Ajouter des commentaires pour documentation
COMMENT ON COLUMN professionals.profile_photo IS 'URL de la photo de profil professionnelle';
COMMENT ON COLUMN professionals.birth_date IS 'Date de naissance du professionnel';
COMMENT ON COLUMN professionals.vat_number IS 'Numéro de TVA intracommunautaire';
COMMENT ON COLUMN professionals.company_size IS 'Effectif de l''entreprise';
COMMENT ON COLUMN professionals.experience_years IS 'Nombre d''années d''expérience';
COMMENT ON COLUMN professionals.intervention_radius IS 'Rayon d''intervention en kilomètres';
COMMENT ON COLUMN professionals.languages IS 'Liste des langues parlées';

COMMENT ON TABLE professional_documents IS 'Documents uploadés par les professionnels';
COMMENT ON TABLE professional_references IS 'Références clients des professionnels';
COMMENT ON TABLE professional_certifications IS 'Certifications professionnelles';

-- Créer des index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_professional_documents_professional_id ON professional_documents(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_references_professional_id ON professional_references(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_certifications_professional_id ON professional_certifications(professional_id);
