-- Créer les politiques RLS pour le bucket "documents"
-- Permettre aux professionnels d'uploader leurs propres documents

-- 1. Activer RLS sur le bucket documents s'il ne l'est pas déjà
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- 2. Politiques pour le bucket documents
-- Permettre aux utilisateurs authentifiés de lister leurs propres documents
CREATE POLICY "Users can list their own documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permettre aux utilisateurs authentifiés d'uploader leurs propres documents
CREATE POLICY "Users can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permettre aux utilisateurs authentifiés de mettre à jour leurs propres documents
CREATE POLICY "Users can update their own documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permettre aux utilisateurs authentifiés de supprimer leurs propres documents
CREATE POLICY "Users can delete their own documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Politiques pour les tables de documents
-- Permettre aux utilisateurs de voir leurs propres documents
CREATE POLICY "Users can view their own documents" ON professional_documents
FOR SELECT USING (auth.uid() = professional_id);

-- Permettre aux utilisateurs d'insérer leurs propres documents
CREATE POLICY "Users can insert their own documents" ON professional_documents
FOR INSERT WITH CHECK (auth.uid() = professional_id);

-- Permettre aux utilisateurs de mettre à jour leurs propres documents
CREATE POLICY "Users can update their own documents" ON professional_documents
FOR UPDATE USING (auth.uid() = professional_id);

-- Permettre aux utilisateurs de supprimer leurs propres documents
CREATE POLICY "Users can delete their own documents" ON professional_documents
FOR DELETE USING (auth.uid() = professional_id);

-- 4. Politiques pour les références
CREATE POLICY "Users can view their own references" ON professional_references
FOR SELECT USING (auth.uid() = professional_id);

CREATE POLICY "Users can insert their own references" ON professional_references
FOR INSERT WITH CHECK (auth.uid() = professional_id);

CREATE POLICY "Users can update their own references" ON professional_references
FOR UPDATE USING (auth.uid() = professional_id);

CREATE POLICY "Users can delete their own references" ON professional_references
FOR DELETE USING (auth.uid() = professional_id);

-- 5. Politiques pour les certifications
CREATE POLICY "Users can view their own certifications" ON professional_certifications
FOR SELECT USING (auth.uid() = professional_id);

CREATE POLICY "Users can insert their own certifications" ON professional_certifications
FOR INSERT WITH CHECK (auth.uid() = professional_id);

CREATE POLICY "Users can update their own certifications" ON professional_certifications
FOR UPDATE USING (auth.uid() = professional_id);

CREATE POLICY "Users can delete their own certifications" ON professional_certifications
FOR DELETE USING (auth.uid() = professional_id);

-- 6. Donner accès aux admins pour voir tous les documents
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
