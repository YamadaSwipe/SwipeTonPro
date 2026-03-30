-- Ajouter les champs nécessaires pour le CRM
-- Migration pour ajouter les champs manquants dans les tables existantes

-- Ajouter le champ assigned_to dans la table projects (type UUID pour compatibilité)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES profiles(id);

-- Ajouter le champ status_lead dans la table projects pour le suivi CRM
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS status_lead TEXT 
CHECK (status_lead IN ('new', 'contacted', 'qualified', 'hot', 'cold', 'converted', 'lost', 'paused', 'suspended', 'archived'));

-- Ajouter un index pour optimiser les requêtes CRM
CREATE INDEX IF NOT EXISTS idx_projects_status_lead ON projects(status_lead);
CREATE INDEX IF NOT EXISTS idx_projects_assigned_to ON projects(assigned_to);
CREATE INDEX IF NOT EXISTS idx_projects_crm_filter ON projects(status, status_lead, assigned_to);

-- Vérifier que le champ role existe dans profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='profiles' 
        AND column_name='role'
    ) THEN
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT 
        CHECK (role IN ('client', 'professional', 'admin', 'super_admin', 'moderator', 'support', 'team'));
    END IF;
END $$;

-- Afficher les structures mises à jour
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('projects', 'profiles')
AND column_name IN ('assigned_to', 'status_lead', 'role')
ORDER BY table_name, ordinal_position;
