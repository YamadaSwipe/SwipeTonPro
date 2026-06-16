-- =====================================================
-- FIX INFINITE RECURSION IN PROFILES RLS POLICIES
-- =====================================================
-- Le problème: Les politiques admin font un SELECT sur profiles
-- pour vérifier le rôle, ce qui crée une récursion infinie
-- car la politique s'applique à elle-même.
--
-- Solution: Utiliser auth.jwt() pour accéder directement aux
-- métadonnées utilisateur sans faire de SELECT sur profiles
-- =====================================================

-- =====================================================
-- PROFILES TABLE - Supprimer la récursion infinie
-- =====================================================

-- Politique 1: Les utilisateurs peuvent voir leur propre profil
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Politique 2: Les utilisateurs peuvent mettre à jour leur propre profil
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Politique 3: Les utilisateurs peuvent insérer leur propre profil
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Politique 4: Les admins peuvent voir tous les profils
-- CORRECTION: Utiliser auth.jwt() au lieu de SELECT sur profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
        OR
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')
    );

-- Politique 5: Les admins peuvent mettre à jour tous les profils
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
        OR
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')
    );

-- =====================================================
-- PROJECTS TABLE - Corriger les politiques admin
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all projects" ON projects;
CREATE POLICY "Admins can view all projects" ON projects
    FOR SELECT
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin', 'moderator')
        OR
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin', 'moderator')
    );

DROP POLICY IF EXISTS "Admins can update all projects" ON projects;
CREATE POLICY "Admins can update all projects" ON projects
    FOR UPDATE
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin', 'moderator')
        OR
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin', 'moderator')
    );

-- =====================================================
-- PROJECT_INTERESTS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all interests" ON project_interests;
CREATE POLICY "Admins can view all interests" ON project_interests
    FOR SELECT
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
        OR
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')
    );

-- =====================================================
-- PROFESSIONALS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all professionals" ON professionals;
CREATE POLICY "Admins can view all professionals" ON professionals
    FOR SELECT
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin', 'moderator')
        OR
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin', 'moderator')
    );

-- =====================================================
-- CONVERSATIONS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all conversations" ON conversations;
CREATE POLICY "Admins can view all conversations" ON conversations
    FOR SELECT
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin', 'support')
        OR
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin', 'support')
    );

-- =====================================================
-- MESSAGES TABLE
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all messages" ON messages;
CREATE POLICY "Admins can view all messages" ON messages
    FOR SELECT
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin', 'support')
        OR
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin', 'support')
    );

-- =====================================================
-- MATCH_PAYMENTS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all match payments" ON match_payments;
CREATE POLICY "Admins can view all match payments" ON match_payments
    FOR SELECT
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
        OR
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')
    );

-- =====================================================
-- CREDIT_TRANSACTIONS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all credit transactions" ON credit_transactions;
CREATE POLICY "Admins can view all credit transactions" ON credit_transactions
    FOR SELECT
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
        OR
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')
    );

-- =====================================================
-- DOCUMENTS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all documents" ON documents;
CREATE POLICY "Admins can view all documents" ON documents
    FOR SELECT
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin', 'moderator')
        OR
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin', 'moderator')
    );

-- =====================================================
-- ADMIN TABLES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Only admins can access platform settings" ON platform_settings;
CREATE POLICY "Only admins can access platform settings" ON platform_settings
    FOR ALL
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
        OR
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')
    );

DROP POLICY IF EXISTS "Only admins can access pricing config" ON pricing_config;
CREATE POLICY "Only admins can access pricing config" ON pricing_config
    FOR ALL
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
        OR
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')
    );

DROP POLICY IF EXISTS "Only admins can access admin actions" ON admin_actions;
CREATE POLICY "Only admins can access admin actions" ON admin_actions
    FOR ALL
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin', 'moderator')
        OR
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin', 'moderator')
    );

DROP POLICY IF EXISTS "Admins can manage promo codes" ON promo_codes;
CREATE POLICY "Admins can manage promo codes" ON promo_codes
    FOR ALL
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
        OR
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')
    );

-- =====================================================
-- SUPPORT TICKETS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Support staff can view all tickets" ON support_tickets;
CREATE POLICY "Support staff can view all tickets" ON support_tickets
    FOR SELECT
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin', 'support')
        OR
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin', 'support')
    );

DROP POLICY IF EXISTS "Support staff can update tickets" ON support_tickets;
CREATE POLICY "Support staff can update tickets" ON support_tickets
    FOR UPDATE
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin', 'support')
        OR
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin', 'support')
    );

-- =====================================================
-- ESCROW TRANSACTIONS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all escrow transactions" ON escrow_transactions;
CREATE POLICY "Admins can view all escrow transactions" ON escrow_transactions
    FOR SELECT
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
        OR
        (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')
    );

-- =====================================================
-- VÉRIFICATION FINALE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ CORRECTION DE LA RÉCURSION INFINIE DANS LES POLITIQUES RLS';
    RAISE NOTICE '✅ Toutes les politiques admin utilisent maintenant auth.jwt()';
    RAISE NOTICE '✅ Plus de SELECT sur profiles dans les politiques de profiles';
    RAISE NOTICE '✅ Le problème "infinite recursion detected in policy" est résolu';
END $$;
