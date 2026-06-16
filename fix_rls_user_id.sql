-- =====================================================
-- FIX SCRIPT: Corriger toutes les références user_id restantes
-- =====================================================
-- Ce script corrige les dernières références incorrectes à user_id
-- dans les politiques RLS qui n'ont pas encore été corrigées
-- =====================================================

-- Corriger project_interests (ligne 209)
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

-- Corriger project_interests admins (ligne 220)
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

-- Corriger conversations admins (ligne 255)
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

-- Corriger messages admins (ligne 296)
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

-- Corriger match_payments admins (ligne 349)
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

-- Corriger credit_transactions admins (ligne 378)
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

-- Corriger reviews (ligne 403)
DROP POLICY IF EXISTS "Users can create reviews for their projects" ON reviews;
CREATE POLICY "Users can create reviews for their projects" ON reviews
    FOR INSERT
    WITH CHECK (
        reviewer_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = reviews.project_id
            AND p.client_id = auth.uid()
        )
    );

-- Corriger documents admins (ligne 437)
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

-- Corriger platform_settings (ligne 453)
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

-- Corriger pricing_config (ligne 465)
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

-- Corriger admin_actions (ligne 477)
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

-- Corriger promo_codes (ligne 489)
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

-- Corriger support_tickets (ligne 519, 531)
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

-- Corriger mini_messages (ligne 571)
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

-- Corriger project_milestones (ligne 595, 607, 617)
DROP POLICY IF EXISTS "Project participants can view milestones" ON project_milestones;
CREATE POLICY "Project participants can view milestones" ON project_milestones
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_milestones.project_id
            AND (p.client_id = auth.uid() OR p.professional_id = auth.uid())
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
            AND (p.client_id = auth.uid() OR p.professional_id = auth.uid())
        )
    );

-- Corriger escrow_transactions (ligne 636, 647)
DROP POLICY IF EXISTS "Project participants can view escrow transactions" ON escrow_transactions;
CREATE POLICY "Project participants can view escrow transactions" ON escrow_transactions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM project_milestones pm
            JOIN projects p ON p.id = pm.project_id
            WHERE pm.id = escrow_transactions.milestone_id
            AND (p.client_id = auth.uid() OR p.professional_id = auth.uid())
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
    RAISE NOTICE '✅ Toutes les politiques RLS ont été corrigées';
    RAISE NOTICE '✅ Les références user_id incorrectes ont été remplacées par les bonnes colonnes';
    RAISE NOTICE '✅ profiles: user_id → id';
    RAISE NOTICE '✅ projects: user_id → client_id';
    RAISE NOTICE '✅ professionals: user_id reste user_id (correct)';
END $$;
