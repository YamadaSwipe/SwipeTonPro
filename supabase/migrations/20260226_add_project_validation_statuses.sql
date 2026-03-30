-- Update project_status enum to include validation workflow
-- Add new statuses for project validation: pending_validation, active, rejected

-- Drop all dependent views/functions first
DROP TYPE IF EXISTS project_status CASCADE;

-- Create new enum with all statuses
CREATE TYPE project_status AS ENUM ('draft', 'published', 'pending_validation', 'active', 'matched', 'in_progress', 'completed', 'cancelled', 'rejected');

-- Alter the projects table to use the new enum
ALTER TABLE projects
  ALTER COLUMN status SET DEFAULT 'draft'::project_status,
  ALTER COLUMN status TYPE project_status USING status::text::project_status;

-- Add comment explaining the workflow
COMMENT ON TYPE project_status IS 
'Project status enumeration for the complete workflow:
- draft: Initial state
- published: Regularly published (old status)
- pending_validation: Awaiting admin approval
- active: Approved and visible on marketplace
- matched: Has matches/bids
- in_progress: Work started
- completed: Work finished
- cancelled: Cancelled by user
- rejected: Rejected by admin during validation';
