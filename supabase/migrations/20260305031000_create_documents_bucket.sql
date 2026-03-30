-- Créer le bucket documents pour stocker les fichiers des professionnels
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true,
  10485760, -- 10MB par fichier
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
) ON CONFLICT (id) DO NOTHING;

-- Politiques RLS pour le bucket documents
CREATE POLICY "Professionals can upload own documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid() IN (
      SELECT user_id FROM professionals WHERE id = (SPLIT_PART(name, '/', 3))::uuid
    )
  );

CREATE POLICY "Professionals can view own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND
    auth.uid() IN (
      SELECT user_id FROM professionals WHERE id = (SPLIT_PART(name, '/', 3))::uuid
    )
  );

CREATE POLICY "Admins can manage all documents" ON storage.objects
  FOR ALL USING (
    bucket_id = 'documents' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );
