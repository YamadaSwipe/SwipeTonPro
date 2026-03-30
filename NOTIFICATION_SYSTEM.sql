-- SYSTÈME DE NOTIFICATIONS COMPLET
-- Création des tables et triggers pour notifications automatiques

-- 1. Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    project_id UUID REFERENCES projects(id),
    type VARCHAR(50) NOT NULL, -- 'project_submitted', 'project_validated', 'project_published', 'professional_interested', 'professional_selected'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Données additionnelles
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des appels téléphoniques
CREATE TABLE IF NOT EXISTS project_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    user_id UUID REFERENCES auth.users(id), -- Qui a passé l'appel
    professional_id UUID REFERENCES profiles(id), -- Professionnel concerné
    call_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration INTEGER, -- Durée en minutes
    notes TEXT, -- Notes sur l'appel
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'completed', 'missed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Trigger notification nouveau projet
CREATE OR REPLACE FUNCTION notify_new_project()
RETURNS TRIGGER AS $$
BEGIN
    -- Notification admin
    INSERT INTO notifications (user_id, project_id, type, title, message, data)
    SELECT 
        p.id, 
        p.id,
        'project_submitted',
        'Nouveau projet à valider',
        'Un nouveau projet "' || p.title || '" a été déposé et attende votre validation.',
        json_build_object(
            'project_title', p.title,
            'client_email', p.client_email,
            'category', p.category,
            'budget_min', p.estimated_budget_min,
            'budget_max', p.estimated_budget_max
        )
    FROM projects p
    WHERE p.id = NEW.id;

    -- Notification support
    INSERT INTO notifications (user_id, project_id, type, title, message, data)
    SELECT 
        p.id, 
        p.id,
        'project_submitted',
        'Nouveau projet en attente',
        'Le projet "' || p.title || '" est en attente de validation.',
        json_build_object(
            'project_title', p.title,
            'client_id', p.client_id,
            'urgency', p.urgency
        )
    FROM projects p
    WHERE p.id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger notification validation projet
CREATE OR REPLACE FUNCTION notify_project_validation()
RETURNS TRIGGER AS $$
BEGIN
    -- Notification client
    INSERT INTO notifications (user_id, project_id, type, title, message, data)
    SELECT 
        p.client_id, 
        p.id,
        'project_validated',
        'Projet validé',
        'Votre projet "' || p.title || '" a été validé et sera publié prochainement.',
        json_build_object(
            'project_title', p.title,
            'validation_date', NOW(),
            'next_steps', array['Publication sur la homepage', 'Réception des propositions']
        )
    FROM projects p
    WHERE p.id = NEW.id;

    -- Notification équipe
    INSERT INTO notifications (user_id, project_id, type, title, message, data)
    SELECT 
        p.id, 
        p.id,
        'project_validated',
        'Projet à publier',
        'Le projet "' || p.title || '" a été validé. Préparer la publication.',
        json_build_object(
            'project_title', p.title,
            'client_id', p.client_id,
            'publication_ready', true
        )
    FROM projects p
    WHERE p.id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger notification publication projet
CREATE OR REPLACE FUNCTION notify_project_publication()
RETURNS TRIGGER AS $$
BEGIN
    -- Notification client
    INSERT INTO notifications (user_id, project_id, type, title, message, data)
    SELECT 
        p.client_id, 
        p.id,
        'project_published',
        'Projet publié',
        'Votre projet "' || p.title || '" est maintenant visible par les professionnels.',
        json_build_object(
            'project_title', p.title,
            'publication_date', NOW(),
            'view_url', '/projets/' || p.id
        )
    FROM projects p
    WHERE p.id = NEW.id;

    -- Notification professionnels correspondants
    INSERT INTO notifications (user_id, project_id, type, title, message, data)
    SELECT 
        pr.user_id, 
        p.id,
        'project_published',
        'Nouveau projet correspondant',
        'Un nouveau projet "' || p.title || '" correspond à vos critères.',
        json_build_object(
            'project_title', p.title,
            'category', p.category,
            'city', p.city,
            'budget_min', p.estimated_budget_min,
            'budget_max', p.estimated_budget_max,
            'project_url', '/projets/' || p.id
        )
    FROM projects p
    JOIN profiles pr ON pr.role = 'professional' 
    WHERE p.id = NEW.id 
    AND pr.specialities && ARRAY[p.category];

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger notification intérêt professionnel
CREATE OR REPLACE FUNCTION notify_professional_interest()
RETURNS TRIGGER AS $$
BEGIN
    -- Notification client
    INSERT INTO notifications (user_id, project_id, type, title, message, data)
    SELECT 
        p.client_id, 
        p.id,
        'professional_interested',
        'Intérêt professionnel',
        'Le professionnel "' || pr.company_name || '" est intéressé par votre projet "' || p.title || '".',
        json_build_object(
            'project_title', p.title,
            'professional_name', pr.company_name,
            'professional_id', pr.id,
            'interest_date', NOW(),
            'contact_url', '/messages/' || pr.id
        )
    FROM projects p
    JOIN profiles pr ON pr.id = NEW.professional_id
    WHERE p.id = NEW.project_id;

    -- Notification admin
    INSERT INTO notifications (user_id, project_id, type, title, message, data)
    SELECT 
        p.id, 
        p.id,
        'professional_interested',
        'Nouvel intérêt professionnel',
        'Le professionnel "' || pr.company_name || '" a manifesté son intérêt pour le projet "' || p.title || '".',
        json_build_object(
            'project_title', p.title,
            'professional_name', pr.company_name,
            'professional_id', pr.id,
            'interest_date', NOW()
        )
    FROM projects p
    JOIN profiles pr ON pr.id = NEW.professional_id
    WHERE p.id = NEW.project_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger notification sélection professionnel
CREATE OR REPLACE FUNCTION notify_professional_selection()
RETURNS TRIGGER AS $$
BEGIN
    -- Notification client
    INSERT INTO notifications (user_id, project_id, type, title, message, data)
    SELECT 
        p.client_id, 
        p.id,
        'professional_selected',
        'Professionnel sélectionné',
        'Félicitations ! Vous avez sélectionné le professionnel "' || pr.company_name || '" pour votre projet "' || p.title || '".',
        json_build_object(
            'project_title', p.title,
            'professional_name', pr.company_name,
            'professional_id', pr.id,
            'selection_date', NOW(),
            'next_steps', array['Prise de contact', 'Début des travaux']
        )
    FROM projects p
    JOIN profiles pr ON pr.id = NEW.professional_id
    WHERE p.id = NEW.project_id;

    -- Notification professionnel
    INSERT INTO notifications (user_id, project_id, type, title, message, data)
    SELECT 
        pr.user_id, 
        p.id,
        'professional_selected',
        'Félicitations !',
        'Vous avez été sélectionné pour le projet "' || p.title || '".',
        json_build_object(
            'project_title', p.title,
            'client_id', p.client_id,
            'selection_date', NOW(),
            'contact_url', '/messages/' || p.client_id
        )
    FROM projects p
    JOIN profiles pr ON pr.id = NEW.professional_id
    WHERE p.id = NEW.project_id;

    -- Notification admin
    INSERT INTO notifications (user_id, project_id, type, title, message, data)
    SELECT 
        p.id, 
        p.id,
        'professional_selected',
        'Mise en relation',
        'Le client a sélectionné le professionnel "' || pr.company_name || '" pour le projet "' || p.title || '".',
        json_build_object(
            'project_title', p.title,
            'client_id', p.client_id,
            'professional_id', pr.id,
            'professional_name', pr.company_name,
            'selection_date', NOW()
        )
    FROM projects p
    JOIN profiles pr ON pr.id = NEW.professional_id
    WHERE p.id = NEW.project_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Création des triggers
CREATE TRIGGER trigger_new_project
    AFTER INSERT ON projects
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_project();

CREATE TRIGGER trigger_project_validation
    AFTER UPDATE ON projects
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'validated')
    EXECUTE FUNCTION notify_project_validation();

CREATE TRIGGER trigger_project_publication
    AFTER UPDATE ON projects
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'published')
    EXECUTE FUNCTION notify_project_publication();

-- 9. Index pour optimisation
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_project_calls_project_id ON project_calls(project_id);
CREATE INDEX IF NOT EXISTS idx_project_calls_status ON project_calls(status);

-- 10. Vue des notifications non lues
CREATE OR REPLACE VIEW unread_notifications AS
SELECT 
    n.*,
    p.title as project_title,
    pr.full_name as user_name
FROM notifications n
LEFT JOIN projects p ON n.project_id = p.id
LEFT JOIN profiles pr ON n.user_id = pr.id
WHERE n.read = FALSE
ORDER BY n.created_at DESC;
