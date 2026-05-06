-- Migration: Documents légaux modifiables (CGV, CGU, Politique de confidentialité)
-- Permet à l'admin de gérer les documents légaux sans toucher au code

-- Table des documents légaux
CREATE TABLE IF NOT EXISTS legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type VARCHAR(50) NOT NULL, -- 'cgv', 'cgu', 'privacy', 'mentions_legales'
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  version VARCHAR(20) DEFAULT '1.0',
  is_active BOOLEAN NOT NULL DEFAULT true,
  effective_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT unique_document_type_active UNIQUE (document_type, is_active)
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_legal_documents_type ON legal_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_legal_documents_active ON legal_documents(is_active);

-- Données par défaut (templates vides)
INSERT INTO legal_documents (document_type, title, content, version, is_active)
VALUES 
  ('cgv', 'Conditions Générales de Vente', 'Les conditions générales de vente seront définies ici...', '1.0', true),
  ('cgu', 'Conditions Générales d''Utilisation', 'Les conditions générales d''utilisation seront définies ici...', '1.0', true),
  ('privacy', 'Politique de Confidentialité', 'La politique de confidentialité sera définie ici...', '1.0', true),
  ('mentions_legales', 'Mentions Légales', 'Les mentions légales seront définies ici...', '1.0', true)
ON CONFLICT DO NOTHING;

-- Politique RLS: lecture publique pour les documents actifs
CREATE POLICY "legal_documents_public_read" 
ON legal_documents FOR SELECT 
TO public 
USING (is_active = true);

-- Politique RLS: lecture complète pour les admin
CREATE POLICY "legal_documents_admin_read" 
ON legal_documents FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Politique RLS: écriture uniquement admin
CREATE POLICY "legal_documents_admin_write" 
ON legal_documents FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Fonction pour récupérer un document actif par type
CREATE OR REPLACE FUNCTION get_legal_document(doc_type VARCHAR)
RETURNS TABLE (
  id UUID,
  title VARCHAR(255),
  content TEXT,
  version VARCHAR(20),
  effective_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    id,
    title,
    content,
    version,
    effective_date,
    updated_at
  FROM legal_documents
  WHERE document_type = doc_type AND is_active = true
  ORDER BY updated_at DESC
  LIMIT 1;
$$;

-- Fonction pour créer une nouvelle version d'un document
CREATE OR REPLACE FUNCTION update_legal_document(
  doc_type VARCHAR,
  new_title VARCHAR(255),
  new_content TEXT,
  new_version VARCHAR(20) DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id UUID;
  current_version VARCHAR(20);
BEGIN
  -- Désactiver l'ancienne version
  UPDATE legal_documents 
  SET is_active = false 
  WHERE document_type = doc_type AND is_active = true;
  
  -- Déterminer la nouvelle version
  IF new_version IS NULL THEN
    SELECT version INTO current_version 
    FROM legal_documents 
    WHERE document_type = doc_type 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Incrémenter la version (simple logique: 1.0 -> 1.1 -> 2.0)
    current_version := COALESCE(current_version, '1.0');
  ELSE
    current_version := new_version;
  END IF;
  
  -- Insérer la nouvelle version
  INSERT INTO legal_documents (
    document_type,
    title,
    content,
    version,
    is_active,
    effective_date,
    created_by
  ) VALUES (
    doc_type,
    new_title,
    new_content,
    current_version,
    true,
    CURRENT_DATE,
    auth.uid()
  )
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION get_legal_document(VARCHAR) TO public;
GRANT EXECUTE ON FUNCTION update_legal_document(VARCHAR, VARCHAR(255), TEXT, VARCHAR(20)) TO authenticated;

COMMENT ON TABLE legal_documents IS 'Documents légaux modifiables par l\'admin (CGV, CGU, confidentialité)';
COMMENT ON FUNCTION get_legal_document(VARCHAR) IS 'Récupère le document légal actif par type';
COMMENT ON FUNCTION update_legal_document(VARCHAR, VARCHAR(255), TEXT, VARCHAR(20)) IS 'Crée une nouvelle version d\'un document légal';
