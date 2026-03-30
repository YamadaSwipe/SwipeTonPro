-- ÉTAPE 13 : Ajouter la fonctionnalité de revalidation (version corrigée)
-- Vérifier d'abord le nom exact du type enum pour la colonne status

-- Vérifier les types enum existants
SELECT typname, typcategory 
FROM pg_type 
WHERE typname LIKE '%status%' 
OR typname LIKE '%validation%';

-- Ajouter les colonnes de revalidation (sans spécifier le type enum directement)
ALTER TABLE professionals 
ADD COLUMN IF NOT EXISTS revalidation_requested BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS revalidation_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS revalidation_reason TEXT;

-- Pour la colonne previous_status, nous allons d'abord vérifier le type exact
-- puis l'ajouter avec le bon type

-- Créer la table d'historique des validations
CREATE TABLE IF NOT EXISTS professional_validation_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'validated', 'rejected', 'suspended')),
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

-- Créer des index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_professional_validation_history_professional_id ON professional_validation_history(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_validation_history_status ON professional_validation_history(status);
CREATE INDEX IF NOT EXISTS idx_professionals_revalidation_requested ON professionals(revalidation_requested);

-- Ajouter des commentaires pour documentation
COMMENT ON COLUMN professionals.revalidation_requested IS 'True si le professionnel a demandé une revalidation';
COMMENT ON COLUMN professionals.revalidation_date IS 'Date de la demande de revalidation';
COMMENT ON COLUMN professionals.revalidation_reason IS 'Raison de la demande de revalidation';
