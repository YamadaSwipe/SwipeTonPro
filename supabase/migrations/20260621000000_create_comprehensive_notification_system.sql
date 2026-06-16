-- =====================================================
-- MIGRATION: Système Complet de Notifications
-- Date: 21 juin 2026
-- Description: Création d'un système de notifications avec triggers automatiques
-- =====================================================

-- -----------------------------------------------------
-- 1. AMÉLIORATION DE LA TABLE NOTIFICATIONS
--    Ajout de colonnes manquantes pour un système complet
-- -----------------------------------------------------

-- Vérifier si la table existe déjà et l'améliorer
DO $$ 
BEGIN
  -- Ajouter la colonne is_read si elle n'existe pas (compatibilité)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'is_read'
  ) THEN
    ALTER TABLE notifications ADD COLUMN is_read BOOLEAN DEFAULT false;
  END IF;

  -- Ajouter read_at si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'read_at'
  ) THEN
    ALTER TABLE notifications ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Migrer les données de 'read' vers 'is_read' si nécessaire
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'read'
  ) THEN
    UPDATE notifications SET is_read = read WHERE is_read IS NULL;
  END IF;
END $$;

-- Créer des index pour les performances
CREATE INDEX IF NOT EXISTS idx_notifications_user_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_desc ON notifications(created_at DESC);

-- Commentaires pour documentation
COMMENT ON TABLE notifications IS 'Système de notifications pour tous les utilisateurs (particuliers, professionnels, modérateurs, admins)';
COMMENT ON COLUMN notifications.type IS 'Type de notification: match_mutual, mini_message, credit_purchase, report_signal, new_project, new_profile, system_activity';
COMMENT ON COLUMN notifications.is_read IS 'Indique si la notification a été lue';
COMMENT ON COLUMN notifications.read_at IS 'Date et heure de lecture de la notification';
COMMENT ON COLUMN notifications.data IS 'Données JSON additionnelles (project_id, professional_id, etc.)';

-- -----------------------------------------------------
-- 2. FONCTION: Créer une notification
--    Fonction utilitaire pour créer des notifications
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data, is_read, created_at)
  VALUES (p_user_id, p_type, p_title, p_message, p_data, false, NOW())
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

COMMENT ON FUNCTION create_notification IS 'Fonction utilitaire pour créer une notification';

-- -----------------------------------------------------
-- 3. TRIGGER: Notification de Match Mutuel
--    Alerte immédiate quand un match est confirmé
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION notify_mutual_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_title TEXT;
  v_client_id UUID;
  v_professional_id UUID;
  v_professional_name TEXT;
  v_client_name TEXT;
BEGIN
  -- Vérifier si c'est un match confirmé (status = 'matched' ou 'payment_validated')
  IF NEW.status IN ('matched', 'payment_validated') AND 
     (OLD.status IS NULL OR OLD.status NOT IN ('matched', 'payment_validated')) THEN
    
    -- Récupérer les informations du projet
    SELECT p.title, p.client_id, pi.professional_id
    INTO v_project_title, v_client_id, v_professional_id
    FROM projects p
    JOIN project_interests pi ON pi.project_id = p.id
    WHERE pi.id = NEW.id;
    
    -- Récupérer les noms
    SELECT full_name INTO v_client_name FROM profiles WHERE id = v_client_id;
    SELECT company_name INTO v_professional_name FROM professionals WHERE id = v_professional_id;
    
    -- Notification pour le PARTICULIER
    PERFORM create_notification(
      v_client_id,
      'match_mutual',
      '🎉 Match confirmé !',
      format('Votre match avec %s pour le projet "%s" est confirmé. Vous pouvez maintenant communiquer directement.', 
        COALESCE(v_professional_name, 'le professionnel'), v_project_title),
      jsonb_build_object(
        'project_id', NEW.project_id,
        'professional_id', v_professional_id,
        'match_id', NEW.id
      )
    );
    
    -- Notification pour le PROFESSIONNEL
    PERFORM create_notification(
      (SELECT user_id FROM professionals WHERE id = v_professional_id),
      'match_mutual',
      '🎉 Match confirmé !',
      format('Votre match avec %s pour le projet "%s" est confirmé. Contactez le client dès maintenant.', 
        COALESCE(v_client_name, 'le client'), v_project_title),
      jsonb_build_object(
        'project_id', NEW.project_id,
        'client_id', v_client_id,
        'match_id', NEW.id
      )
    );
    
    RAISE NOTICE 'Notifications de match mutuel créées pour project_interest_id=%', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_notify_mutual_match ON project_interests;
CREATE TRIGGER trigger_notify_mutual_match
  AFTER INSERT OR UPDATE ON project_interests
  FOR EACH ROW
  EXECUTE FUNCTION notify_mutual_match();

COMMENT ON FUNCTION notify_mutual_match IS 'Notifie les utilisateurs lors d''un match mutuel confirmé';

-- -----------------------------------------------------
-- 4. TRIGGER: Notification de Mini-Message
--    Alerte lors de la réception d'un mini-message
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION notify_mini_message_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sender_name TEXT;
  v_project_title TEXT;
BEGIN
  -- Récupérer le nom de l'expéditeur
  SELECT full_name INTO v_sender_name 
  FROM profiles 
  WHERE id = NEW.sender_id;
  
  -- Récupérer le titre du projet si disponible
  IF NEW.project_id IS NOT NULL THEN
    SELECT title INTO v_project_title 
    FROM projects 
    WHERE id = NEW.project_id;
  END IF;
  
  -- Notification pour le DESTINATAIRE
  PERFORM create_notification(
    NEW.receiver_id,
    'mini_message',
    '💬 Nouveau mini-message',
    format('Vous avez reçu un mini-message de %s%s', 
      COALESCE(v_sender_name, 'un utilisateur'),
      CASE WHEN v_project_title IS NOT NULL THEN format(' concernant "%s"', v_project_title) ELSE '' END
    ),
    jsonb_build_object(
      'message_id', NEW.id,
      'sender_id', NEW.sender_id,
      'project_id', NEW.project_id,
      'preview', LEFT(NEW.content, 50)
    )
  );
  
  RAISE NOTICE 'Notification mini-message créée pour receiver_id=%', NEW.receiver_id;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_notify_mini_message ON mini_messages;
CREATE TRIGGER trigger_notify_mini_message
  AFTER INSERT ON mini_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_mini_message_received();

COMMENT ON FUNCTION notify_mini_message_received IS 'Notifie le destinataire lors de la réception d''un mini-message';

-- -----------------------------------------------------
-- 5. TRIGGER: Notification d'Achat de Crédits
--    Alerte de confirmation d'achat de pack de crédits
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION notify_credit_purchase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_pack_name TEXT;
  v_admin_ids UUID[];
BEGIN
  -- Vérifier si le statut passe à 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Récupérer l'user_id du professionnel
    SELECT user_id INTO v_user_id 
    FROM professionals 
    WHERE id = NEW.professional_id;
    
    -- Récupérer le nom du pack
    SELECT name INTO v_pack_name 
    FROM credit_packs 
    WHERE id = NEW.credit_pack_id;
    
    -- Notification pour le PROFESSIONNEL
    PERFORM create_notification(
      v_user_id,
      'credit_purchase',
      '✅ Achat de crédits confirmé',
      format('Votre achat de %s crédits (%s) a été confirmé. Vos crédits sont maintenant disponibles.', 
        NEW.total_credits, COALESCE(v_pack_name, 'pack de crédits')),
      jsonb_build_object(
        'purchase_id', NEW.id,
        'credits_amount', NEW.total_credits,
        'price_paid', NEW.price_paid_euros
      )
    );
    
    -- Notification pour les ADMINISTRATEURS
    SELECT ARRAY_AGG(id) INTO v_admin_ids
    FROM profiles
    WHERE role IN ('admin', 'super_admin');
    
    IF v_admin_ids IS NOT NULL THEN
      FOR i IN 1..array_length(v_admin_ids, 1) LOOP
        PERFORM create_notification(
          v_admin_ids[i],
          'credit_purchase_admin',
          '💰 Nouvel achat de crédits',
          format('Un professionnel a acheté %s crédits pour %s€', 
            NEW.total_credits, NEW.price_paid_euros),
          jsonb_build_object(
            'purchase_id', NEW.id,
            'professional_id', NEW.professional_id,
            'credits_amount', NEW.total_credits,
            'price_paid', NEW.price_paid_euros
          )
        );
      END LOOP;
    END IF;
    
    RAISE NOTICE 'Notifications achat crédits créées pour purchase_id=%', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_notify_credit_purchase ON credit_pack_purchases;
CREATE TRIGGER trigger_notify_credit_purchase
  AFTER INSERT OR UPDATE ON credit_pack_purchases
  FOR EACH ROW
  EXECUTE FUNCTION notify_credit_purchase();

COMMENT ON FUNCTION notify_credit_purchase IS 'Notifie le professionnel et les admins lors d''un achat de crédits';

-- -----------------------------------------------------
-- 6. TRIGGER: Notification de Signalement (Report)
--    Alerte les modérateurs lors d'un signalement
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION notify_report_signal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_moderator_ids UUID[];
  v_reporter_name TEXT;
  v_target_type TEXT;
  v_target_name TEXT;
BEGIN
  -- Récupérer le nom du signaleur
  SELECT full_name INTO v_reporter_name 
  FROM profiles 
  WHERE id = NEW.reporter_id;
  
  -- Déterminer le type et le nom de la cible
  IF NEW.reported_profile_id IS NOT NULL THEN
    v_target_type := 'profil';
    SELECT full_name INTO v_target_name 
    FROM profiles 
    WHERE id = NEW.reported_profile_id;
  ELSIF NEW.reported_project_id IS NOT NULL THEN
    v_target_type := 'projet';
    SELECT title INTO v_target_name 
    FROM projects 
    WHERE id = NEW.reported_project_id;
  ELSE
    v_target_type := 'élément';
    v_target_name := 'inconnu';
  END IF;
  
  -- Récupérer tous les modérateurs et admins
  SELECT ARRAY_AGG(id) INTO v_moderator_ids
  FROM profiles
  WHERE role IN ('moderator', 'admin', 'super_admin');
  
  -- Notification pour chaque MODÉRATEUR
  IF v_moderator_ids IS NOT NULL THEN
    FOR i IN 1..array_length(v_moderator_ids, 1) LOOP
      PERFORM create_notification(
        v_moderator_ids[i],
        'report_signal',
        '🚨 Nouveau signalement',
        format('Un %s a été signalé par %s. Raison: %s', 
          v_target_type, 
          COALESCE(v_reporter_name, 'un utilisateur'),
          COALESCE(NEW.reason, 'Non spécifiée')),
        jsonb_build_object(
          'report_id', NEW.id,
          'reporter_id', NEW.reporter_id,
          'reported_profile_id', NEW.reported_profile_id,
          'reported_project_id', NEW.reported_project_id,
          'reason', NEW.reason,
          'severity', COALESCE(NEW.severity, 'medium')
        )
      );
    END LOOP;
  END IF;
  
  RAISE NOTICE 'Notifications signalement créées pour report_id=%', NEW.id;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger (si la table reports existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reports') THEN
    DROP TRIGGER IF EXISTS trigger_notify_report_signal ON reports;
    CREATE TRIGGER trigger_notify_report_signal
      AFTER INSERT ON reports
      FOR EACH ROW
      EXECUTE FUNCTION notify_report_signal();
  END IF;
END $$;

COMMENT ON FUNCTION notify_report_signal IS 'Notifie les modérateurs lors d''un signalement';

-- -----------------------------------------------------
-- 7. TRIGGER: Notification de Nouveau Projet
--    Alerte les modérateurs et admins lors d'un nouveau projet
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION notify_new_project()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_moderator_ids UUID[];
  v_admin_ids UUID[];
  v_client_name TEXT;
BEGIN
  -- Récupérer le nom du client
  SELECT full_name INTO v_client_name 
  FROM profiles 
  WHERE id = NEW.client_id;
  
  -- Récupérer les modérateurs
  SELECT ARRAY_AGG(id) INTO v_moderator_ids
  FROM profiles
  WHERE role = 'moderator';
  
  -- Récupérer les admins
  SELECT ARRAY_AGG(id) INTO v_admin_ids
  FROM profiles
  WHERE role IN ('admin', 'super_admin');
  
  -- Notification pour les MODÉRATEURS
  IF v_moderator_ids IS NOT NULL THEN
    FOR i IN 1..array_length(v_moderator_ids, 1) LOOP
      PERFORM create_notification(
        v_moderator_ids[i],
        'new_project',
        '📋 Nouveau projet à valider',
        format('Un nouveau projet "%s" a été créé par %s et nécessite validation.', 
          NEW.title, COALESCE(v_client_name, 'un client')),
        jsonb_build_object(
          'project_id', NEW.id,
          'client_id', NEW.client_id,
          'category', NEW.category,
          'budget_min', NEW.budget_min,
          'budget_max', NEW.budget_max
        )
      );
    END LOOP;
  END IF;
  
  -- Notification pour les ADMINISTRATEURS
  IF v_admin_ids IS NOT NULL THEN
    FOR i IN 1..array_length(v_admin_ids, 1) LOOP
      PERFORM create_notification(
        v_admin_ids[i],
        'new_project',
        '📋 Nouveau projet créé',
        format('Nouveau projet "%s" créé par %s.', 
          NEW.title, COALESCE(v_client_name, 'un client')),
        jsonb_build_object(
          'project_id', NEW.id,
          'client_id', NEW.client_id,
          'category', NEW.category,
          'budget_min', NEW.budget_min,
          'budget_max', NEW.budget_max
        )
      );
    END LOOP;
  END IF;
  
  RAISE NOTICE 'Notifications nouveau projet créées pour project_id=%', NEW.id;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_notify_new_project ON projects;
CREATE TRIGGER trigger_notify_new_project
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_project();

COMMENT ON FUNCTION notify_new_project IS 'Notifie les modérateurs et admins lors de la création d''un nouveau projet';

-- -----------------------------------------------------
-- 8. TRIGGER: Notification de Nouveau Profil Pro
--    Alerte les modérateurs lors d'une nouvelle inscription pro
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION notify_new_professional()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_moderator_ids UUID[];
  v_user_email TEXT;
BEGIN
  -- Récupérer l'email de l'utilisateur
  SELECT email INTO v_user_email 
  FROM profiles 
  WHERE id = NEW.user_id;
  
  -- Récupérer les modérateurs
  SELECT ARRAY_AGG(id) INTO v_moderator_ids
  FROM profiles
  WHERE role IN ('moderator', 'admin', 'super_admin');
  
  -- Notification pour les MODÉRATEURS
  IF v_moderator_ids IS NOT NULL THEN
    FOR i IN 1..array_length(v_moderator_ids, 1) LOOP
      PERFORM create_notification(
        v_moderator_ids[i],
        'new_profile_pro',
        '👷 Nouveau professionnel inscrit',
        format('Un nouveau professionnel "%s" s''est inscrit et nécessite validation.', 
          COALESCE(NEW.company_name, v_user_email)),
        jsonb_build_object(
          'professional_id', NEW.id,
          'user_id', NEW.user_id,
          'company_name', NEW.company_name,
          'specialties', NEW.specialties
        )
      );
    END LOOP;
  END IF;
  
  RAISE NOTICE 'Notifications nouveau professionnel créées pour professional_id=%', NEW.id;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_notify_new_professional ON professionals;
CREATE TRIGGER trigger_notify_new_professional
  AFTER INSERT ON professionals
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_professional();

COMMENT ON FUNCTION notify_new_professional IS 'Notifie les modérateurs lors de l''inscription d''un nouveau professionnel';

-- -----------------------------------------------------
-- 9. TRIGGER: Notification d'Activité Système Majeure
--    Alerte les admins lors d'événements système importants
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION notify_system_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_ids UUID[];
  v_activity_description TEXT;
BEGIN
  -- Déterminer le type d'activité
  IF TG_TABLE_NAME = 'match_transactions' AND NEW.status = 'completed' THEN
    v_activity_description := format('Transaction de matching complétée: %s€', NEW.amount_euros);
  ELSIF TG_TABLE_NAME = 'credit_transactions' AND NEW.type = 'refund' THEN
    v_activity_description := format('Remboursement de crédits: %s crédits', NEW.amount);
  ELSE
    RETURN NEW; -- Ignorer les autres cas
  END IF;
  
  -- Récupérer les admins
  SELECT ARRAY_AGG(id) INTO v_admin_ids
  FROM profiles
  WHERE role IN ('admin', 'super_admin');
  
  -- Notification pour les ADMINISTRATEURS
  IF v_admin_ids IS NOT NULL THEN
    FOR i IN 1..array_length(v_admin_ids, 1) LOOP
      PERFORM create_notification(
        v_admin_ids[i],
        'system_activity',
        '⚙️ Activité système importante',
        v_activity_description,
        jsonb_build_object(
          'table', TG_TABLE_NAME,
          'record_id', NEW.id,
          'timestamp', NOW()
        )
      );
    END LOOP;
  END IF;
  
  RAISE NOTICE 'Notifications activité système créées pour %=%', TG_TABLE_NAME, NEW.id;
  
  RETURN NEW;
END;
$$;

-- Créer les triggers pour les activités système
DROP TRIGGER IF EXISTS trigger_notify_match_transaction ON match_transactions;
CREATE TRIGGER trigger_notify_match_transaction
  AFTER INSERT OR UPDATE ON match_transactions
  FOR EACH ROW
  EXECUTE FUNCTION notify_system_activity();

DROP TRIGGER IF EXISTS trigger_notify_credit_refund ON credit_transactions;
CREATE TRIGGER trigger_notify_credit_refund
  AFTER INSERT ON credit_transactions
  FOR EACH ROW
  WHEN (NEW.type = 'refund')
  EXECUTE FUNCTION notify_system_activity();

COMMENT ON FUNCTION notify_system_activity IS 'Notifie les admins lors d''activités système importantes';

-- -----------------------------------------------------
-- 10. POLITIQUES RLS POUR LES NOTIFICATIONS
--     Sécuriser l'accès aux notifications
-- -----------------------------------------------------

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

-- Activer RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir leurs propres notifications
CREATE POLICY "users_view_own_notifications" ON notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Politique: Les utilisateurs peuvent marquer leurs notifications comme lues
CREATE POLICY "users_update_own_notifications" ON notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Politique: Les utilisateurs peuvent supprimer leurs notifications
CREATE POLICY "users_delete_own_notifications" ON notifications
  FOR DELETE
  USING (user_id = auth.uid());

-- Politique: Le système peut créer des notifications pour tous
CREATE POLICY "system_create_notifications" ON notifications
  FOR INSERT
  WITH CHECK (true);

-- -----------------------------------------------------
-- 11. FONCTION: Marquer toutes les notifications comme lues
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications
  SET is_read = true, read_at = NOW()
  WHERE user_id = p_user_id AND is_read = false;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION mark_all_notifications_read IS 'Marque toutes les notifications d''un utilisateur comme lues';

-- -----------------------------------------------------
-- 12. FONCTION: Obtenir le nombre de notifications non lues
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_unread_notifications_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM notifications
  WHERE user_id = p_user_id AND is_read = false;
  
  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION get_unread_notifications_count IS 'Retourne le nombre de notifications non lues pour un utilisateur';

-- -----------------------------------------------------
-- 13. VUE: Statistiques des notifications
-- -----------------------------------------------------
CREATE OR REPLACE VIEW notification_stats AS
SELECT 
  type,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE is_read = false) as unread_count,
  COUNT(*) FILTER (WHERE is_read = true) as read_count,
  AVG(EXTRACT(EPOCH FROM (read_at - created_at))) FILTER (WHERE read_at IS NOT NULL) as avg_read_time_seconds
FROM notifications
GROUP BY type;

COMMENT ON VIEW notification_stats IS 'Statistiques globales des notifications par type';

-- -----------------------------------------------------
-- 14. NETTOYAGE: Supprimer les anciennes notifications
--     Fonction à exécuter périodiquement (cron job)
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION cleanup_old_notifications(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL
    AND is_read = true;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Supprimé % notifications de plus de % jours', v_deleted_count, days_to_keep;
  
  RETURN v_deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_old_notifications IS 'Supprime les notifications lues de plus de X jours (par défaut 90)';

-- -----------------------------------------------------
-- RÉSUMÉ DE LA MIGRATION
-- -----------------------------------------------------
DO $$
BEGIN
  RAISE NOTICE '
  ========================================
  ✅ SYSTÈME DE NOTIFICATIONS INSTALLÉ
  ========================================
  
  📋 Triggers créés:
  - Match mutuel confirmé
  - Réception de mini-message
  - Achat de crédits
  - Signalement (report)
  - Nouveau projet
  - Nouveau profil professionnel
  - Activités système majeures
  
  🔒 Sécurité:
  - RLS activé sur la table notifications
  - Politiques de sécurité configurées
  
  🛠️ Fonctions utilitaires:
  - create_notification()
  - mark_all_notifications_read()
  - get_unread_notifications_count()
  - cleanup_old_notifications()
  
  📊 Vue statistiques:
  - notification_stats
  
  ========================================
  ';
END $$;
