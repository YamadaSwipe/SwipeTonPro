-- ÉTAPE 9 : Ajouter la fonctionnalité de revalidation du profil professionnel
-- Ajouter des colonnes pour suivre les demandes de revalidation

ALTER TABLE professionals 
ADD COLUMN IF NOT EXISTS revalidation_requested BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS revalidation_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS revalidation_reason TEXT,
ADD COLUMN IF NOT EXISTS previous_status USER-DEFINED DEFAULT 'pending';

-- Ajouter des commentaires pour documentation
COMMENT ON COLUMN professionals.revalidation_requested IS 'True si le professionnel a demandé une revalidation';
COMMENT ON COLUMN professionals.revalidation_date IS 'Date de la demande de revalidation';
COMMENT ON COLUMN professionals.revalidation_reason IS 'Raison de la demande de revalidation';
COMMENT ON COLUMN professionals.previous_status IS 'Statut précédent avant la demande de revalidation';

-- Créer une table pour suivre l'historique des validations
CREATE TABLE IF NOT EXISTS professional_validation_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  status USER-DEFINED NOT NULL, -- pending, validated, rejected, suspended
  reason TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS sur la table d'historique
ALTER TABLE professional_validation_history ENABLE ROW LEVEL SECURITY;

-- Politiques pour l'historique des validations
CREATE POLICY "Users can view own validation history" ON professional_validation_history
FOR SELECT USING (auth.uid() = professional_id);

CREATE POLICY "Users can insert own validation history" ON professional_validation_history
FOR INSERT WITH CHECK (auth.uid() = professional_id);

CREATE POLICY "Admins can view all validation history" ON professional_validation_history
FOR SELECT USING (
  auth.role() = 'authenticated' AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can insert validation history" ON professional_validation_history
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Créer un index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_professional_validation_history_professional_id ON professional_validation_history(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_validation_history_status ON professional_validation_history(status);
CREATE INDEX IF NOT EXISTS idx_professionals_revalidation_requested ON professionals(revalidation_requested);
