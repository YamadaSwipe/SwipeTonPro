-- Supprimer toutes les politiques existantes avant recréation
DROP POLICY IF EXISTS "Users can list their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

DROP POLICY IF EXISTS "Users can view their own documents" ON professional_documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON professional_documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON professional_documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON professional_documents;

DROP POLICY IF EXISTS "Admins can view all documents" ON professional_documents;

DROP POLICY IF EXISTS "Users can view their own references" ON professional_references;
DROP POLICY IF EXISTS "Users can insert their own references" ON professional_references;
DROP POLICY IF EXISTS "Users can update their own references" ON professional_references;
DROP POLICY IF EXISTS "Users can delete their own references" ON professional_references;

DROP POLICY IF EXISTS "Admins can view all references" ON professional_references;

DROP POLICY IF EXISTS "Users can view their own certifications" ON professional_certifications;
DROP POLICY IF EXISTS "Users can insert their own certifications" ON professional_certifications;
DROP POLICY IF EXISTS "Users can update their own certifications" ON professional_certifications;
DROP POLICY IF EXISTS "Users can delete their own certifications" ON professional_certifications;

DROP POLICY IF EXISTS "Admins can view all certifications" ON professional_certifications;

-- Créer le bucket documents s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- Activer RLS sur les tables si ce n'est pas déjà fait
ALTER TABLE professional_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_certifications ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS correctes pour le bucket documents
-- Politique pour lister les fichiers
CREATE POLICY "Users can list their own documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique pour insérer des fichiers
CREATE POLICY "Users can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique pour mettre à jour les fichiers
CREATE POLICY "Users can update their own documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique pour supprimer les fichiers
CREATE POLICY "Users can delete their own documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Créer les politiques correctes pour les tables
-- Politiques pour professional_documents
CREATE POLICY "Users can view their own documents" ON professional_documents
FOR SELECT USING (auth.uid() = professional_id);

CREATE POLICY "Users can insert their own documents" ON professional_documents
FOR INSERT WITH CHECK (auth.uid() = professional_id);

CREATE POLICY "Users can update their own documents" ON professional_documents
FOR UPDATE USING (auth.uid() = professional_id);

CREATE POLICY "Users can delete their own documents" ON professional_documents
FOR DELETE USING (auth.uid() = professional_id);

-- Politiques pour professional_references
CREATE POLICY "Users can view their own references" ON professional_references
FOR SELECT USING (auth.uid() = professional_id);

CREATE POLICY "Users can insert their own references" ON professional_references
FOR INSERT WITH CHECK (auth.uid() = professional_id);

CREATE POLICY "Users can update their own references" ON professional_references
FOR UPDATE USING (auth.uid() = professional_id);

CREATE POLICY "Users can delete their own references" ON professional_references
FOR DELETE USING (auth.uid() = professional_id);

-- Politiques pour professional_certifications
CREATE POLICY "Users can view their own certifications" ON professional_certifications
FOR SELECT USING (auth.uid() = professional_id);

CREATE POLICY "Users can insert their own certifications" ON professional_certifications
FOR INSERT WITH CHECK (auth.uid() = professional_id);

CREATE POLICY "Users can update their own certifications" ON professional_certifications
FOR UPDATE USING (auth.uid() = professional_id);

CREATE POLICY "Users can delete their own certifications" ON professional_certifications
FOR DELETE USING (auth.uid() = professional_id);

-- Donner accès aux admins
CREATE POLICY "Admins can view all documents" ON professional_documents
FOR SELECT USING (
  auth.role() = 'authenticated' AND 
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can view all references" ON professional_references
FOR SELECT USING (
  auth.role() = 'authenticated' AND 
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can view all certifications" ON professional_certifications
FOR SELECT USING (
  auth.role() = 'authenticated' AND 
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
  )
);
