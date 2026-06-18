-- =====================================================
-- Fix: Correction du trigger de notification des tickets de support
-- Problème: Le trigger essaie d'accéder à auth.users ce qui cause une erreur de permission
-- Solution: Utiliser uniquement la table profiles pour récupérer les admins
-- =====================================================

-- Supprimer l'ancien trigger et fonction
DROP TRIGGER IF EXISTS trigger_notify_admins_new_support_ticket ON public.support_tickets;
DROP FUNCTION IF EXISTS notify_admins_new_support_ticket();

-- Créer la nouvelle fonction corrigée
CREATE OR REPLACE FUNCTION notify_admins_new_support_ticket()
RETURNS TRIGGER AS $$
DECLARE
  admin_record RECORD;
  notification_id UUID;
BEGIN
  -- Créer une notification pour chaque administrateur
  -- Utiliser uniquement la table profiles (pas auth.users)
  FOR admin_record IN 
    SELECT user_id, email
    FROM public.profiles
    WHERE role IN ('admin', 'moderator')
    AND email IS NOT NULL
  LOOP
    -- Insérer une notification dans la table notifications
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      link,
      metadata,
      created_at
    ) VALUES (
      admin_record.user_id,
      'support_ticket',
      'Nouveau ticket de support',
      format('Nouveau message de support de %s: %s', NEW.name, NEW.subject),
      '/admin/support-tickets/' || NEW.id::text,
      jsonb_build_object(
        'ticket_id', NEW.id,
        'sender_name', NEW.name,
        'sender_email', NEW.email,
        'subject', NEW.subject,
        'request_type', NEW.request_type
      ),
      NOW()
    ) RETURNING id INTO notification_id;
    
    -- Log de la notification créée
    RAISE NOTICE 'Notification créée pour admin % (ticket %)', admin_record.user_id, NEW.id;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer le trigger
CREATE TRIGGER trigger_notify_admins_new_support_ticket
  AFTER INSERT ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_new_support_ticket();

-- Vérifier que le trigger est bien créé
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_notify_admins_new_support_ticket';

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Trigger de notification des tickets de support corrigé avec succès';
  RAISE NOTICE '   - Le trigger utilise maintenant uniquement la table profiles';
  RAISE NOTICE '   - Plus d''erreur de permission sur auth.users';
END $$;
