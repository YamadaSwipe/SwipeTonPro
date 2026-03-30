-- ÉTAPE 15 : Ajouter la colonne previous_status avec le bon type enum
-- Utiliser le type professional_status identifié précédemment

ALTER TABLE professionals 
ADD COLUMN IF NOT EXISTS previous_status professional_status DEFAULT 'pending';

-- Ajouter un commentaire pour cette colonne
COMMENT ON COLUMN professionals.previous_status IS 'Statut précédent avant la demande de revalidation';
