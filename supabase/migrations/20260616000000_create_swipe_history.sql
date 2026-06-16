-- =====================================================
-- MIGRATION: Création de la table swipe_history
-- Date: 16/06/2026
-- Auteur: Équipe Technique SwipeTonPro
-- Description: Historique complet de tous les swipes (like/dislike/maybe)
--              pour éviter les doublons et calculer les métriques
-- =====================================================

-- =====================================================
-- TABLE: swipe_history
-- =====================================================

CREATE TABLE IF NOT EXISTS swipe_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Qui a swipé
  swiper_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  swiper_type TEXT NOT NULL CHECK (swiper_type IN ('professional', 'client')),
  
  -- Sur quoi/qui
  target_id UUID NOT NULL,  -- project_id OU professional_id
  target_type TEXT NOT NULL CHECK (target_type IN ('project', 'professional')),
  
  -- Action effectuée
  action TEXT NOT NULL CHECK (action IN ('like', 'dislike', 'super_like', 'maybe')),
  
  -- Métadonnées
  matching_score DECIMAL(5,2),
  swipe_context JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte unique : un utilisateur ne peut swiper qu'une fois sur une cible
  CONSTRAINT unique_swipe UNIQUE (swiper_id, target_id, target_type)
);

-- =====================================================
-- INDEX pour performances
-- =====================================================

-- Index sur le swiper (pour récupérer l'historique d'un utilisateur)
CREATE INDEX idx_swipe_history_swiper 
  ON swipe_history(swiper_id, swiper_type);

-- Index sur la cible (pour savoir qui a swipé sur un projet/pro)
CREATE INDEX idx_swipe_history_target 
  ON swipe_history(target_id, target_type);

-- Index sur l'action (pour filtrer par type de swipe)
CREATE INDEX idx_swipe_history_action 
  ON swipe_history(action);

-- Index sur la date (pour trier chronologiquement)
CREATE INDEX idx_swipe_history_created_at 
  ON swipe_history(created_at DESC);

-- Index composé pour détecter les matchs réciproques
CREATE INDEX idx_swipe_history_match_detection 
  ON swipe_history(target_id, target_type, action) 
  WHERE action IN ('like', 'super_like');

-- Index pour exclure les projets déjà swipés (requête fréquente)
CREATE INDEX idx_swipe_history_exclude_swiped
  ON swipe_history(swiper_id, target_type)
  WHERE target_type = 'project';

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

ALTER TABLE swipe_history ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres swipes
CREATE POLICY "Users can view their own swipes"
  ON swipe_history FOR SELECT
  USING (auth.uid() = swiper_id);

-- Les utilisateurs peuvent créer leurs propres swipes
CREATE POLICY "Users can create their own swipes"
  ON swipe_history FOR INSERT
  WITH CHECK (auth.uid() = swiper_id);

-- Les utilisateurs peuvent mettre à jour leurs propres swipes (changer d'avis)
CREATE POLICY "Users can update their own swipes"
  ON swipe_history FOR UPDATE
  USING (auth.uid() = swiper_id);

-- Les admins peuvent tout voir
CREATE POLICY "Admins can view all swipes"
  ON swipe_history FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'super_admin')
    )
  );

-- =====================================================
-- COMMENTAIRES pour documentation
-- =====================================================

COMMENT ON TABLE swipe_history IS 
  'Historique complet de tous les swipes (like/dislike/maybe) pour éviter les doublons et calculer les métriques';

COMMENT ON COLUMN swipe_history.swiper_id IS 
  'ID de l''utilisateur qui a effectué le swipe (référence profiles.id)';

COMMENT ON COLUMN swipe_history.swiper_type IS 
  'Type de swiper: professional (artisan) ou client (particulier)';

COMMENT ON COLUMN swipe_history.target_id IS 
  'ID de la cible du swipe (project_id ou professional_id selon target_type)';

COMMENT ON COLUMN swipe_history.target_type IS 
  'Type de cible: project (projet) ou professional (artisan)';

COMMENT ON COLUMN swipe_history.action IS 
  'Action effectuée: like (intéressé), dislike (passer), super_like (très intéressé), maybe (plus tard)';

COMMENT ON COLUMN swipe_history.matching_score IS 
  'Score de compatibilité calculé au moment du swipe (0-100)';

COMMENT ON COLUMN swipe_history.swipe_context IS 
  'Contexte du swipe (localisation, heure, appareil, etc.) au format JSON';

-- =====================================================
-- VÉRIFICATION de la création
-- =====================================================

DO $$
BEGIN
  -- Vérifier que la table existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'swipe_history'
  ) THEN
    RAISE NOTICE '✅ Table swipe_history créée avec succès';
  ELSE
    RAISE EXCEPTION '❌ Erreur: Table swipe_history non créée';
  END IF;
  
  -- Vérifier les index
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'swipe_history' 
    AND indexname = 'idx_swipe_history_swiper'
  ) THEN
    RAISE NOTICE '✅ Index créés avec succès';
  ELSE
    RAISE WARNING '⚠️ Certains index pourraient être manquants';
  END IF;
  
  -- Vérifier RLS
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'swipe_history' 
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE '✅ RLS activé avec succès';
  ELSE
    RAISE WARNING '⚠️ RLS non activé';
  END IF;
END $$;
