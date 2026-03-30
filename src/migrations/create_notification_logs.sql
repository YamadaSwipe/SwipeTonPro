-- Migration pour créer la table des logs de notifications
-- Pour traçabilité et audit des envois d'emails

CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    recipients TEXT[] NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
    error_message TEXT,
    user_id UUID REFERENCES public.profiles(id),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON public.notification_logs(type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON public.notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON public.notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON public.notification_logs(created_at);

-- RLS (Row Level Security) pour la sécurité
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Politique RLS : seul les admins peuvent voir tous les logs
CREATE POLICY "Admins can view all notification logs" ON public.notification_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.email IN ('admin@swipetonpro.com', 'support@swipetonpro.com')
        )
    );

-- Politique RLS : seul les admins peuvent insérer des logs
CREATE POLICY "Admins can insert notification logs" ON public.notification_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.email IN ('admin@swipetonpro.com', 'support@swipetonpro.com')
        )
    );

-- Commentaires pour documentation
COMMENT ON TABLE public.notification_logs IS 'Logs des notifications email pour audit et traçabilité';
COMMENT ON COLUMN public.notification_logs.type IS 'Type de notification (professional_interested, new_project_admin, etc.)';
COMMENT ON COLUMN public.notification_logs.recipients IS 'Liste des adresses email destinataires';
COMMENT ON COLUMN public.notification_logs.status IS 'Statut d''envoi (pending, sent, failed)';
COMMENT ON COLUMN public.notification_logs.error_message IS 'Message d''erreur si envoi échoué';
COMMENT ON COLUMN public.notification_logs.user_id IS 'ID utilisateur lié à la notification (pour traçabilité)';
COMMENT ON COLUMN public.notification_logs.priority IS 'Priorité de la notification (low, medium, high, urgent)';
