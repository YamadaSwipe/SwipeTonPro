-- SOLUTION FINALE : UTILISER PROFILES AU LIEU DE USERS
-- Supprimer TOUTES les politiques existantes sur toutes les tables concernées

-- Supprimer les politiques sur storage.objects
DROP POLICY IF EXISTS "Users can list their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

-- Supprimer les politiques sur professional_documents
DROP POLICY IF EXISTS "Users can view their own documents" ON professional_documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON professional_documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON professional_documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON professional_documents;
DROP POLICY IF EXISTS "Admins can view all documents" ON professional_documents;

-- Supprimer les politiques sur professional_references
DROP POLICY IF EXISTS "Users can view their own references" ON professional_references;
DROP POLICY IF EXISTS "Users can insert their own references" ON professional_references;
DROP POLICY IF EXISTS "Users can update their own references" ON professional_references;
DROP POLICY IF EXISTS "Users can delete their own references" ON professional_references;
DROP POLICY IF EXISTS "Admins can view all references" ON professional_references;

-- Supprimer les politiques sur professional_certifications
DROP POLICY IF EXISTS "Users can view their own certifications" ON professional_certifications;
DROP POLICY IF EXISTS "Users can insert their own certifications" ON professional_certifications;
DROP POLICY IF EXISTS "Users can update their own certifications" ON professional_certifications;
DROP POLICY IF EXISTS "Users can delete their own certifications" ON professional_certifications;
DROP POLICY IF EXISTS "Admins can view all certifications" ON professional_certifications;

-- Supprimer les politiques sur profiles (au lieu de users)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users service role key" ON profiles;
DROP POLICY IF EXISTS "Professionals can view user profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Supprimer les politiques sur professionals
DROP POLICY IF EXISTS "Users can view own professional profile" ON professionals;
DROP POLICY IF EXISTS "Users can update own professional profile" ON professionals;
DROP POLICY IF EXISTS "Users can insert own professional profile" ON professionals;
DROP POLICY IF EXISTS "Admins can view all professionals" ON professionals;

-- RECÉRER TOUTES LES POLITIQUES CORRECTEMENT

-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_certifications ENABLE ROW LEVEL SECURITY;

-- Politiques pour storage.objects (bucket documents)
CREATE POLICY "Users can list their own documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

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

-- Politiques pour profiles (lecture seule)
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- Politiques pour professionals
CREATE POLICY "Users can view own professional profile" ON professionals
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own professional profile" ON professionals
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own professional profile" ON professionals
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politiques admin pour tout voir
CREATE POLICY "Admins can view all documents" ON professional_documents
FOR SELECT USING (
  auth.role() = 'authenticated' AND 
  raw_user_meta_data->>'role' IN ('admin', 'super_admin')
);

CREATE POLICY "Admins can view all references" ON professional_references
FOR SELECT USING (
  auth.role() = 'authenticated' AND 
  raw_user_meta_data->>'role' IN ('admin', 'super_admin')
);

CREATE POLICY "Admins can view all certifications" ON professional_certifications
FOR SELECT USING (
  auth.role() = 'authenticated' AND 
  raw_user_meta_data->>'role' IN ('admin', 'super_admin')
);

CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT USING (
  auth.role() = 'authenticated' AND 
  raw_user_meta_data->>'role' IN ('admin', 'super_admin')
);

CREATE POLICY "Admins can view all professionals" ON professionals
FOR SELECT USING (
  auth.role() = 'authenticated' AND 
  raw_user_meta_data->>'role' IN ('admin', 'super_admin')
);
