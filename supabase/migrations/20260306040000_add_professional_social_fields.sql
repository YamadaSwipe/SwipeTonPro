-- Ajouter les champs réseaux sociaux et activités pour les professionnels
ALTER TABLE professionals 
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS linkedin TEXT,
ADD COLUMN IF NOT EXISTS facebook TEXT,
ADD COLUMN IF NOT EXISTS instagram TEXT,
ADD COLUMN IF NOT EXISTS activities TEXT[],
ADD COLUMN IF NOT EXISTS work_areas TEXT[];

-- Ajouter des commentaires pour documentation
COMMENT ON COLUMN professionals.website IS 'Site web de l''entreprise';
COMMENT ON COLUMN professionals.linkedin IS 'Profil LinkedIn de l''entreprise';
COMMENT ON COLUMN professionals.facebook IS 'Page Facebook de l''entreprise';
COMMENT ON COLUMN professionals.instagram IS 'Profil Instagram de l''entreprise';
COMMENT ON COLUMN professionals.activities IS 'Liste des activités professionnelles';
COMMENT ON COLUMN professionals.work_areas IS 'Liste des zones d''intervention géographiques';
