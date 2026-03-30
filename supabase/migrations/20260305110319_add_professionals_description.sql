-- Ajouter le champ description manquant dans la table professionals
ALTER TABLE professionals 
ADD COLUMN description TEXT;

-- Ajouter des commentaires pour documentation
COMMENT ON COLUMN professionals.description IS 'Description de l''entreprise et activités du professionnel';