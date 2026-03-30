-- Migration: Mise à jour de la table conversations pour le chat limité
-- Version: 005
-- Date: 2025-01-08

-- Ajout de colonnes à la table conversations si elles n'existent pas
DO $$
BEGIN
  -- Ajouter phase si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'phase'
  ) THEN
    ALTER TABLE conversations 
    ADD COLUMN phase VARCHAR(20) DEFAULT 'anonymous' CHECK (phase IN ('anonymous', 'active', 'archived'));
    COMMENT ON COLUMN conversations.phase IS 'Phase de la conversation (anonymous, active, archived)';
  END IF;
  
  -- Ajouter client_message_count si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'client_message_count'
  ) THEN
    ALTER TABLE conversations 
    ADD COLUMN client_message_count INTEGER DEFAULT 0;
    COMMENT ON COLUMN conversations.client_message_count IS 'Nombre de messages envoyés par le client';
  END IF;
  
  -- Ajouter pro_message_count si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'pro_message_count'
  ) THEN
    ALTER TABLE conversations 
    ADD COLUMN pro_message_count INTEGER DEFAULT 0;
    COMMENT ON COLUMN conversations.pro_message_count IS 'Nombre de messages envoyés par le professionnel';
  END IF;
  
  -- Ajouter matched_at si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'matched_at'
  ) THEN
    ALTER TABLE conversations 
    ADD COLUMN matched_at TIMESTAMP WITH TIME ZONE;
    COMMENT ON COLUMN conversations.matched_at IS 'Date du match et activation du chat';
  END IF;
  
  -- Ajouter last_message_at si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'last_message_at'
  ) THEN
    ALTER TABLE conversations 
    ADD COLUMN last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    COMMENT ON COLUMN conversations.last_message_at IS 'Date du dernier message';
  END IF;
  
  -- Mettre à jour le statut par défaut pour les nouvelles conversations
  UPDATE conversations 
  SET status = 'anonymous' 
  WHERE status IS NULL OR status = '';
END $$;

-- Index pour optimiser les requêtes sur les conversations
CREATE INDEX IF NOT EXISTS idx_conversations_phase ON conversations(phase);
CREATE INDEX IF NOT EXISTS idx_conversations_client_message_count ON conversations(client_message_count);
CREATE INDEX IF NOT EXISTS idx_conversations_pro_message_count ON conversations(pro_message_count);
CREATE INDEX IF NOT EXISTS idx_conversations_matched_at ON conversations(matched_at);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at);

-- Trigger pour mettre à jour les compteurs de messages
CREATE OR REPLACE FUNCTION update_message_counters()
RETURNS TRIGGER AS $$
BEGIN
  -- Récupérer les informations de la conversation
  DECLARE
    v_client_id UUID;
    v_professional_id UUID;
    v_current_client_count INTEGER;
    v_current_pro_count INTEGER;
  BEGIN
    SELECT c.client_id, c.professional_id, c.client_message_count, c.pro_message_count
    INTO v_client_id, v_professional_id, v_current_client_count, v_current_pro_count
    FROM conversations c
    WHERE c.id = NEW.conversation_id;
    
    -- Mettre à jour le compteur approprié
    IF NEW.sender_id = v_client_id THEN
      UPDATE conversations
      SET 
        client_message_count = v_current_client_count + 1,
        last_message_at = NOW()
      WHERE id = NEW.conversation_id;
    ELSIF NEW.sender_id = v_professional_id THEN
      UPDATE conversations
      SET 
        pro_message_count = v_current_pro_count + 1,
        last_message_at = NOW()
      WHERE id = NEW.conversation_id;
    END IF;
    
    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger sur la table messages
DROP TRIGGER IF EXISTS trigger_update_message_counters ON messages;
CREATE TRIGGER trigger_update_message_counters
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_message_counters();

-- Fonction pour vérifier si un utilisateur peut envoyer un message
CREATE OR REPLACE FUNCTION peut_envoyer_message(
  p_conversation_id UUID,
  p_utilisateur_id UUID
)
RETURNS TABLE (
  peut_envoyer BOOLEAN,
  raison VARCHAR(255),
  messages_restants INTEGER
) AS $$
DECLARE
  v_phase VARCHAR(20);
  v_client_id UUID;
  v_professional_id UUID;
  v_client_count INTEGER;
  v_pro_count INTEGER;
  v_est_client BOOLEAN;
  v_messages_restants INTEGER;
BEGIN
  -- Récupérer les informations de la conversation
  SELECT 
    c.phase, 
    c.client_id, 
    c.professional_id, 
    c.client_message_count, 
    c.pro_message_count
  INTO v_phase, v_client_id, v_professional_id, v_client_count, v_pro_count
  FROM conversations c
  WHERE c.id = p_conversation_id;
  
  -- Vérifier si l'utilisateur fait partie de la conversation
  IF p_utilisateur_id NOT IN (v_client_id, v_professional_id) THEN
    RETURN QUERY SELECT FALSE, 'Utilisateur non autorisé dans cette conversation', 0;
    RETURN;
  END IF;
  
  -- Si la conversation est en phase active, pas de limitation
  IF v_phase = 'active' THEN
    RETURN QUERY SELECT TRUE, NULL, NULL;
    RETURN;
  END IF;
  
  -- Phase anonyme : limitation à 3 messages par utilisateur
  v_est_client := (p_utilisateur_id = v_client_id);
  
  IF v_est_client THEN
    v_messages_restants := 3 - v_client_count;
  ELSE
    v_messages_restants := 3 - v_pro_count;
  END IF;
  
  IF v_messages_restants <= 0 THEN
    RETURN QUERY SELECT FALSE, 'Limite de 3 messages atteinte en mode anonyme', 0;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT TRUE, NULL, v_messages_restants;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour activer une conversation après paiement
CREATE OR REPLACE FUNCTION activer_conversation_apres_paiement(
  p_client_id UUID,
  p_professional_id UUID,
  p_projet_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  conversation_id UUID;
BEGIN
  -- Récupérer ou créer la conversation
  SELECT id INTO conversation_id
  FROM conversations
  WHERE project_id = p_projet_id
    AND professional_id = p_professional_id
    AND client_id = p_client_id;
  
  IF conversation_id IS NULL THEN
    -- Créer la conversation si elle n'existe pas
    INSERT INTO conversations (
      project_id, client_id, professional_id, phase, status, matched_at
    )
    VALUES (
      p_projet_id, p_client_id, p_professional_id, 'active', 'active', NOW()
    )
    RETURNING id INTO conversation_id;
  ELSE
    -- Activer la conversation existante
    UPDATE conversations
    SET 
      phase = 'active',
      status = 'active',
      matched_at = NOW()
    WHERE id = conversation_id;
  END IF;
  
  RETURN conversation_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Vue pour les conversations avec informations de limitation
CREATE OR REPLACE VIEW conversations_with_limits AS
SELECT 
  c.id,
  c.project_id,
  c.client_id,
  c.professional_id,
  c.phase,
  c.status,
  c.client_message_count,
  c.pro_message_count,
  c.matched_at,
  c.last_message_at,
  c.created_at,
  c.updated_at,
  CASE 
    WHEN c.phase = 'active' THEN NULL
    ELSE 3 - c.client_message_count
  END as messages_restants_client,
  CASE 
    WHEN c.phase = 'active' THEN NULL
    ELSE 3 - c.pro_message_count
  END as messages_restants_pro,
  projet.titre as projet_titre,
  client.full_name as client_name,
  client.email as client_email,
  professional.full_name as professional_name,
  professional.email as professional_email,
  professional.company_name as professional_company
FROM conversations c
LEFT JOIN public.projets projet ON c.project_id = projet.id
LEFT JOIN public.profiles client ON c.client_id = client.id
LEFT JOIN public.profiles professional ON c.professional_id = professional.id;

COMMENT ON VIEW conversations_with_limits IS 'Vue des conversations avec informations de limitation de messages';

-- Fonction de statistiques sur les conversations
CREATE OR REPLACE FUNCTION get_conversations_statistics()
RETURNS TABLE (
  total_conversations INTEGER,
  conversations_anonymes INTEGER,
  conversations_actives INTEGER,
  conversations_archives INTEGER,
  messages_total INTEGER,
  messages_moyens DECIMAL(10,2),
  taux_activation DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE phase = 'anonymous') as anonymes,
      COUNT(*) FILTER (WHERE phase = 'active') as actives,
      COUNT(*) FILTER (WHERE phase = 'archived') as archivees,
      COALESCE(SUM(client_message_count + pro_message_count), 0) as messages_total
    FROM conversations
  )
  SELECT 
    s.total as total_conversations,
    s.anonymes as conversations_anonymes,
    s.actives as conversations_actives,
    s.archivees as conversations_archives,
    s.messages_total,
    CASE WHEN s.total > 0 THEN s.messages_total / s.total ELSE 0 END as messages_moyens,
    CASE WHEN s.total > 0 THEN (s.actives::DECIMAL / s.total::DECIMAL) * 100 ELSE 0 END as taux_activation
  FROM stats s;
END;
$$ LANGUAGE plpgsql;

-- Politique de sécurité RLS pour les conversations (si nécessaire)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Politique pour les utilisateurs (voir uniquement leurs conversations)
CREATE POLICY IF NOT EXISTS "conversations_read_for_own_users" ON conversations
  FOR SELECT USING (
    auth.role() = 'authenticated' 
    AND (
      client_id = auth.uid() 
      OR professional_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
      )
    )
  );

-- Politique pour les administrateurs (tous les droits)
CREATE POLICY IF NOT EXISTS "conversations_full_for_admins" ON conversations
  FOR ALL USING (
    auth.role() = 'authenticated' 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Politique pour les messages (voir uniquement les messages de leurs conversations)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "messages_read_for_own_conversations" ON messages
  FOR SELECT USING (
    auth.role() = 'authenticated' 
    AND (
      EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = messages.conversation_id
        AND (c.client_id = auth.uid() OR c.professional_id = auth.uid())
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
      )
    )
  );

CREATE POLICY IF NOT EXISTS "messages_full_for_admins" ON messages
  FOR ALL USING (
    auth.role() = 'authenticated' 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );
