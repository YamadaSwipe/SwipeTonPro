-- Migration: Création de la table d'historique des statuts de projets
-- Version: 004
-- Date: 2025-01-08

-- Création de la table projet_statut_historique
CREATE TABLE IF NOT EXISTS projet_statut_historique (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  projet_id UUID NOT NULL REFERENCES public.projets(id) ON DELETE CASCADE,
  ancien_statut VARCHAR(50),
  nouveau_statut VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  commentaire TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  
  -- Contraintes
  CONSTRAINT projet_statut_historique_statut_check CHECK (
    nouveau_statut IN (
      'DEPOSE', 'QUALIF', 'BADGE', 'VALID', 'LIGNE', 'CANDID', 'MATCH', 
      'PAIEMENT_ATTENTE', 'PAIEMENT_ECHOUE', 'PAIEMENT_RETENTE', 'DEVIS', 
      'DEVIS_VALIDE', 'TRAVAUX', 'FIN', 'TERMINE'
    )
  )
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_projet_statut_historique_projet_id ON projet_statut_historique(projet_id);
CREATE INDEX idx_projet_statut_historique_user_id ON projet_statut_historique(user_id);
CREATE INDEX idx_projet_statut_historique_timestamp ON projet_statut_historique(timestamp);
CREATE INDEX idx_projet_statut_historique_nouveau_statut ON projet_statut_historique(nouveau_statut);

-- Commentaires sur la table et les colonnes
COMMENT ON TABLE projet_statut_historique IS 'Historique des changements de statut des projets';
COMMENT ON COLUMN projet_statut_historique.id IS 'Identifiant unique de l''entrée d''historique';
COMMENT ON COLUMN projet_statut_historique.projet_id IS 'Identifiant du projet concerné';
COMMENT ON COLUMN projet_statut_historique.ancien_statut IS 'Ancien statut du projet';
COMMENT ON COLUMN projet_statut_historique.nouveau_statut IS 'Nouveau statut du projet';
COMMENT ON COLUMN projet_statut_historique.user_id IS 'Utilisateur qui a effectué le changement';
COMMENT ON COLUMN projet_statut_historique.commentaire IS 'Commentaire sur le changement de statut';
COMMENT ON COLUMN projet_statut_historique.timestamp IS 'Date et heure du changement';
COMMENT ON COLUMN projet_statut_historique.metadata IS 'Métadonnées du changement';

-- Politique de sécurité RLS (Row Level Security)
ALTER TABLE projet_statut_historique ENABLE ROW LEVEL SECURITY;

-- Politique pour les utilisateurs (voir uniquement l'historique de leurs projets)
CREATE POLICY "projet_statut_historique_read_for_own_users" ON projet_statut_historique
  FOR SELECT USING (
    auth.role() = 'authenticated' 
    AND (
      EXISTS (
        SELECT 1 FROM public.projets p
        WHERE p.id = projet_statut_historique.projet_id
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
CREATE POLICY "projet_statut_historique_full_for_admins" ON projet_statut_historique
  FOR ALL USING (
    auth.role() = 'authenticated' 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Fonction pour logger un changement de statut
CREATE OR REPLACE FUNCTION logger_changement_statut_projet(
  p_projet_id UUID,
  p_ancien_statut VARCHAR(50),
  p_nouveau_statut VARCHAR(50),
  p_user_id UUID DEFAULT NULL,
  p_commentaire TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  historique_id UUID;
BEGIN
  INSERT INTO projet_statut_historique (
    projet_id, ancien_statut, nouveau_statut, user_id, commentaire, metadata
  )
  VALUES (
    p_projet_id, p_ancien_statut, p_nouveau_statut, p_user_id, p_commentaire, p_metadata
  )
  RETURNING id INTO historique_id;
  
  RETURN historique_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir l'historique d'un projet
CREATE OR REPLACE FUNCTION get_historique_projet(p_projet_id UUID)
RETURNS TABLE (
  id UUID,
  ancien_statut VARCHAR(50),
  nouveau_statut VARCHAR(50),
  user_id UUID,
  user_full_name VARCHAR(255),
  user_email VARCHAR(255),
  commentaire TEXT,
  timestamp TIMESTAMP WITH TIME ZONE,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.id,
    h.ancien_statut,
    h.nouveau_statut,
    h.user_id,
    p.full_name as user_full_name,
    p.email as user_email,
    h.commentaire,
    h.timestamp,
    h.metadata
  FROM projet_statut_historique h
  LEFT JOIN public.profiles p ON h.user_id = p.id
  WHERE h.projet_id = p_projet_id
  ORDER BY h.timestamp DESC;
END;
$$ LANGUAGE plpgsql;

-- Vue pour l'historique avec noms de statuts formatés
CREATE OR REPLACE VIEW projet_statut_historique_formatted AS
SELECT 
  h.id,
  h.projet_id,
  h.ancien_statut,
  h.nouveau_statut,
  CASE h.ancien_statut
    WHEN 'DEPOSE' THEN 'Projet déposé'
    WHEN 'QUALIF' THEN 'En qualification TEAM'
    WHEN 'BADGE' THEN 'Badge CRM attribué'
    WHEN 'VALID' THEN 'Validé support'
    WHEN 'LIGNE' THEN 'Projet en ligne'
    WHEN 'CANDID' THEN 'Candidatures reçues'
    WHEN 'MATCH' THEN 'Match effectué'
    WHEN 'PAIEMENT_ATTENTE' THEN 'Paiement en attente'
    WHEN 'PAIEMENT_ECHOUE' THEN 'Paiement échoué'
    WHEN 'PAIEMENT_RETENTE' THEN 'Retentative paiement'
    WHEN 'DEVIS' THEN 'Devis reçu'
    WHEN 'DEVIS_VALIDE' THEN 'Devis validé'
    WHEN 'TRAVAUX' THEN 'Travaux en cours'
    WHEN 'FIN' THEN 'Fin travaux'
    WHEN 'TERMINE' THEN 'Projet terminé'
    ELSE h.ancien_statut
  END as ancien_statut_formatted,
  CASE h.nouveau_statut
    WHEN 'DEPOSE' THEN 'Projet déposé'
    WHEN 'QUALIF' THEN 'En qualification TEAM'
    WHEN 'BADGE' THEN 'Badge CRM attribué'
    WHEN 'VALID' THEN 'Validé support'
    WHEN 'LIGNE' THEN 'Projet en ligne'
    WHEN 'CANDID' THEN 'Candidatures reçues'
    WHEN 'MATCH' THEN 'Match effectué'
    WHEN 'PAIEMENT_ATTENTE' THEN 'Paiement en attente'
    WHEN 'PAIEMENT_ECHOUE' THEN 'Paiement échoué'
    WHEN 'PAIEMENT_RETENTE' THEN 'Retentative paiement'
    WHEN 'DEVIS' THEN 'Devis reçu'
    WHEN 'DEVIS_VALIDE' THEN 'Devis validé'
    WHEN 'TRAVAUX' THEN 'Travaux en cours'
    WHEN 'FIN' THEN 'Fin travaux'
    WHEN 'TERMINE' THEN 'Projet terminé'
    ELSE h.nouveau_statut
  END as nouveau_statut_formatted,
  h.user_id,
  p.full_name as user_full_name,
  p.email as user_email,
  h.commentaire,
  h.timestamp,
  h.metadata,
  projet.titre as projet_titre
FROM projet_statut_historique h
LEFT JOIN public.profiles p ON h.user_id = p.id
LEFT JOIN public.projets projet ON h.projet_id = projet.id
ORDER BY h.timestamp DESC;

COMMENT ON VIEW projet_statut_historique_formatted IS 'Vue de l''historique des statuts avec noms formatés';

-- Fonction de statistiques sur les changements de statut
CREATE OR REPLACE FUNCTION get_statistiques_changements_statut()
RETURNS TABLE (
  total_changements INTEGER,
  changements_par_statut JSONB,
  changements_par_utilisateur JSONB,
  changements_par_jour JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH changements_statut AS (
    SELECT 
      nouveau_statut,
      COUNT(*) as count
    FROM projet_statut_historique
    GROUP BY nouveau_statut
  ),
  changements_utilisateur AS (
    SELECT 
      p.full_name,
      COUNT(*) as count
    FROM projet_statut_historique h
    LEFT JOIN public.profiles p ON h.user_id = p.id
    WHERE h.user_id IS NOT NULL
    GROUP BY p.full_name
  ),
  changements_jour AS (
    SELECT 
      DATE(timestamp) as jour,
      COUNT(*) as count
    FROM projet_statut_historique
    GROUP BY DATE(timestamp)
    ORDER BY jour DESC
    LIMIT 30
  )
  SELECT 
    COUNT(*) as total_changements,
    jsonb_agg(jsonb_build_object('statut', nouveau_statut, 'count', count)) as changements_par_statut,
    jsonb_agg(jsonb_build_object('utilisateur', full_name, 'count', count)) as changements_par_utilisateur,
    jsonb_agg(jsonb_build_object('jour', jour, 'count', count)) as changements_par_jour
  FROM projet_statut_historique
  CROSS JOIN changements_statut
  CROSS JOIN changements_utilisateur
  CROSS JOIN changements_jour;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour logger automatiquement les changements de statut
CREATE OR REPLACE FUNCTION trigger_logger_changement_statut_projet()
RETURNS TRIGGER AS $$
DECLARE
  commentaire TEXT;
BEGIN
  -- Générer un commentaire automatique basé sur le changement
  IF NEW.statut = 'DEVIS' AND OLD.statut = 'PAIEMENT_ATTENTE' THEN
    commentaire := 'Paiement validé, projet prêt pour devis';
  ELSIF NEW.statut = 'TRAVAUX' AND OLD.statut = 'DEVIS_VALIDE' THEN
    commentaire := 'Devis validé, début des travaux';
  ELSIF NEW.statut = 'TERMINE' AND OLD.statut = 'FIN' THEN
    commentaire := 'Projets terminés avec succès';
  ELSE
    commentaire := 'Changement de statut automatique';
  END IF;
  
  -- Logger le changement
  INSERT INTO projet_statut_historique (
    projet_id, ancien_statut, nouveau_statut, commentaire
  )
  VALUES (
    NEW.id, OLD.statut, NEW.statut, commentaire
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger sur la table projets
DROP TRIGGER IF EXISTS trigger_logger_changement_statut_projet ON public.projets;
CREATE TRIGGER trigger_logger_changement_statut_projet
  AFTER UPDATE ON public.projets
  FOR EACH ROW
  WHEN (OLD.statut IS DISTINCT FROM NEW.statut)
  EXECUTE FUNCTION trigger_logger_changement_statut_projet();

-- Ajout de colonnes à la table projets si elles n'existent pas
DO $$
BEGIN
  -- Ajouter matched_at si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projets' 
    AND column_name = 'matched_at'
  ) THEN
    ALTER TABLE public.projets 
    ADD COLUMN matched_at TIMESTAMP WITH TIME ZONE;
    COMMENT ON COLUMN public.projets.matched_at IS 'Date du match avec un professionnel';
  END IF;
  
  -- Ajouter frais_mise_en_relation si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projets' 
    AND column_name = 'frais_mise_en_relation'
  ) THEN
    ALTER TABLE public.projets 
    ADD COLUMN frais_mise_en_relation DECIMAL(10,2);
    COMMENT ON COLUMN public.projets.frais_mise_en_relation IS 'Frais de mise en relation pour ce projet';
  END IF;
  
  -- Ajouter estimation si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projets' 
    AND column_name = 'estimation'
  ) THEN
    ALTER TABLE public.projets 
    ADD COLUMN estimation DECIMAL(10,2);
    COMMENT ON COLUMN public.projets.estimation IS 'Estimation du projet pour calcul des frais';
  END IF;
END $$;
