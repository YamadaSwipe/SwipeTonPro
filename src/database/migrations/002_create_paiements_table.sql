-- Migration: Création de la table des paiements de mise en relation
-- Version: 002
-- Date: 2025-01-08

-- Création de la table paiements_mise_en_relation
CREATE TABLE IF NOT EXISTS paiements_mise_en_relation (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  projet_id UUID NOT NULL REFERENCES public.projets(id) ON DELETE CASCADE,
  montant DECIMAL(10,2) NOT NULL,
  devise VARCHAR(3) DEFAULT 'EUR',
  statut VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (statut IN ('pending', 'processing', 'complete', 'failed', 'expired', 'cancelled')),
  stripe_session_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  expired_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  
  -- Contraintes
  CONSTRAINT paiements_montant_check CHECK (montant > 0),
  CONSTRAINT paiements_statut_check CHECK (statut IN ('pending', 'processing', 'complete', 'failed', 'expired', 'cancelled'))
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_paiements_client_id ON paiements_mise_en_relation(client_id);
CREATE INDEX idx_paiements_professional_id ON paiements_mise_en_relation(professional_id);
CREATE INDEX idx_paiements_projet_id ON paiements_mise_en_relation(projet_id);
CREATE INDEX idx_paiements_statut ON paiements_mise_en_relation(statut);
CREATE INDEX idx_paiements_stripe_session ON paiements_mise_en_relation(stripe_session_id);
CREATE INDEX idx_paiements_created_at ON paiements_mise_en_relation(created_at);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_paiements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_paiements_updated_at
  BEFORE UPDATE ON paiements_mise_en_relation
  FOR EACH ROW
  EXECUTE FUNCTION update_paiements_updated_at();

-- Commentaires sur la table et les colonnes
COMMENT ON TABLE paiements_mise_en_relation IS 'Paiements de mise en relation entre particuliers et professionnels';
COMMENT ON COLUMN paiements_mise_en_relation.id IS 'Identifiant unique du paiement';
COMMENT ON COLUMN paiements_mise_en_relation.client_id IS 'Identifiant du client';
COMMENT ON COLUMN paiements_mise_en_relation.professional_id IS 'Identifiant du professionnel';
COMMENT ON COLUMN paiements_mise_en_relation.projet_id IS 'Identifiant du projet';
COMMENT ON COLUMN paiements_mise_en_relation.montant IS 'Montant du paiement (en devise)';
COMMENT ON COLUMN paiements_mise_en_relation.devise IS 'Devise du paiement (ISO 4217)';
COMMENT ON COLUMN paiements_mise_en_relation.statut IS 'Statut du paiement';
COMMENT ON COLUMN paiements_mise_en_relation.stripe_session_id IS 'Identifiant de session Stripe';
COMMENT ON COLUMN paiements_mise_en_relation.stripe_payment_intent_id IS 'Identifiant de payment intent Stripe';
COMMENT ON COLUMN paiements_mise_en_relation.stripe_customer_id IS 'Identifiant client Stripe';
COMMENT ON COLUMN paiements_mise_en_relation.metadata IS 'Métadonnées du paiement';
COMMENT ON COLUMN paiements_mise_en_relation.created_at IS 'Date de création du paiement';
COMMENT ON COLUMN paiements_mise_en_relation.updated_at IS 'Date de dernière mise à jour';
COMMENT ON COLUMN paiements_mise_en_relation.completed_at IS 'Date de complétion du paiement';
COMMENT ON COLUMN paiements_mise_en_relation.expired_at IS 'Date d''expiration du paiement';
COMMENT ON COLUMN paiements_mise_en_relation.failed_at IS 'Date d''échec du paiement';
COMMENT ON COLUMN paiements_mise_en_relation.error_message IS 'Message d''erreur en cas d''échec';

-- Politique de sécurité RLS (Row Level Security)
ALTER TABLE paiements_mise_en_relation ENABLE ROW LEVEL SECURITY;

-- Politique pour les utilisateurs (voir uniquement leurs paiements)
CREATE POLICY "paiements_read_for_own_users" ON paiements_mise_en_relation
  FOR SELECT USING (
    auth.role() = 'authenticated' 
    AND (
      client_id = auth.uid() 
      OR professional_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
      )
    )
  );

-- Politique pour les administrateurs (tous les droits)
CREATE POLICY "paiements_full_for_admins" ON paiements_mise_en_relation
  FOR ALL USING (
    auth.role() = 'authenticated' 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Fonction pour créer un paiement
CREATE OR REPLACE FUNCTION creer_paiement_mise_en_relation(
  p_client_id UUID,
  p_professional_id UUID,
  p_projet_id UUID,
  p_montant DECIMAL(10,2),
  p_devise VARCHAR(3) DEFAULT 'EUR',
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  paiement_id UUID;
BEGIN
  -- Vérifier qu'un paiement n'existe pas déjà pour ce triplet
  IF EXISTS (
    SELECT 1 FROM paiements_mise_en_relation
    WHERE client_id = p_client_id
      AND professional_id = p_professional_id
      AND projet_id = p_projet_id
      AND statut IN ('pending', 'processing', 'complete')
  ) THEN
    RAISE EXCEPTION 'Un paiement existe déjà pour cette mise en relation';
  END IF;
  
  -- Créer le paiement
  INSERT INTO paiements_mise_en_relation (
    client_id, professional_id, projet_id, montant, devise, metadata
  )
  VALUES (
    p_client_id, p_professional_id, p_projet_id, p_montant, p_devise, p_metadata
  )
  RETURNING id INTO paiement_id;
  
  RETURN paiement_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour le statut d'un paiement
CREATE OR REPLACE FUNCTION update_paiement_statut(
  p_paiement_id UUID,
  p_nouveau_statut VARCHAR(20),
  p_stripe_session_id VARCHAR(255) DEFAULT NULL,
  p_stripe_payment_intent_id VARCHAR(255) DEFAULT NULL,
  p_stripe_customer_id VARCHAR(255) DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE paiements_mise_en_relation
  SET 
    statut = p_nouveau_statut,
    stripe_session_id = COALESCE(p_stripe_session_id, stripe_session_id),
    stripe_payment_intent_id = COALESCE(p_stripe_payment_intent_id, stripe_payment_intent_id),
    stripe_customer_id = COALESCE(p_stripe_customer_id, stripe_customer_id),
    error_message = COALESCE(p_error_message, error_message),
    completed_at = CASE WHEN p_nouveau_statut = 'complete' THEN NOW() ELSE completed_at END,
    expired_at = CASE WHEN p_nouveau_statut = 'expired' THEN NOW() ELSE expired_at END,
    failed_at = CASE WHEN p_nouveau_statut = 'failed' THEN NOW() ELSE failed_at END
  WHERE id = p_paiement_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier si un paiement est complet
CREATE OR REPLACE FUNCTION paiement_est_complet(
  p_client_id UUID,
  p_professional_id UUID,
  p_projet_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  paiement_complet BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM paiements_mise_en_relation
    WHERE client_id = p_client_id
      AND professional_id = p_professional_id
      AND projet_id = p_projet_id
      AND statut = 'complete'
  ) INTO paiement_complet;
  
  RETURN COALESCE(paiement_complet, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Vue pour les paiements avec informations utilisateur
CREATE OR REPLACE VIEW paiements_with_users AS
SELECT 
  p.id,
  p.client_id,
  p.professional_id,
  p.projet_id,
  p.montant,
  p.devise,
  p.statut,
  p.stripe_session_id,
  p.stripe_payment_intent_id,
  p.stripe_customer_id,
  p.metadata,
  p.created_at,
  p.updated_at,
  p.completed_at,
  p.expired_at,
  p.failed_at,
  p.error_message,
  client.full_name as client_name,
  client.email as client_email,
  professional.full_name as professional_name,
  professional.email as professional_email,
  projet.titre as projet_titre,
  projet.description as projet_description
FROM paiements_mise_en_relation p
LEFT JOIN public.profiles client ON p.client_id = client.id
LEFT JOIN public.profiles professional ON p.professional_id = professional.id
LEFT JOIN public.projets projet ON p.projet_id = projet.id;

COMMENT ON VIEW paiements_with_users IS 'Vue des paiements avec informations des utilisateurs et projets';

-- Fonction de statistiques sur les paiements
CREATE OR REPLACE FUNCTION get_paiements_statistics()
RETURNS TABLE (
  total_paiements INTEGER,
  paiements_en_attente INTEGER,
  paiements_complets INTEGER,
  paiements_echoues INTEGER,
  total_montant DECIMAL(10,2),
  montant_moyen DECIMAL(10,2),
  taux_conversion DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE statut = 'pending') as en_attente,
      COUNT(*) FILTER (WHERE statut = 'complete') as complets,
      COUNT(*) FILTER (WHERE statut = 'failed') as echoues,
      COALESCE(SUM(montant), 0) as total_montant
    FROM paiements_mise_en_relation
  )
  SELECT 
    s.total as total_paiements,
    s.en_attente as paiements_en_attente,
    s.complets as paiements_complets,
    s.echoues as paiements_echoues,
    s.total_montant,
    CASE WHEN s.complets > 0 THEN s.total_montant / s.complets ELSE 0 END as montant_moyen,
    CASE WHEN s.total > 0 THEN (s.complets::DECIMAL / s.total::DECIMAL) * 100 ELSE 0 END as taux_conversion
  FROM stats s;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le statut du projet après paiement
CREATE OR REPLACE FUNCTION update_projet_statut_after_paiement()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le paiement est complété, mettre le projet en statut DEVIS
  IF NEW.statut = 'complete' AND OLD.statut != 'complete' THEN
    UPDATE public.projets
    SET statut = 'DEVIS',
        updated_at = NOW()
    WHERE id = NEW.projet_id;
  END IF;
  
  -- Si le paiement échoue, mettre le projet en statut PAIEMENT_ECHOUE
  IF NEW.statut = 'failed' AND OLD.statut != 'failed' THEN
    UPDATE public.projets
    SET statut = 'PAIEMENT_ECHOUE',
        updated_at = NOW()
    WHERE id = NEW.projet_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_projet_statut_after_paiement
  AFTER UPDATE ON paiements_mise_en_relation
  FOR EACH ROW
  EXECUTE FUNCTION update_projet_statut_after_paiement();
