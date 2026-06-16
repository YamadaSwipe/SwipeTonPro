-- =====================================================
-- FIX RLS COLUMN REFERENCES - CORRECTION COMPLÈTE
-- =====================================================
-- Ce script corrige TOUTES les références de colonnes incorrectes
-- dans les politiques RLS basées sur le schéma réel de la base de données
-- =====================================================

-- ANALYSE DU SCHÉMA:
-- profiles: id (PK) - PAS de colonne user_id
-- projects: client_id (FK vers profiles.id) - PAS de colonne user_id
-- professionals: user_id (FK vers profiles.id) - CORRECT
-- reviews: client_id (FK vers profiles.id) - PAS de colonne reviewer_id
-- notifications: user_id (FK vers profiles.id) - CORRECT
-- credit_transactions: professional_id (FK vers professionals.id) - PAS de colonne user_id
-- documents: uploaded_by n'existe pas, utiliser professional_id
-- support_tickets: user_id (FK vers profiles.id) - CORRECT

-- =====================================================
-- PROFILES TABLE - Corriger user_id → id
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin')
        )
    );

-- =====================================================
-- PROJECTS TABLE - Corriger user_id → client_id
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT
    USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their own projects" ON projects;
CREATE POLICY "Users can create their own projects" ON projects
    FOR INSERT
    WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE
    USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all projects" ON projects;
CREATE POLICY "Admins can view all projects" ON projects
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin', 'moderator')
        )
    );

DROP POLICY IF EXISTS "Validated projects viewable by professionals" ON projects;
CREATE POLICY "Validated projects viewable by professionals" ON projects
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL
        AND status = 'published'
        AND EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'professional'
        )
    );

-- =====================================================
-- PROJECT_INTERESTS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Project owners can view interests on their projects" ON project_interests;
CREATE POLICY "Project owners can view interests on their projects" ON project_interests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_interests.project_id
            AND p.client_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can view all interests" ON project_interests;
CREATE POLICY "Admins can view all interests" ON project_interests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin')
        )
    );

-- =====================================================
-- PROFESSIONALS TABLE - user_id est CORRECT
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all professionals" ON professionals;
CREATE POLICY "Admins can view all professionals" ON professionals
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin', 'moderator')
        )
    );

-- =====================================================
-- CONVERSATIONS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all conversations" ON conversations;
CREATE POLICY "Admins can view all conversations" ON conversations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin', 'support')
        )
    );

-- =====================================================
-- MESSAGES TABLE
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all messages" ON messages;
CREATE POLICY "Admins can view all messages" ON messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin', 'support')
        )
    );

-- =====================================================
-- MATCH_PAYMENTS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all match payments" ON match_payments;
CREATE POLICY "Admins can view all match payments" ON match_payments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin')
        )
    );

-- =====================================================
-- CREDIT_TRANSACTIONS TABLE - Corriger user_id → professional_id
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own credit transactions" ON credit_transactions;
CREATE POLICY "Users can view their own credit transactions" ON credit_transactions
    FOR SELECT
    USING (
        professional_id IN (
            SELECT id FROM professionals WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can view all credit transactions" ON credit_transactions;
CREATE POLICY "Admins can view all credit transactions" ON credit_transactions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin')
        )
    );

-- =====================================================
-- REVIEWS TABLE - Corriger reviewer_id → client_id
-- =====================================================

DROP POLICY IF EXISTS "Users can create reviews for their projects" ON reviews;
CREATE POLICY "Users can create reviews for their projects" ON reviews
    FOR INSERT
    WITH CHECK (
        client_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = reviews.project_id
            AND p.client_id = auth.uid()
        )
    );

-- =====================================================
-- DOCUMENTS TABLE - Corriger uploaded_by → professional_id
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
CREATE POLICY "Users can view their own documents" ON documents
    FOR SELECT
    USING (
        professional_id IN (
            SELECT id FROM professionals WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can upload their own documents" ON documents;
CREATE POLICY "Users can upload their own documents" ON documents
    FOR INSERT
    WITH CHECK (
        professional_id IN (
            SELECT id FROM professionals WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can view all documents" ON documents;
CREATE POLICY "Admins can view all documents" ON documents
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin', 'moderator')
        )
    );

-- =====================================================
-- ADMIN TABLES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Only admins can access platform settings" ON platform_settings;
CREATE POLICY "Only admins can access platform settings" ON platform_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "Only admins can access pricing config" ON pricing_config;
CREATE POLICY "Only admins can access pricing config" ON pricing_config
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "Only admins can access admin actions" ON admin_actions;
CREATE POLICY "Only admins can access admin actions" ON admin_actions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin', 'moderator')
        )
    );

DROP POLICY IF EXISTS "Admins can manage promo codes" ON promo_codes;
CREATE POLICY "Admins can manage promo codes" ON promo_codes
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin')
        )
    );

-- =====================================================
-- SUPPORT TICKETS TABLE - user_id est CORRECT
-- =====================================================

DROP POLICY IF EXISTS "Support staff can view all tickets" ON support_tickets;
CREATE POLICY "Support staff can view all tickets" ON support_tickets
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin', 'support')
        )
    );

DROP POLICY IF EXISTS "Support staff can update tickets" ON support_tickets;
CREATE POLICY "Support staff can update tickets" ON support_tickets
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin', 'support')
        )
    );

-- =====================================================
-- MINI MESSAGES TABLE
-- =====================================================

DROP POLICY IF EXISTS "Project owners can view mini messages on their projects" ON mini_messages;
CREATE POLICY "Project owners can view mini messages on their projects" ON mini_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = mini_messages.project_id
            AND p.client_id = auth.uid()
        )
    );

-- =====================================================
-- PROJECT MILESTONES TABLE
-- =====================================================

DROP POLICY IF EXISTS "Project participants can view milestones" ON project_milestones;
CREATE POLICY "Project participants can view milestones" ON project_milestones
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_milestones.project_id
            AND p.client_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Project owner can create milestones" ON project_milestones;
CREATE POLICY "Project owner can create milestones" ON project_milestones
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_milestones.project_id
            AND p.client_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Project participants can update milestones" ON project_milestones;
CREATE POLICY "Project participants can update milestones" ON project_milestones
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_milestones.project_id
            AND p.client_id = auth.uid()
        )
    );

-- =====================================================
-- ESCROW TRANSACTIONS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Project participants can view escrow transactions" ON escrow_transactions;
CREATE POLICY "Project participants can view escrow transactions" ON escrow_transactions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM project_milestones pm
            JOIN projects p ON p.id = pm.project_id
            WHERE pm.id = escrow_transactions.milestone_id
            AND p.client_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can view all escrow transactions" ON escrow_transactions;
CREATE POLICY "Admins can view all escrow transactions" ON escrow_transactions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin')
        )
    );

-- =====================================================
-- VÉRIFICATION FINALE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ CORRECTION COMPLÈTE DES POLITIQUES RLS';
    RAISE NOTICE '✅ Toutes les colonnes ont été corrigées selon le schéma réel:';
    RAISE NOTICE '   - profiles: user_id → id';
    RAISE NOTICE '   - projects: user_id → client_id';
    RAISE NOTICE '   - reviews: reviewer_id → client_id';
    RAISE NOTICE '   - credit_transactions: user_id → professional_id';
    RAISE NOTICE '   - documents: uploaded_by → professional_id';
    RAISE NOTICE '   - professionals: user_id (inchangé - correct)';
    RAISE NOTICE '   - notifications: user_id (inchangé - correct)';
    RAISE NOTICE '   - support_tickets: user_id (inchangé - correct)';
END $$;
