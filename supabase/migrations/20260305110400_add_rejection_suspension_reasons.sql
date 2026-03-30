-- Ajouter les champs de rejet et suspension manquants
ALTER TABLE professionals 
ADD COLUMN rejection_reason TEXT,
ADD COLUMN suspension_reason TEXT;

-- Ajouter des commentaires pour documentation
COMMENT ON COLUMN professionals.rejection_reason IS 'Motif du rejet du professionnel';
COMMENT ON COLUMN professionals.suspension_reason IS 'Motif de la suspension du professionnel';
