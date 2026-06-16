-- =====================================================
-- MIGRATION: Amélioration des Messages de Notifications
-- Date: 26 juin 2026
-- Description: Amélioration des messages de notifications selon le rôle utilisateur
-- =====================================================

-- -----------------------------------------------------
-- 1. AMÉLIORATION DU TRIGGER: Notification de Match Mutuel
--    Messages personnalisés selon le rôle
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
  v_professional_user_id UUID;
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
    SELECT company_name, user_id INTO v_professional_name, v_professional_user_id 
    FROM professionals WHERE id = v_professional_id;
    
    -- Notification pour le PARTICULIER
    -- Message: "Un artisan a validé votre projet ! Restez bien sur le site pour échanger en toute sécurité."
    PERFORM create_notification(
      v_client_id,
      'match_mutual',
      '🎉 Un artisan a validé votre projet !',
      format('Un artisan a validé votre projet "%s". Restez bien sur le site pour échanger en toute sécurité et organiser votre rendez-vous.', 
        v_project_title),
      jsonb_build_object(
        'project_id', NEW.project_id,
        'professional_id', v_professional_id,
        'match_id', NEW.id
      )
    );
    
    -- Notification pour le PROFESSIONNEL
    -- Message: "Nouveau Match ! [Nom du particulier] est intéressé par votre profil. Débloquez le contact pour voir le projet."
    PERFORM create_notification(
      v_professional_user_id,
      'match_mutual',
      '🎉 Nouveau Match !',
      format('Nouveau Match ! %s est intéressé par votre profil. Débloquez le contact pour voir le projet "%s" et organiser un rendez-vous.', 
        COALESCE(v_client_name, 'Un particulier'), v_project_title),
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

COMMENT ON FUNCTION notify_mutual_match IS 'Notifie les utilisateurs lors d''un match mutuel confirmé avec messages personnalisés';

-- -----------------------------------------------------
-- 2. AMÉLIORATION DU TRIGGER: Notification de Validation de Compte Pro
--    Nouveau trigger pour notifier quand un compte pro est validé
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION notify_professional_validated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_company_name TEXT;
BEGIN
  -- Vérifier si le statut passe à 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    
    v_user_id := NEW.user_id;
    v_company_name := NEW.company_name;
    
    -- Notification pour le PROFESSIONNEL
    -- Message: "Votre compte a été validé par l'administration, vous pouvez postuler."
    PERFORM create_notification(
      v_user_id,
      'account_validated',
      '✅ Votre compte a été validé !',
      format('Félicitations %s ! Votre compte a été validé par l''administration. Vous pouvez maintenant postuler aux projets et développer votre activité.', 
        COALESCE(v_company_name, 'Professionnel')),
      jsonb_build_object(
        'professional_id', NEW.id,
        'company_name', v_company_name
      )
    );
    
    RAISE NOTICE 'Notification validation compte pro créée pour professional_id=%', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_notify_professional_validated ON professionals;
CREATE TRIGGER trigger_notify_professional_validated
  AFTER INSERT OR UPDATE ON professionals
  FOR EACH ROW
  EXECUTE FUNCTION notify_professional_validated();

COMMENT ON FUNCTION notify_professional_validated IS 'Notifie le professionnel quand son compte est validé par l''administration';

-- -----------------------------------------------------
-- 3. AMÉLIORATION DU TRIGGER: Notification de Nouveau Document Pro
--    Alerte les admins quand un nouveau document est uploadé
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION notify_new_professional_document()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_ids UUID[];
  v_professional_name TEXT;
  v_document_type TEXT;
BEGIN
  -- Récupérer le nom du professionnel
  SELECT company_name INTO v_professional_name 
  FROM professionals 
  WHERE id = NEW.professional_id;
  
  -- Déterminer le type de document
  v_document_type := COALESCE(NEW.document_type, 'Document');
  
  -- Récupérer tous les admins
  SELECT ARRAY_AGG(id) INTO v_admin_ids
  FROM profiles
  WHERE role IN ('admin', 'super_admin');
  
  -- Notification pour chaque ADMIN
  -- Message: "Nouveau document pro à vérifier"
  IF v_admin_ids IS NOT NULL THEN
    FOR i IN 1..array_length(v_admin_ids, 1) LOOP
      PERFORM create_notification(
        v_admin_ids[i],
        'new_document_pro',
        '📄 Nouveau document pro à vérifier',
        format('Nouveau document pro à vérifier : %s de %s. Vérifiez et validez le document pour permettre au professionnel de postuler.', 
          v_document_type,
          COALESCE(v_professional_name, 'un professionnel')),
        jsonb_build_object(
          'document_id', NEW.id,
          'professional_id', NEW.professional_id,
          'document_type', v_document_type
        )
      );
    END LOOP;
  END IF;
  
  RAISE NOTICE 'Notifications nouveau document pro créées pour document_id=%', NEW.id;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger (si la table professional_documents existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'professional_documents') THEN
    DROP TRIGGER IF EXISTS trigger_notify_new_professional_document ON professional_documents;
    CREATE TRIGGER trigger_notify_new_professional_document
      AFTER INSERT ON professional_documents
      FOR EACH ROW
      EXECUTE FUNCTION notify_new_professional_document();
  END IF;
END $$;

COMMENT ON FUNCTION notify_new_professional_document IS 'Notifie les admins lors de l''upload d''un nouveau document professionnel';

-- -----------------------------------------------------
-- 4. AMÉLIORATION DU TRIGGER: Notification de Nouveau Ticket Support
--    Alerte les admins quand un nouveau ticket est créé
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION notify_new_support_ticket()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_ids UUID[];
  v_user_name TEXT;
  v_user_email TEXT;
BEGIN
  -- Récupérer les infos de l'utilisateur
  SELECT full_name, email INTO v_user_name, v_user_email 
  FROM profiles 
  WHERE id = NEW.user_id;
  
  -- Récupérer tous les admins
  SELECT ARRAY_AGG(id) INTO v_admin_ids
  FROM profiles
  WHERE role IN ('admin', 'super_admin', 'moderator');
  
  -- Notification pour chaque ADMIN
  -- Message: "Nouveau ticket de support reçu"
  IF v_admin_ids IS NOT NULL THEN
    FOR i IN 1..array_length(v_admin_ids, 1) LOOP
      PERFORM create_notification(
        v_admin_ids[i],
        'new_support_ticket',
        '🎫 Nouveau ticket de support reçu',
        format('Nouveau ticket de support reçu de %s (%s). Sujet : "%s". Priorité : %s. Traitez ce ticket rapidement pour assurer la satisfaction client.', 
          COALESCE(v_user_name, 'un utilisateur'),
          COALESCE(v_user_email, 'email inconnu'),
          COALESCE(NEW.subject, 'Sans sujet'),
          COALESCE(NEW.priority, 'normale')),
        jsonb_build_object(
          'ticket_id', NEW.id,
          'user_id', NEW.user_id,
          'subject', NEW.subject,
          'priority', NEW.priority,
          'category', NEW.category
        )
      );
    END LOOP;
  END IF;
  
  RAISE NOTICE 'Notifications nouveau ticket support créées pour ticket_id=%', NEW.id;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger (si la table support_tickets existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'support_tickets') THEN
    DROP TRIGGER IF EXISTS trigger_notify_new_support_ticket ON support_tickets;
    CREATE TRIGGER trigger_notify_new_support_ticket
      AFTER INSERT ON support_tickets
      FOR EACH ROW
      EXECUTE FUNCTION notify_new_support_ticket();
  END IF;
END $$;

COMMENT ON FUNCTION notify_new_support_ticket IS 'Notifie les admins lors de la création d''un nouveau ticket de support';

-- -----------------------------------------------------
-- 5. AMÉLIORATION DU TRIGGER: Notification de Nouveau Projet
--    Messages améliorés pour les admins
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
        format('Nouveau projet à valider : "%s" créé par %s. Vérifiez la qualité du projet et validez-le pour le publier aux professionnels.', 
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
        format('Nouveau projet créé : "%s" par %s. Budget : %s - %s €. Surveillez la validation et la qualité du projet.', 
          NEW.title, 
          COALESCE(v_client_name, 'un client'),
          COALESCE(NEW.budget_min::TEXT, '0'),
          COALESCE(NEW.budget_max::TEXT, 'Non défini')),
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

COMMENT ON FUNCTION notify_new_project IS 'Notifie les modérateurs et admins lors de la création d''un nouveau projet avec messages améliorés';

-- -----------------------------------------------------
-- 6. AMÉLIORATION DU TRIGGER: Notification de Nouveau Profil Pro
--    Messages améliorés pour les admins
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
  
  -- Notification pour les MODÉRATEURS/ADMINS
  -- Message: "Nouveau document pro à vérifier" (car inscription = documents à vérifier)
  IF v_moderator_ids IS NOT NULL THEN
    FOR i IN 1..array_length(v_moderator_ids, 1) LOOP
      PERFORM create_notification(
        v_moderator_ids[i],
        'new_profile_pro',
        '👷 Nouveau professionnel inscrit',
        format('Nouveau professionnel inscrit : "%s" (%s). Vérifiez les documents et validez le compte pour permettre au professionnel de postuler aux projets.', 
          COALESCE(NEW.company_name, v_user_email),
          COALESCE(v_user_email, 'email inconnu')),
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

COMMENT ON FUNCTION notify_new_professional IS 'Notifie les modérateurs lors de l''inscription d''un nouveau professionnel avec message amélioré';

-- -----------------------------------------------------
-- RÉSUMÉ DE LA MIGRATION
-- -----------------------------------------------------
DO $$
BEGIN
  RAISE NOTICE '
  ========================================
  ✅ MESSAGES DE NOTIFICATIONS AMÉLIORÉS
  ========================================
  
  📋 Triggers mis à jour:
  - Match mutuel : Messages personnalisés par rôle
  - Validation compte pro : "Votre compte a été validé par l''administration, vous pouvez postuler"
  - Nouveau document pro : "Nouveau document pro à vérifier"
  - Nouveau ticket support : "Nouveau ticket de support reçu"
  - Nouveau projet : Messages améliorés pour admins
  - Nouveau professionnel : Messages améliorés pour admins
  
  🎯 Messages par rôle:
  - PROFESSIONNEL : "Nouveau Match ! [Nom] est intéressé. Débloquez le contact."
  - PARTICULIER : "Un artisan a validé votre projet ! Restez sur le site."
  - ADMIN : "Nouveau document pro à vérifier" / "Nouveau ticket de support reçu"
  
  ========================================
  ';
END $$;
