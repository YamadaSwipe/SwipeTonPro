-- =====================================================
-- Migration: Système de tickets de support
-- Description: Création de la table support_tickets pour gérer les demandes de contact
-- Date: 2026-06-25
-- =====================================================

-- Créer la table support_tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informations de l'utilisateur
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  address TEXT,
  
  -- Détails du ticket
  request_type VARCHAR(100) NOT NULL DEFAULT 'Demande générale',
  subject VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  
  -- Statut et suivi
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  priority VARCHAR(20) NOT NULL DEFAULT 'normal',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Métadonnées
  ip_address INET,
  user_agent TEXT,
  source VARCHAR(50) DEFAULT 'contact_form',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  
  -- Contraintes
  CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed', 'spam')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_email ON public.support_tickets(email);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_support_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_support_tickets_updated_at();

-- Trigger pour notifier les administrateurs lors de la création d'un nouveau ticket
CREATE OR REPLACE FUNCTION notify_admins_new_support_ticket()
RETURNS TRIGGER AS $$
DECLARE
  admin_record RECORD;
  notification_id UUID;
BEGIN
  -- Créer une notification pour chaque administrateur
  FOR admin_record IN 
    SELECT u.id, p.email
    FROM auth.users u
    INNER JOIN public.profiles p ON u.id = p.user_id
    WHERE p.role IN ('admin', 'moderator')
    AND p.email IS NOT NULL
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
      admin_record.id,
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
    RAISE NOTICE 'Notification créée pour admin % (ticket %)', admin_record.id, NEW.id;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_admins_new_support_ticket
  AFTER INSERT ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_new_support_ticket();

-- Politiques RLS (Row Level Security)
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres tickets
CREATE POLICY "Users can view their own support tickets"
  ON public.support_tickets
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR email = (SELECT email FROM public.profiles WHERE user_id = auth.uid())
  );

-- Les administrateurs peuvent tout voir
CREATE POLICY "Admins can view all support tickets"
  ON public.support_tickets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

-- Tout le monde peut créer un ticket (même non connecté)
CREATE POLICY "Anyone can create support tickets"
  ON public.support_tickets
  FOR INSERT
  WITH CHECK (true);

-- Les administrateurs peuvent mettre à jour les tickets
CREATE POLICY "Admins can update support tickets"
  ON public.support_tickets
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

-- Les administrateurs peuvent supprimer les tickets (spam, etc.)
CREATE POLICY "Admins can delete support tickets"
  ON public.support_tickets
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

-- Fonction pour obtenir les statistiques des tickets
CREATE OR REPLACE FUNCTION get_support_tickets_stats()
RETURNS TABLE (
  total_tickets BIGINT,
  pending_tickets BIGINT,
  in_progress_tickets BIGINT,
  resolved_tickets BIGINT,
  avg_resolution_time INTERVAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_tickets,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_tickets,
    COUNT(*) FILTER (WHERE status = 'in_progress')::BIGINT as in_progress_tickets,
    COUNT(*) FILTER (WHERE status = 'resolved' OR status = 'closed')::BIGINT as resolved_tickets,
    AVG(resolved_at - created_at) FILTER (WHERE resolved_at IS NOT NULL) as avg_resolution_time
  FROM public.support_tickets;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires pour la documentation
COMMENT ON TABLE public.support_tickets IS 'Table pour stocker les tickets de support créés via le formulaire de contact';
COMMENT ON COLUMN public.support_tickets.user_id IS 'ID de l''utilisateur (NULL si non connecté)';
COMMENT ON COLUMN public.support_tickets.status IS 'Statut du ticket: pending, in_progress, resolved, closed, spam';
COMMENT ON COLUMN public.support_tickets.priority IS 'Priorité du ticket: low, normal, high, urgent';
COMMENT ON COLUMN public.support_tickets.assigned_to IS 'ID de l''administrateur assigné au ticket';

-- Insérer des données de test (optionnel, à supprimer en production)
-- INSERT INTO public.support_tickets (name, email, phone, subject, message, request_type)
-- VALUES 
--   ('Jean Dupont', 'jean.dupont@example.com', '0612345678', 'Question sur un projet', 'Bonjour, j''ai une question concernant...', 'Demande générale'),
--   ('Marie Martin', 'marie.martin@example.com', '0687654321', 'Problème technique', 'Je rencontre un problème avec...', 'Support technique');
