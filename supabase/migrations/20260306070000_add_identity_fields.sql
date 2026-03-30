-- Ajouter les champs d'identité et de rôle dans l'entreprise
ALTER TABLE professionals 
ADD COLUMN IF NOT EXISTS job_position TEXT,
ADD COLUMN IF NOT EXISTS department TEXT;

-- Ajouter les champs d'identité dans la table profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Ajouter des commentaires pour documentation
COMMENT ON COLUMN professionals.job_position IS 'Poste du professionnel dans son entreprise';
COMMENT ON COLUMN professionals.department IS 'Département ou service du professionnel';
COMMENT ON COLUMN profiles.first_name IS 'Prénom de l''utilisateur';
COMMENT ON COLUMN profiles.last_name IS 'Nom de famille de l''utilisateur';

-- Créer un index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_professionals_job_position ON professionals(job_position);
CREATE INDEX IF NOT EXISTS idx_professionals_department ON professionals(department);
CREATE INDEX IF NOT EXISTS idx_profiles_first_name ON profiles(first_name);
CREATE INDEX IF NOT EXISTS idx_profiles_last_name ON profiles(last_name);
