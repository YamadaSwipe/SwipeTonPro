-- Migration: Création de la table des tarifs de mise en relation
-- Version: 001
-- Date: 2025-01-08

-- Création de la table tarifs_mise_en_relation
CREATE TABLE IF NOT EXISTS tarifs_mise_en_relation (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  min_estimation DECIMAL(10,2) NOT NULL,
  max_estimation DECIMAL(10,2) NOT NULL,
  frais DECIMAL(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT tarifs_min_max_check CHECK (min_estimation < max_estimation),
  CONSTRAINT tarifs_frais_check CHECK (frais >= 0),
  CONSTRAINT tarifs_unique_range UNIQUE (min_estimation, max_estimation)
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_tarifs_range ON tarifs_mise_en_relation (min_estimation, max_estimation);
CREATE INDEX idx_tarifs_actif ON tarifs_mise_en_relation (actif);
CREATE INDEX idx_tarifs_estimation_min ON tarifs_mise_en_relation (min_estimation);
CREATE INDEX idx_tarifs_estimation_max ON tarifs_mise_en_relation (max_estimation);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_tarifs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_tarifs_updated_at
  BEFORE UPDATE ON tarifs_mise_en_relation
  FOR EACH ROW
  EXECUTE FUNCTION update_tarifs_updated_at();

-- Insertion des tarifs par défaut
INSERT INTO tarifs_mise_en_relation (min_estimation, max_estimation, frais, description) VALUES
(0, 150, 0, 'Petits travaux'),
(150, 500, 19, 'Travaux légers'),
(500, 2500, 49, 'Travaux moyens'),
(2500, 5000, 79, 'Rénovations importantes'),
(5000, 15000, 119, 'Gros travaux'),
(15000, 30000, 179, 'Travaux majeurs'),
(30000, 100000, 269, 'Travaux très importants'),
(100000, 999999999, 399, 'Projets exceptionnels')
ON CONFLICT (min_estimation, max_estimation) DO NOTHING;

-- Commentaires sur la table et les colonnes
COMMENT ON TABLE tarifs_mise_en_relation IS 'Tarifs de mise en relation entre particuliers et professionnels';
COMMENT ON COLUMN tarifs_mise_en_relation.id IS 'Identifiant unique du tarif';
COMMENT ON COLUMN tarifs_mise_en_relation.min_estimation IS 'Estimation minimale du projet (en euros)';
COMMENT ON COLUMN tarifs_mise_en_relation.max_estimation IS 'Estimation maximale du projet (en euros)';
COMMENT ON COLUMN tarifs_mise_en_relation.frais IS 'Frais de mise en relation (en euros)';
COMMENT ON COLUMN tarifs_mise_en_relation.description IS 'Description du type de travaux';
COMMENT ON COLUMN tarifs_mise_en_relation.actif IS 'Statut d''activation du tarif';
COMMENT ON COLUMN tarifs_mise_en_relation.created_at IS 'Date de création du tarif';
COMMENT ON COLUMN tarifs_mise_en_relation.updated_at IS 'Date de dernière mise à jour du tarif';

-- Politique de sécurité RLS (Row Level Security)
ALTER TABLE tarifs_mise_en_relation ENABLE ROW LEVEL SECURITY;

-- Politique pour les utilisateurs authentifiés (lecture seule)
CREATE POLICY "tarifs_read_for_authenticated_users" ON tarifs_mise_en_relation
  FOR SELECT USING (auth.role() = 'authenticated');

-- Politique pour les administrateurs (tous les droits)
CREATE POLICY "tarifs_full_for_admins" ON tarifs_mise_en_relation
  FOR ALL USING (
    auth.role() = 'authenticated' 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Fonction pour calculer les frais d'un projet
CREATE OR REPLACE FUNCTION calculer_frais_mise_en_relation(estimation DECIMAL(10,2))
RETURNS DECIMAL(10,2) AS $$
DECLARE
  frais_result DECIMAL(10,2);
BEGIN
  SELECT frais INTO frais_result
  FROM tarifs_mise_en_relation
  WHERE actif = true
    AND estimation >= min_estimation 
    AND estimation <= max_estimation
  ORDER BY min_estimation
  LIMIT 1;
  
  RETURN COALESCE(frais_result, 0);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir tous les tarifs actifs
CREATE OR REPLACE FUNCTION get_tarifs_actifs()
RETURNS TABLE (
  id UUID,
  min_estimation DECIMAL(10,2),
  max_estimation DECIMAL(10,2),
  frais DECIMAL(10,2),
  description TEXT,
  actif BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.min_estimation, t.max_estimation, t.frais, t.description, t.actif, t.created_at, t.updated_at
  FROM tarifs_mise_en_relation t
  WHERE t.actif = true
  ORDER BY t.min_estimation;
END;
$$ LANGUAGE plpgsql;

-- Vue pour les tarifs formatés
CREATE OR REPLACE VIEW tarifs_formatted AS
SELECT 
  id,
  min_estimation,
  max_estimation,
  frais,
  description,
  actif,
  created_at,
  updated_at,
  CASE 
    WHEN max_estimation >= 999999999 THEN '> ' || min_estimation::text || ' €'
    WHEN min_estimation = 0 THEN '< ' || max_estimation::text || ' €'
    ELSE min_estimation::text || ' - ' || max_estimation::text || ' €'
  END as estimation_range,
  CASE 
    WHEN frais = 0 THEN 'Gratuit'
    ELSE frais::text || ' €'
  END as frais_formatted
FROM tarifs_mise_en_relation
WHERE actif = true
ORDER BY min_estimation;

COMMENT ON VIEW tarifs_formatted IS 'Vue des tarifs avec formatage français pour l''affichage';

-- Trigger pour la validation des plages
CREATE OR REPLACE FUNCTION validate_tarif_range()
RETURNS TRIGGER AS $$
DECLARE
  overlapping_count INTEGER;
BEGIN
  -- Vérifier les chevauchements avec les tarifs existants
  SELECT COUNT(*) INTO overlapping_count
  FROM tarifs_mise_en_relation
  WHERE id != COALESCE(NEW.id, gen_random_uuid())
    AND actif = true
    AND (
      (NEW.min_estimation >= min_estimation AND NEW.min_estimation < max_estimation) OR
      (NEW.max_estimation > min_estimation AND NEW.max_estimation <= max_estimation) OR
      (NEW.min_estimation <= min_estimation AND NEW.max_estimation >= max_estimation)
    );
  
  IF overlapping_count > 0 THEN
    RAISE EXCEPTION 'La plage d''estimation chevauche un tarif existant';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_tarif_range
  BEFORE INSERT OR UPDATE ON tarifs_mise_en_relation
  FOR EACH ROW
  EXECUTE FUNCTION validate_tarif_range();

-- Fonction de statistiques sur les tarifs
CREATE OR REPLACE FUNCTION get_tarifs_statistics()
RETURNS TABLE (
  total_tarifs INTEGER,
  tarifs_actifs INTEGER,
  total_frais DECIMAL(10,2),
  frais_moyen DECIMAL(10,2),
  frais_min DECIMAL(10,2),
  frais_max DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_tarifs,
    COUNT(*) FILTER (WHERE actif = true) as tarifs_actifs,
    COALESCE(SUM(frais), 0) as total_frais,
    COALESCE(AVG(frais), 0) as frais_moyen,
    COALESCE(MIN(frais), 0) as frais_min,
    COALESCE(MAX(frais), 0) as frais_max
  FROM tarifs_mise_en_relation;
END;
$$ LANGUAGE plpgsql;
