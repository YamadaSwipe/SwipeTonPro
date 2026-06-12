--- Enable RLS on ALL public tables to fix critical security vulnerability
--- This migration ensures no table in the public schema is publicly accessible
--- Run this to fix the "rls_disabled_in_public" security alert

-- Enable RLS on all tables in the public schema
-- This is a comprehensive fix that covers all tables, including any new ones

DO $$
DECLARE
    table_record RECORD;
BEGIN
    -- Loop through all tables in the public schema
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        -- Enable RLS on each table
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_record.tablename);
        RAISE NOTICE 'Enabled RLS on table: %', table_record.tablename;
    END LOOP;
END $$;

-- Verify RLS is enabled on all tables
DO $$
DECLARE
    table_record RECORD;
    rls_enabled BOOLEAN;
BEGIN
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        SELECT relrowsecurity INTO rls_enabled
        FROM pg_class 
        WHERE relname = table_record.tablename;
        
        IF NOT rls_enabled THEN
            RAISE EXCEPTION 'RLS not enabled on table: %', table_record.tablename;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'RLS is enabled on all public tables';
END $$;
