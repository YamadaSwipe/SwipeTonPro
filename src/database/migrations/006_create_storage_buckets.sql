-- Migration: Création des buckets de stockage Supabase
-- Version: 006
-- Date: 2025-01-08

-- Création du bucket pour les documents
INSERT INTO storage.buckets (id, name, public)
VALUES (
  'documents',
  'documents',
  false
) ON CONFLICT (id) DO NOTHING;

-- Création du bucket pour les avatars des utilisateurs
INSERT INTO storage.buckets (id, name, public)
VALUES (
  'avatars',
  'avatars',
  true
) ON CONFLICT (id) DO NOTHING;

-- Création du bucket pour les images de projets
INSERT INTO storage.buckets (id, name, public)
VALUES (
  'project-images',
  'project-images',
  true
) ON CONFLICT (id) DO NOTHING;

-- Création du bucket pour les pièces jointes des messages
INSERT INTO storage.buckets (id, name, public)
VALUES (
  'message-attachments',
  'message-attachments',
  true
) ON CONFLICT (id) DO NOTHING;

-- Politiques d'accès pour le bucket documents
CREATE POLICY "Users can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = 'consentements' AND
  -- Vérifier que l'utilisateur est autorisé à accéder au projet
  EXISTS (
    SELECT 1 FROM public.projets p
    WHERE p.id::text = (storage.foldername(name))[2]
    AND (p.client_id = auth.uid() OR p.professional_id = auth.uid())
  )
);

CREATE POLICY "Users can view their own documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' AND
  auth.role() = 'authenticated' AND
  (
    -- L'utilisateur peut voir ses propres documents
    (storage.foldername(name))[1] = 'consentements' AND
    EXISTS (
      SELECT 1 FROM public.projets p
      WHERE p.id::text = (storage.foldername(name))[2]
      AND (p.client_id = auth.uid() OR p.professional_id = auth.uid())
    )
    OR
    -- Les administrateurs peuvent voir tous les documents
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  )
);

CREATE POLICY "Users can update their own documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'documents' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = 'consentements' AND
  EXISTS (
    SELECT 1 FROM public.projets p
    WHERE p.id::text = (storage.foldername(name))[2]
    AND (p.client_id = auth.uid() OR p.professional_id = auth.uid())
  )
);

CREATE POLICY "Users can delete their own documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' AND
  auth.role() = 'authenticated' AND
  (
    (storage.foldername(name))[1] = 'consentements' AND
    EXISTS (
      SELECT 1 FROM public.projets p
      WHERE p.id::text = (storage.foldername(name))[2]
      AND (p.client_id = auth.uid() OR p.professional_id = auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  )
);

-- Politiques d'accès pour le bucket avatars
CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid::text
);

CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid::text
);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid::text
);

-- Politiques d'accès pour le bucket project-images
CREATE POLICY "Users can upload project images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'project-images' AND
  auth.role() = 'authenticated' AND
  (
    -- Le client peut uploader des images pour ses projets
    (storage.foldername(name))[1] = 'projects' AND
    EXISTS (
      SELECT 1 FROM public.projets p
      WHERE p.id::text = (storage.foldername(name))[2]
      AND p.client_id = auth.uid()
    )
    OR
    -- Le professionnel peut uploader des images pour les projets où il est matché
    (storage.foldername(name))[1] = 'projects' AND
    EXISTS (
      SELECT 1 FROM public.projets p
      WHERE p.id::text = (storage.foldername(name))[2]
      AND p.professional_id = auth.uid()
    )
    OR
    -- Les administrateurs peuvent uploader n'importe quelle image
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  )
);

CREATE POLICY "Anyone can view project images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'project-images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their project images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'project-images' AND
  auth.role() = 'authenticated' AND
  (
    (storage.foldername(name))[1] = 'projects' AND
    EXISTS (
      SELECT 1 FROM public.projets p
      WHERE p.id::text = (storage.foldername(name))[2]
      AND (p.client_id = auth.uid() OR p.professional_id = auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  )
);

CREATE POLICY "Users can delete their project images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'project-images' AND
  auth.role() = 'authenticated' AND
  (
    (storage.foldername(name))[1] = 'projects' AND
    EXISTS (
      SELECT 1 FROM public.projets p
      WHERE p.id::text = (storage.foldername(name))[2]
      AND (p.client_id = auth.uid() OR p.professional_id = auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  )
);

-- Politiques d'accès pour le bucket message-attachments
CREATE POLICY "Users can upload message attachments" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'message-attachments' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = 'conversations' AND
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id::text = (storage.foldername(name))[2]
    AND (c.client_id = auth.uid() OR c.professional_id = auth.uid())
  )
);

CREATE POLICY "Users can view message attachments" ON storage.objects
FOR SELECT USING (
  bucket_id = 'message-attachments' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = 'conversations' AND
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id::text = (storage.foldername(name))[2]
    AND (c.client_id = auth.uid() OR c.professional_id = auth.uid())
  )
);

CREATE POLICY "Users can update their message attachments" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'message-attachments' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = 'conversations' AND
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id::text = (storage.foldername(name))[2]
    AND (c.client_id = auth.uid() OR c.professional_id = auth.uid())
  )
);

CREATE POLICY "Users can delete their message attachments" ON storage.objects
FOR DELETE USING (
  bucket_id = 'message-attachments' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = 'conversations' AND
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id::text = (storage.foldername(name))[2]
    AND (c.client_id = auth.uid() OR c.professional_id = auth.uid())
  )
);

-- Fonctions utilitaires pour le stockage
CREATE OR REPLACE FUNCTION get_document_url(p_document_id UUID)
RETURNS TEXT AS $$
DECLARE
  chemin_fichier TEXT;
  url_publique TEXT;
BEGIN
  -- Récupérer le chemin du fichier
  SELECT chemin_fichier INTO chemin_fichier
  FROM documents
  WHERE id = p_document_id;
  
  IF chemin_fichier IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Générer l'URL publique
  SELECT public_url INTO url_publique
  FROM storage.objects
  WHERE bucket_id = 'documents' AND name = chemin_fichier;
  
  RETURN url_publique;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_avatar_url(p_utilisateur_id UUID)
RETURNS TEXT AS $$
DECLARE
  url_publique TEXT;
BEGIN
  SELECT public_url INTO url_publique
  FROM storage.objects
  WHERE bucket_id = 'avatars' 
    AND name = p_utilisateur_id::text || '/avatar.jpg'
  LIMIT 1;
  
  RETURN url_publique;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION upload_avatar(p_utilisateur_id UUID, p_contenu BYTEA, p_nom_fichier TEXT)
RETURNS TEXT AS $$
DECLARE
  chemin_fichier TEXT;
BEGIN
  chemin_fichier := p_utilisateur_id::text || '/' || p_nom_fichier;
  
  INSERT INTO storage.objects (bucket_id, name, content_type, data)
  VALUES ('avatars', chemin_fichier, 'image/jpeg', p_contenu)
  ON CONFLICT (bucket_id, name) DO UPDATE
  SET data = p_contenu, updated_at = NOW();
  
  SELECT public_url INTO chemin_fichier
  FROM storage.objects
  WHERE bucket_id = 'avatars' AND name = chemin_fichier;
  
  RETURN chemin_fichier;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer les anciens fichiers
CREATE OR REPLACE FUNCTION nettoyer_anciens_fichiers(p_jours INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  fichiers_supprimes INTEGER;
BEGIN
  -- Supprimer les fichiers de messages de plus de p_jours jours
  DELETE FROM storage.objects
  WHERE bucket_id = 'message-attachments'
    AND created_at < NOW() - INTERVAL '1 day' * p_jours;
  
  GET DIAGNOSTICS fichiers_supprimes = ROW_COUNT;
  
  RETURN fichiers_supprimes;
END;
$$ LANGUAGE plpgsql;

-- Commentaires sur les buckets
COMMENT ON STORAGE.buckets 'documents' IS 'Stockage des documents (consentements, devis, contrats, factures)';
COMMENT ON STORAGE.buckets 'avatars' IS 'Stockage des avatars des utilisateurs';
COMMENT ON STORAGE.buckets 'project-images' IS 'Stockage des images des projets';
COMMENT ON STORAGE.buckets 'message-attachments' IS 'Stockage des pièces jointes des messages';

-- Trigger pour nettoyer automatiquement les anciens fichiers
CREATE OR REPLACE FUNCTION trigger_nettoyage_fichiers()
RETURNS TRIGGER AS $$
BEGIN
  -- Nettoyer les pièces jointes de messages de plus de 90 jours
  PERFORM nettoyer_anciens_fichiers(90);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer un trigger pour le nettoyage (à exécuter manuellement ou via job)
-- Note: Ce trigger est commenté car il pourrait être trop lourd à exécuter à chaque opération
-- CREATE TRIGGER trigger_nettoyage_fichiers
--   AFTER INSERT ON storage.objects
--   FOR EACH STATEMENT
--   EXECUTE FUNCTION trigger_nettoyage_fichiers();
