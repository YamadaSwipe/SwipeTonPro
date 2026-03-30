-- Migration: Création de la table des documents et consentements
-- Version: 003
-- Date: 2025-01-08

-- Création de la table documents
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  projet_id UUID NOT NULL REFERENCES public.projets(id) ON DELETE CASCADE,
  type_document VARCHAR(50) NOT NULL CHECK (type_document IN ('consentement', 'devis', 'contrat', 'facture', 'autre')),
  titre VARCHAR(255) NOT NULL,
  description TEXT,
  chemin_fichier VARCHAR(500) NOT NULL,
  nom_fichier VARCHAR(255) NOT NULL,
  taille_fichier INTEGER,
  type_mime VARCHAR(100),
  statut VARCHAR(20) DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'signe_particulier', 'signe_professionnel', 'complet', 'archive')),
  signe_particulier BOOLEAN DEFAULT FALSE,
  signe_professionnel BOOLEAN DEFAULT FALSE,
  date_signature_particulier TIMESTAMP WITH TIME ZONE,
  date_signature_professionnel TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT documents_titre_check CHECK (length(titre) > 0),
  CONSTRAINT documents_chemin_check CHECK (length(chemin_fichier) > 0)
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_documents_projet_id ON documents(projet_id);
CREATE INDEX idx_documents_type_document ON documents(type_document);
CREATE INDEX idx_documents_statut ON documents(statut);
CREATE INDEX idx_documents_created_at ON documents(created_at);
CREATE INDEX idx_documents_signe_particulier ON documents(signe_particulier);
CREATE INDEX idx_documents_signe_professionnel ON documents(signe_professionnel);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_documents_updated_at();

-- Commentaires sur la table et les colonnes
COMMENT ON TABLE documents IS 'Documents associés aux projets (consentements, devis, contrats, etc.)';
COMMENT ON COLUMN documents.id IS 'Identifiant unique du document';
COMMENT ON COLUMN documents.projet_id IS 'Identifiant du projet associé';
COMMENT ON COLUMN documents.type_document IS 'Type de document (consentement, devis, contrat, facture, autre)';
COMMENT ON COLUMN documents.titre IS 'Titre du document';
COMMENT ON COLUMN documents.description IS 'Description du document';
COMMENT ON COLUMN documents.chemin_fichier IS 'Chemin du fichier dans le stockage';
COMMENT ON COLUMN documents.nom_fichier IS 'Nom du fichier original';
COMMENT ON COLUMN documents.taille_fichier IS 'Taille du fichier en octets';
COMMENT ON COLUMN documents.type_mime IS 'Type MIME du fichier';
COMMENT ON COLUMN documents.statut IS 'Statut du document';
COMMENT ON COLUMN documents.signe_particulier IS 'Le document est signé par le particulier';
COMMENT ON COLUMN documents.signe_professionnel IS 'Le document est signé par le professionnel';
COMMENT ON COLUMN documents.date_signature_particulier IS 'Date de signature du particulier';
COMMENT ON COLUMN documents.date_signature_professionnel IS 'Date de signature du professionnel';
COMMENT ON COLUMN documents.metadata IS 'Métadonnées du document';
COMMENT ON COLUMN documents.created_at IS 'Date de création du document';
COMMENT ON COLUMN documents.updated_at IS 'Date de dernière mise à jour';

-- Politique de sécurité RLS (Row Level Security)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Politique pour les utilisateurs (voir uniquement leurs documents)
CREATE POLICY "documents_read_for_own_users" ON documents
  FOR SELECT USING (
    auth.role() = 'authenticated' 
    AND (
      EXISTS (
        SELECT 1 FROM public.projets p
        WHERE p.id = documents.projet_id
        AND (p.client_id = auth.uid() OR p.professional_id = auth.uid())
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
      )
    )
  );

-- Politique pour les administrateurs (tous les droits)
CREATE POLICY "documents_full_for_admins" ON documents
  FOR ALL USING (
    auth.role() = 'authenticated' 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Fonction pour créer un document de consentement
CREATE OR REPLACE FUNCTION creer_document_consentement(
  p_projet_id UUID,
  p_titre VARCHAR(255),
  p_chemin_fichier VARCHAR(500),
  p_nom_fichier VARCHAR(255),
  p_taille_fichier INTEGER DEFAULT NULL,
  p_type_mime VARCHAR(100) DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  document_id UUID;
BEGIN
  INSERT INTO documents (
    projet_id, type_document, titre, chemin_fichier, nom_fichier, 
    taille_fichier, type_mime, metadata
  )
  VALUES (
    p_projet_id, 'consentement', p_titre, p_chemin_fichier, p_nom_fichier,
    p_taille_fichier, p_type_mime, p_metadata
  )
  RETURNING id INTO document_id;
  
  RETURN document_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour signer un document
CREATE OR REPLACE FUNCTION signer_document(
  p_document_id UUID,
  p_utilisateur_id UUID,
  p_type_signature VARCHAR(20) -- 'particulier' ou 'professionnel'
)
RETURNS BOOLEAN AS $$
DECLARE
  projet_client_id UUID;
  projet_professional_id UUID;
BEGIN
  -- Récupérer les IDs du client et du professionnel pour ce projet
  SELECT p.client_id, p.professional_id 
  INTO projet_client_id, projet_professional_id
  FROM public.projets p
  JOIN documents d ON d.id = p_document_id
  WHERE d.id = p_document_id;
  
  -- Vérifier que l'utilisateur est autorisé à signer
  IF p_type_signature = 'particulier' AND p_utilisateur_id != projet_client_id THEN
    RAISE EXCEPTION 'Utilisateur non autorisé à signer ce document en tant que particulier';
  END IF;
  
  IF p_type_signature = 'professionnel' AND p_utilisateur_id != projet_professional_id THEN
    RAISE EXCEPTION 'Utilisateur non autorisé à signer ce document en tant que professionnel';
  END IF;
  
  -- Mettre à jour la signature
  IF p_type_signature = 'particulier' THEN
    UPDATE documents
    SET 
      signe_particulier = TRUE,
      date_signature_particulier = NOW(),
      statut = CASE 
        WHEN signe_professionnel = TRUE THEN 'complet'
        ELSE 'signe_particulier'
      END
    WHERE id = p_document_id;
  ELSIF p_type_signature = 'professionnel' THEN
    UPDATE documents
    SET 
      signe_professionnel = TRUE,
      date_signature_professionnel = NOW(),
      statut = CASE 
        WHEN signe_particulier = TRUE THEN 'complet'
        ELSE 'signe_professionnel'
      END
    WHERE id = p_document_id;
  END IF;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier si un document de consentement existe pour un projet
CREATE OR REPLACE FUNCTION consentement_existe(p_projet_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  existe BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM documents
    WHERE projet_id = p_projet_id
      AND type_document = 'consentement'
  ) INTO existe;
  
  RETURN COALESCE(existe, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir le document de consentement d'un projet
CREATE OR REPLACE FUNCTION get_consentement_projet(p_projet_id UUID)
RETURNS TABLE (
  id UUID,
  titre VARCHAR(255),
  description TEXT,
  chemin_fichier VARCHAR(500),
  nom_fichier VARCHAR(255),
  statut VARCHAR(20),
  signe_particulier BOOLEAN,
  signe_professionnel BOOLEAN,
  date_signature_particulier TIMESTAMP WITH TIME ZONE,
  date_signature_professionnel TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.titre,
    d.description,
    d.chemin_fichier,
    d.nom_fichier,
    d.statut,
    d.signe_particulier,
    d.signe_professionnel,
    d.date_signature_particulier,
    d.date_signature_professionnel,
    d.created_at,
    d.updated_at
  FROM documents d
  WHERE d.projet_id = p_projet_id
    AND d.type_document = 'consentement'
  ORDER BY d.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Vue pour les documents avec informations utilisateur
CREATE OR REPLACE VIEW documents_with_users AS
SELECT 
  d.id,
  d.projet_id,
  d.type_document,
  d.titre,
  d.description,
  d.chemin_fichier,
  d.nom_fichier,
  d.taille_fichier,
  d.type_mime,
  d.statut,
  d.signe_particulier,
  d.signe_professionnel,
  d.date_signature_particulier,
  d.date_signature_professionnel,
  d.metadata,
  d.created_at,
  d.updated_at,
  client.full_name as client_name,
  client.email as client_email,
  professional.full_name as professional_name,
  professional.email as professional_email,
  projet.titre as projet_titre
FROM documents d
LEFT JOIN public.projets projet ON d.projet_id = projet.id
LEFT JOIN public.profiles client ON projet.client_id = client.id
LEFT JOIN public.profiles professional ON projet.professional_id = professional.id;

COMMENT ON VIEW documents_with_users IS 'Vue des documents avec informations des utilisateurs et projets';

-- Fonction de statistiques sur les documents
CREATE OR REPLACE FUNCTION get_documents_statistics()
RETURNS TABLE (
  total_documents INTEGER,
  consentements INTEGER,
  documents_signes INTEGER,
  documents_complets INTEGER,
  taille_totale BIGINT,
  taille_moyenne DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE type_document = 'consentement') as consentements,
      COUNT(*) FILTER (WHERE (signe_particulier = TRUE OR signe_professionnel = TRUE)) as signes,
      COUNT(*) FILTER (WHERE statut = 'complet') as complets,
      COALESCE(SUM(taille_fichier), 0) as taille_totale
    FROM documents
  )
  SELECT 
    s.total as total_documents,
    s.consentements,
    s.signes as documents_signes,
    s.complets as documents_complets,
    s.taille_totale,
    CASE WHEN s.total > 0 THEN s.taille_totale / s.total ELSE 0 END as taille_moyenne
  FROM stats s;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le projet avec l'URL du consentement
CREATE OR REPLACE FUNCTION update_projet_consentement_url()
RETURNS TRIGGER AS $$
BEGIN
  -- Si c'est un document de consentement et qu'il est complet
  IF NEW.type_document = 'consentement' AND NEW.statut = 'complet' THEN
    UPDATE public.projets
    SET 
      consentement_url = NEW.chemin_fichier,
      consentement_generated_at = NEW.created_at,
      updated_at = NOW()
    WHERE id = NEW.projet_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_projet_consentement_url
  AFTER INSERT OR UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_projet_consentement_url();

-- Ajout de colonnes à la table projets si elles n'existent pas
DO $$
BEGIN
  -- Ajouter consentement_url si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projets' 
    AND column_name = 'consentement_url'
  ) THEN
    ALTER TABLE public.projets 
    ADD COLUMN consentement_url TEXT;
    COMMENT ON COLUMN public.projets.consentement_url IS 'URL du document de consentement';
  END IF;
  
  -- Ajouter consentement_generated_at si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projets' 
    AND column_name = 'consentement_generated_at'
  ) THEN
    ALTER TABLE public.projets 
    ADD COLUMN consentement_generated_at TIMESTAMP WITH TIME ZONE;
    COMMENT ON COLUMN public.projets.consentement_generated_at IS 'Date de génération du consentement';
  END IF;
END $$;
