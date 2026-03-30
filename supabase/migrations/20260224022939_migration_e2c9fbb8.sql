-- Add urgency column to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS urgency text DEFAULT 'low';

-- Fix Enum types issues if necessary (Types are already created, just need to use them correctly in code)