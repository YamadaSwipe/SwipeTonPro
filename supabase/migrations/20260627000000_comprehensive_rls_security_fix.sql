-- =====================================================
-- COMPREHENSIVE RLS SECURITY FIX
-- =====================================================
-- This migration fixes the critical security vulnerability:
-- "Table publicly accessible - rls_disabled_in_public"
-- 
-- It enables RLS on ALL tables and creates comprehensive
-- security policies to protect data from unauthorized access.
-- =====================================================

-- =====================================================
-- STEP 1: ENABLE RLS ON ALL PUBLIC TABLES
-- =====================================================

DO $$
DECLARE
    table_record RECORD;
    table_owner TEXT;
BEGIN
    -- Loop through all tables in the public schema
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        -- Check if we own the table
        SELECT tableowner INTO table_owner
        FROM pg_tables
        WHERE schemaname = 'public' AND tablename = table_record.tablename;
        
        -- Skip system tables we don't own (like spatial_ref_sys from PostGIS)
        IF table_owner = current_user OR table_record.tablename NOT IN ('spatial_ref_sys', 'geography_columns', 'geometry_columns') THEN
            BEGIN
                -- Enable RLS on each table
                EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_record.tablename);
                RAISE NOTICE 'Enabled RLS on table: %', table_record.tablename;
            EXCEPTION
                WHEN insufficient_privilege THEN
                    RAISE NOTICE 'Skipping table % (insufficient privileges)', table_record.tablename;
                WHEN OTHERS THEN
                    RAISE NOTICE 'Error enabling RLS on table %: %', table_record.tablename, SQLERRM;
            END;
        ELSE
            RAISE NOTICE 'Skipping system table: %', table_record.tablename;
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- STEP 2: CREATE COMPREHENSIVE RLS POLICIES
-- =====================================================

-- -----------------------------------------------------
-- PROFILES TABLE POLICIES
-- -----------------------------------------------------

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles viewable by authenticated users" ON profiles;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin')
        )
    );

-- -----------------------------------------------------
-- PROFESSIONALS TABLE POLICIES
-- -----------------------------------------------------

DROP POLICY IF EXISTS "Professionals can view their own data" ON professionals;
DROP POLICY IF EXISTS "Professionals can update their own data" ON professionals;
DROP POLICY IF EXISTS "Professionals can insert their own data" ON professionals;
DROP POLICY IF EXISTS "Admins can view all professionals" ON professionals;
DROP POLICY IF EXISTS "Validated professionals viewable by authenticated users" ON professionals;

-- Professionals can view their own data
CREATE POLICY "Professionals can view their own data" ON professionals
    FOR SELECT
    USING (user_id = auth.uid());

-- Professionals can update their own data
CREATE POLICY "Professionals can update their own data" ON professionals
    FOR UPDATE
    USING (user_id = auth.uid());

-- Professionals can insert their own data
CREATE POLICY "Professionals can insert their own data" ON professionals
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Admins can view all professionals
CREATE POLICY "Admins can view all professionals" ON professionals
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin', 'moderator')
        )
    );

-- Validated professionals viewable by authenticated users
CREATE POLICY "Validated professionals viewable by authenticated users" ON professionals
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL
        AND status = 'verified'
    );

-- -----------------------------------------------------
-- PROJECTS TABLE POLICIES
-- -----------------------------------------------------

DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Admins can view all projects" ON projects;
DROP POLICY IF EXISTS "Validated projects viewable by professionals" ON projects;

-- Users can view their own projects
CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT
    USING (client_id = auth.uid());

-- Users can create their own projects
CREATE POLICY "Users can create their own projects" ON projects
    FOR INSERT
    WITH CHECK (client_id = auth.uid());

-- Users can update their own projects
CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE
    USING (client_id = auth.uid());

-- Admins can view all projects
CREATE POLICY "Admins can view all projects" ON projects
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin', 'moderator')
        )
    );

-- Validated projects viewable by professionals
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

-- -----------------------------------------------------
-- PROJECT_INTERESTS TABLE POLICIES
-- -----------------------------------------------------

DROP POLICY IF EXISTS "Professionals can view their own interests" ON project_interests;
DROP POLICY IF EXISTS "Professionals can create interests" ON project_interests;
DROP POLICY IF EXISTS "Project owners can view interests on their projects" ON project_interests;
DROP POLICY IF EXISTS "Admins can view all interests" ON project_interests;

-- Professionals can view their own interests
CREATE POLICY "Professionals can view their own interests" ON project_interests
    FOR SELECT
    USING (professional_id = auth.uid());

-- Professionals can create interests
CREATE POLICY "Professionals can create interests" ON project_interests
    FOR INSERT
    WITH CHECK (professional_id = auth.uid());

-- Project owners can view interests on their projects
CREATE POLICY "Project owners can view interests on their projects" ON project_interests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_interests.project_id
            AND p.user_id = auth.uid()
        )
    );

-- Admins can view all interests
CREATE POLICY "Admins can view all interests" ON project_interests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.role IN ('admin', 'super_admin')
        )
    );

-- -----------------------------------------------------
-- CONVERSATIONS TABLE POLICIES
-- -----------------------------------------------------

DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Admins can view all conversations" ON conversations;

-- Users can view their own conversations
CREATE POLICY "Users can view their own conversations" ON conversations
    FOR SELECT
    USING (
        participant1_id = auth.uid() 
        OR participant2_id = auth.uid()
    );

-- Users can create conversations
CREATE POLICY "Users can create conversations" ON conversations
    FOR INSERT
    WITH CHECK (
        participant1_id = auth.uid() 
        OR participant2_id = auth.uid()
    );

-- Admins can view all conversations
CREATE POLICY "Admins can view all conversations" ON conversations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.role IN ('admin', 'super_admin', 'support')
        )
    );

-- -----------------------------------------------------
-- MESSAGES TABLE POLICIES
-- -----------------------------------------------------

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON messages;

-- Users can view messages in their conversations
CREATE POLICY "Users can view messages in their conversations" ON messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = messages.conversation_id
            AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
        )
    );

-- Users can send messages in their conversations
CREATE POLICY "Users can send messages in their conversations" ON messages
    FOR INSERT
    WITH CHECK (
        sender_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = messages.conversation_id
            AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
        )
    );

-- Admins can view all messages
CREATE POLICY "Admins can view all messages" ON messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.role IN ('admin', 'super_admin', 'support')
        )
    );

-- -----------------------------------------------------
-- NOTIFICATIONS TABLE POLICIES
-- -----------------------------------------------------

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT
    USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE
    USING (user_id = auth.uid());

-- System can create notifications (service role)
CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT
    WITH CHECK (true);

-- -----------------------------------------------------
-- MATCH_PAYMENTS TABLE POLICIES
-- -----------------------------------------------------

DROP POLICY IF EXISTS "Users can view their own match payments" ON match_payments;
DROP POLICY IF EXISTS "Users can create their own match payments" ON match_payments;
DROP POLICY IF EXISTS "Admins can view all match payments" ON match_payments;

-- Users can view their own match payments
CREATE POLICY "Users can view their own match payments" ON match_payments
    FOR SELECT
    USING (professional_id = auth.uid());

-- Users can create their own match payments
CREATE POLICY "Users can create their own match payments" ON match_payments
    FOR INSERT
    WITH CHECK (professional_id = auth.uid());

-- Admins can view all match payments
CREATE POLICY "Admins can view all match payments" ON match_payments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.role IN ('admin', 'super_admin')
        )
    );

-- -----------------------------------------------------
-- CREDIT_TRANSACTIONS TABLE POLICIES
-- -----------------------------------------------------

DROP POLICY IF EXISTS "Users can view their own credit transactions" ON credit_transactions;
DROP POLICY IF EXISTS "System can create credit transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Admins can view all credit transactions" ON credit_transactions;

-- Users can view their own credit transactions
CREATE POLICY "Users can view their own credit transactions" ON credit_transactions
    FOR SELECT
    USING (user_id = auth.uid());

-- System can create credit transactions (service role)
CREATE POLICY "System can create credit transactions" ON credit_transactions
    FOR INSERT
    WITH CHECK (true);

-- Admins can view all credit transactions
CREATE POLICY "Admins can view all credit transactions" ON credit_transactions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.role IN ('admin', 'super_admin')
        )
    );

-- -----------------------------------------------------
-- REVIEWS TABLE POLICIES
-- -----------------------------------------------------

DROP POLICY IF EXISTS "Users can view reviews" ON reviews;
DROP POLICY IF EXISTS "Users can create reviews for their projects" ON reviews;
DROP POLICY IF EXISTS "Professionals can respond to their reviews" ON reviews;

-- Users can view reviews
CREATE POLICY "Users can view reviews" ON reviews
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Users can create reviews for their projects
CREATE POLICY "Users can create reviews for their projects" ON reviews
    FOR INSERT
    WITH CHECK (
        reviewer_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = reviews.project_id
            AND p.user_id = auth.uid()
        )
    );

-- Professionals can respond to their reviews
CREATE POLICY "Professionals can respond to their reviews" ON reviews
    FOR UPDATE
    USING (professional_id = auth.uid());

-- -----------------------------------------------------
-- DOCUMENTS TABLE POLICIES
-- -----------------------------------------------------

DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can upload their own documents" ON documents;
DROP POLICY IF EXISTS "Admins can view all documents" ON documents;

-- Users can view their own documents
CREATE POLICY "Users can view their own documents" ON documents
    FOR SELECT
    USING (uploaded_by = auth.uid());

-- Users can upload their own documents
CREATE POLICY "Users can upload their own documents" ON documents
    FOR INSERT
    WITH CHECK (uploaded_by = auth.uid());

-- Admins can view all documents
CREATE POLICY "Admins can view all documents" ON documents
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.role IN ('admin', 'super_admin', 'moderator')
        )
    );

-- -----------------------------------------------------
-- ADMIN TABLES POLICIES (Restricted Access)
-- -----------------------------------------------------

-- Platform Settings
DROP POLICY IF EXISTS "Only admins can access platform settings" ON platform_settings;
CREATE POLICY "Only admins can access platform settings" ON platform_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.role IN ('admin', 'super_admin')
        )
    );

-- Pricing Config
DROP POLICY IF EXISTS "Only admins can access pricing config" ON pricing_config;
CREATE POLICY "Only admins can access pricing config" ON pricing_config
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.role IN ('admin', 'super_admin')
        )
    );

-- Admin Actions
DROP POLICY IF EXISTS "Only admins can access admin actions" ON admin_actions;
CREATE POLICY "Only admins can access admin actions" ON admin_actions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.role IN ('admin', 'super_admin', 'moderator')
        )
    );

-- Promo Codes
DROP POLICY IF EXISTS "Admins can manage promo codes" ON promo_codes;
CREATE POLICY "Admins can manage promo codes" ON promo_codes
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.role IN ('admin', 'super_admin')
        )
    );

-- -----------------------------------------------------
-- SUPPORT TICKETS POLICIES
-- -----------------------------------------------------

DROP POLICY IF EXISTS "Users can view their own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON support_tickets;
DROP POLICY IF EXISTS "Support staff can view all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Support staff can update tickets" ON support_tickets;

-- Users can view their own tickets
CREATE POLICY "Users can view their own tickets" ON support_tickets
    FOR SELECT
    USING (user_id = auth.uid());

-- Users can create tickets
CREATE POLICY "Users can create tickets" ON support_tickets
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Support staff can view all tickets
CREATE POLICY "Support staff can view all tickets" ON support_tickets
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.role IN ('admin', 'super_admin', 'support')
        )
    );

-- Support staff can update tickets
CREATE POLICY "Support staff can update tickets" ON support_tickets
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.role IN ('admin', 'super_admin', 'support')
        )
    );

-- -----------------------------------------------------
-- SWIPE HISTORY POLICIES
-- -----------------------------------------------------

DROP POLICY IF EXISTS "Users can view their own swipe history" ON swipe_history;
DROP POLICY IF EXISTS "Users can create their own swipe history" ON swipe_history;

-- Users can view their own swipe history
CREATE POLICY "Users can view their own swipe history" ON swipe_history
    FOR SELECT
    USING (professional_id = auth.uid());

-- Users can create their own swipe history
CREATE POLICY "Users can create their own swipe history" ON swipe_history
    FOR INSERT
    WITH CHECK (professional_id = auth.uid());

-- -----------------------------------------------------
-- MINI MESSAGES POLICIES
-- -----------------------------------------------------

DROP POLICY IF EXISTS "Professionals can view mini messages they sent" ON mini_messages;
DROP POLICY IF EXISTS "Project owners can view mini messages on their projects" ON mini_messages;
DROP POLICY IF EXISTS "Professionals can send mini messages" ON mini_messages;

-- Professionals can view mini messages they sent
CREATE POLICY "Professionals can view mini messages they sent" ON mini_messages
    FOR SELECT
    USING (professional_id = auth.uid());

-- Project owners can view mini messages on their projects
CREATE POLICY "Project owners can view mini messages on their projects" ON mini_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = mini_messages.project_id
            AND p.user_id = auth.uid()
        )
    );

-- Professionals can send mini messages
CREATE POLICY "Professionals can send mini messages" ON mini_messages
    FOR INSERT
    WITH CHECK (professional_id = auth.uid());

-- -----------------------------------------------------
-- PROJECT MILESTONES POLICIES
-- -----------------------------------------------------

DROP POLICY IF EXISTS "Project participants can view milestones" ON project_milestones;
DROP POLICY IF EXISTS "Project owner can create milestones" ON project_milestones;
DROP POLICY IF EXISTS "Project participants can update milestones" ON project_milestones;

-- Project participants can view milestones
CREATE POLICY "Project participants can view milestones" ON project_milestones
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_milestones.project_id
            AND (p.user_id = auth.uid() OR p.professional_id = auth.uid())
        )
    );

-- Project owner can create milestones
CREATE POLICY "Project owner can create milestones" ON project_milestones
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_milestones.project_id
            AND p.user_id = auth.uid()
        )
    );

-- Project participants can update milestones
CREATE POLICY "Project participants can update milestones" ON project_milestones
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_milestones.project_id
            AND (p.user_id = auth.uid() OR p.professional_id = auth.uid())
        )
    );

-- -----------------------------------------------------
-- ESCROW TRANSACTIONS POLICIES
-- -----------------------------------------------------

DROP POLICY IF EXISTS "Project participants can view escrow transactions" ON escrow_transactions;
DROP POLICY IF EXISTS "Admins can view all escrow transactions" ON escrow_transactions;

-- Project participants can view escrow transactions
CREATE POLICY "Project participants can view escrow transactions" ON escrow_transactions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM project_milestones pm
            JOIN projects p ON p.id = pm.project_id
            WHERE pm.id = escrow_transactions.milestone_id
            AND (p.user_id = auth.uid() OR p.professional_id = auth.uid())
        )
    );

-- Admins can view all escrow transactions
CREATE POLICY "Admins can view all escrow transactions" ON escrow_transactions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.role IN ('admin', 'super_admin')
        )
    );

-- =====================================================
-- STEP 3: VERIFY RLS IS ENABLED ON ALL TABLES
-- =====================================================

DO $$
DECLARE
    table_record RECORD;
    rls_enabled BOOLEAN;
    table_owner TEXT;
    tables_without_rls TEXT[] := ARRAY[]::TEXT[];
    system_tables TEXT[] := ARRAY['spatial_ref_sys', 'geography_columns', 'geometry_columns'];
BEGIN
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        -- Skip system tables
        IF table_record.tablename = ANY(system_tables) THEN
            CONTINUE;
        END IF;
        
        SELECT relrowsecurity INTO rls_enabled
        FROM pg_class 
        WHERE relname = table_record.tablename
        AND relnamespace = 'public'::regnamespace;
        
        IF NOT rls_enabled THEN
            tables_without_rls := array_append(tables_without_rls, table_record.tablename);
        END IF;
    END LOOP;
    
    IF array_length(tables_without_rls, 1) > 0 THEN
        RAISE WARNING 'RLS not enabled on tables: %', array_to_string(tables_without_rls, ', ');
        RAISE NOTICE '⚠️  Some tables do not have RLS enabled (may be system tables)';
    ELSE
        RAISE NOTICE '✅ SUCCESS: RLS is enabled on all user tables';
        RAISE NOTICE '✅ Comprehensive security policies have been applied';
        RAISE NOTICE '✅ The "rls_disabled_in_public" vulnerability has been fixed';
    END IF;
END $$;

-- =====================================================
-- STEP 4: CREATE HELPER FUNCTION TO CHECK RLS STATUS
-- =====================================================

CREATE OR REPLACE FUNCTION check_rls_status()
RETURNS TABLE(
    table_name TEXT,
    rls_enabled BOOLEAN,
    policy_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::TEXT,
        c.relrowsecurity,
        COUNT(p.polname)
    FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    LEFT JOIN pg_policies p ON p.tablename = t.tablename
    WHERE t.schemaname = 'public'
    GROUP BY t.tablename, c.relrowsecurity
    ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_rls_status() TO authenticated;

COMMENT ON FUNCTION check_rls_status() IS 'Helper function to check RLS status and policy count for all tables';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- All tables now have RLS enabled with comprehensive policies
-- The critical security vulnerability has been resolved
-- =====================================================
