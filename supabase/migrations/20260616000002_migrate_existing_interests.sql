-- =====================================================
-- MIGRATION: Migration des données existantes vers swipe_history
-- Date: 16/06/2026
-- Auteur: Équipe Technique SwipeTonPro
-- Description: Migre les intérêts existants de project_interests vers swipe_history
--              pour assurer la compatibilité et éviter les doublons
-- =====================================================

-- =====================================================
-- ÉTAPE 1: Vérification avant migration
-- =====================================================

DO $$
DECLARE
  v_interests_count INTEGER;
  v_swipes_count INTEGER;
BEGIN
  -- Compter les intérêts existants
  SELECT COUNT(*) INTO v_interests_count FROM project_interests;
  
  -- Compter les swipes existants
  SELECT COUNT(*) INTO v_swipes_count FROM swipe_history;
  
  RAISE NOTICE '📊 État avant migration:';
  RAISE NOTICE '  - Intérêts dans project_interests: %', v_interests_count;
  RAISE NOTICE '  - Swipes dans swipe_history: %', v_swipes_count;
  
  IF v_interests_count = 0 THEN
    RAISE NOTICE '⚠️ Aucun intérêt à migrer';
  END IF;
END $$;

-- =====================================================
-- ÉTAPE 2: Migration des intérêts existants
-- =====================================================

-- Migrer les intérêts existants vers swipe_history
INSERT INTO swipe_history (
  swiper_id, 
  swiper_type, 
  target_id, 
  target_type, 
  action, 
  matching_score, 
  created_at,
  swipe_context
)
SELECT 
  p.user_id,                    -- swiper_id (user_id du professionnel)
  'professional',               -- swiper_type
  pi.project_id,                -- target_id
  'project',                    -- target_type
  CASE 
    WHEN pi.status IN ('interested', 'payment_pending', 'paid', 'accepted') THEN 'like'
    WHEN pi.status = 'rejected' THEN 'dislike'
    ELSE 'like'  -- Par défaut, considérer comme un like
  END,                          -- action
  NULL,                         -- matching_score (non disponible dans project_interests)
  pi.created_at,                -- created_at (garder la date originale)
  jsonb_build_object(
    'migrated_from', 'project_interests',
    'original_status', pi.status,
    'migration_date', NOW()
  )                             -- swipe_context (métadonnées de migration)
FROM project_interests pi
JOIN professionals p ON p.id = pi.professional_id
WHERE pi.status IN ('interested', 'payment_pending', 'paid', 'rejected', 'accepted')
ON CONFLICT (swiper_id, target_id, target_type) DO NOTHING;

-- =====================================================
-- ÉTAPE 3: Vérification après migration
-- =====================================================

DO $$
DECLARE
  v_interests_count INTEGER;
  v_swipes_count INTEGER;
  v_migrated_count INTEGER;
BEGIN
  -- Compter les intérêts
  SELECT COUNT(*) INTO v_interests_count FROM project_interests;
  
  -- Compter tous les swipes
  SELECT COUNT(*) INTO v_swipes_count FROM swipe_history;
  
  -- Compter les swipes migrés
  SELECT COUNT(*) INTO v_migrated_count 
  FROM swipe_history 
  WHERE swipe_context->>'migrated_from' = 'project_interests';
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 État après migration:';
  RAISE NOTICE '  - Intérêts dans project_interests: %', v_interests_count;
  RAISE NOTICE '  - Total swipes dans swipe_history: %', v_swipes_count;
  RAISE NOTICE '  - Swipes migrés: %', v_migrated_count;
  RAISE NOTICE '';
  
  IF v_migrated_count > 0 THEN
    RAISE NOTICE '✅ Migration réussie: % intérêts migrés vers swipe_history', v_migrated_count;
  ELSE
    RAISE NOTICE '⚠️ Aucun intérêt migré (peut-être déjà fait ou aucune donnée)';
  END IF;
END $$;

-- =====================================================
-- ÉTAPE 4: Statistiques détaillées
-- =====================================================

DO $$
DECLARE
  v_likes INTEGER;
  v_dislikes INTEGER;
  v_professionals INTEGER;
BEGIN
  -- Compter par type d'action
  SELECT 
    COUNT(*) FILTER (WHERE action = 'like'),
    COUNT(*) FILTER (WHERE action = 'dislike')
  INTO v_likes, v_dislikes
  FROM swipe_history
  WHERE swipe_context->>'migrated_from' = 'project_interests';
  
  -- Compter les professionnels uniques
  SELECT COUNT(DISTINCT swiper_id) INTO v_professionals
  FROM swipe_history
  WHERE swipe_context->>'migrated_from' = 'project_interests';
  
  RAISE NOTICE '📈 Statistiques de migration:';
  RAISE NOTICE '  - Likes migrés: %', v_likes;
  RAISE NOTICE '  - Dislikes migrés: %', v_dislikes;
  RAISE NOTICE '  - Professionnels concernés: %', v_professionals;
  RAISE NOTICE '';
END $$;

-- =====================================================
-- ÉTAPE 5: Vérification de l'intégrité
-- =====================================================

DO $$
DECLARE
  v_orphan_swipes INTEGER;
  v_invalid_refs INTEGER;
BEGIN
  -- Vérifier les swipes orphelins (swiper_id n'existe pas dans profiles)
  SELECT COUNT(*) INTO v_orphan_swipes
  FROM swipe_history sh
  WHERE NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = sh.swiper_id
  );
  
  -- Vérifier les références invalides (target_id n'existe pas dans projects)
  SELECT COUNT(*) INTO v_invalid_refs
  FROM swipe_history sh
  WHERE sh.target_type = 'project'
    AND NOT EXISTS (
      SELECT 1 FROM projects p WHERE p.id = sh.target_id
    );
  
  IF v_orphan_swipes > 0 THEN
    RAISE WARNING '⚠️ % swipes orphelins détectés (swiper_id invalide)', v_orphan_swipes;
  END IF;
  
  IF v_invalid_refs > 0 THEN
    RAISE WARNING '⚠️ % swipes avec target_id invalide', v_invalid_refs;
  END IF;
  
  IF v_orphan_swipes = 0 AND v_invalid_refs = 0 THEN
    RAISE NOTICE '✅ Intégrité des données vérifiée: aucun problème détecté';
  END IF;
END $$;

-- =====================================================
-- ÉTAPE 6: Créer une vue pour faciliter les requêtes
-- =====================================================

CREATE OR REPLACE VIEW swipe_history_with_details AS
SELECT 
  sh.id,
  sh.swiper_id,
  sh.swiper_type,
  sh.target_id,
  sh.target_type,
  sh.action,
  sh.matching_score,
  sh.created_at,
  sh.swipe_context,
  -- Détails du swiper (professionnel)
  p.full_name as swiper_name,
  p.email as swiper_email,
  pro.company_name as swiper_company,
  -- Détails de la cible (projet)
  proj.title as project_title,
  proj.category as project_category,
  proj.city as project_city,
  proj.status as project_status
FROM swipe_history sh
LEFT JOIN profiles p ON p.id = sh.swiper_id
LEFT JOIN professionals pro ON pro.user_id = sh.swiper_id
LEFT JOIN projects proj ON proj.id = sh.target_id AND sh.target_type = 'project';

COMMENT ON VIEW swipe_history_with_details IS 
  'Vue enrichie de swipe_history avec les détails du swiper et de la cible';

-- =====================================================
-- ÉTAPE 7: Message final
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '✅ MIGRATION TERMINÉE AVEC SUCCÈS';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Prochaines étapes:';
  RAISE NOTICE '  1. Vérifier les données migrées dans swipe_history';
  RAISE NOTICE '  2. Tester la fonction get_unswiped_projects()';
  RAISE NOTICE '  3. Déployer le nouveau code frontend';
  RAISE NOTICE '  4. Monitorer les performances';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ IMPORTANT:';
  RAISE NOTICE '  - La table project_interests est conservée pour compatibilité';
  RAISE NOTICE '  - Les nouveaux swipes seront enregistrés dans les deux tables';
  RAISE NOTICE '  - Vous pouvez supprimer project_interests après validation complète';
  RAISE NOTICE '';
END $$;
