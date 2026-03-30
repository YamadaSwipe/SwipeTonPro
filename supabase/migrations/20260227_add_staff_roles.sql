-- Add new staff roles to user_role enum
-- This migration adds support, moderator, and team roles to the user_role enum type

-- First, we need to recreate the enum type with the new values
-- PostgreSQL doesn't allow adding values to enums directly, so we need to:
-- 1. Create a new enum type
-- 2. Cast the column to the new type
-- 3. Drop the old type
-- 4. Rename the new type

-- Create the new enum with all values
CREATE TYPE user_role_new AS ENUM ('super_admin', 'admin', 'support', 'moderator', 'team', 'professional', 'client');

-- Alter the profiles table: convert the existing role values to the new type
ALTER TABLE profiles 
  ALTER COLUMN role TYPE user_role_new USING role::text::user_role_new;

-- Drop the old enum
DROP TYPE user_role;

-- Rename the new enum to the original name
ALTER TYPE user_role_new RENAME TO user_role;


-- Add permissions table for detailed access control
CREATE TABLE IF NOT EXISTS staff_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on staff_id and permission for faster queries
CREATE INDEX IF NOT EXISTS idx_staff_permissions_staff_id ON staff_permissions(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_permissions_permission ON staff_permissions(permission);

-- Add a unique constraint to prevent duplicate permissions for the same staff
CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_permissions_unique ON staff_permissions(staff_id, permission);


-- Add validation_status column to projects table if it doesn't exist
-- This allows admin to validate projects before they appear in listings
ALTER TABLE projects ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'draft' CHECK (validation_status IN ('draft', 'pending', 'validated', 'rejected'));
ALTER TABLE projects ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS validation_notes TEXT;

-- Add created_by_admin flag to know if a project was created by admin
ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_by_admin BOOLEAN DEFAULT FALSE;

-- Create index for validation queries
CREATE INDEX IF NOT EXISTS idx_projects_validation_status ON projects(validation_status);
CREATE INDEX IF NOT EXISTS idx_projects_created_by_admin ON projects(created_by_admin);
