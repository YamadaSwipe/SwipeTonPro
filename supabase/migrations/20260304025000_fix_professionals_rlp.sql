-- Fix RLP for professionals table to allow admin updates
-- Enable RLS
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Professionals can view own profile" ON professionals;
DROP POLICY IF EXISTS "Professionals can update own profile" ON professionals;
DROP POLICY IF EXISTS "Professionals can insert own profile" ON professionals;
DROP POLICY IF EXISTS "Admins can view all professionals" ON professionals;
DROP POLICY IF EXISTS "Admins can update all professionals" ON professionals;

-- Create new policies
CREATE POLICY "Professionals can view own profile" ON professionals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Professionals can update own profile" ON professionals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Professionals can insert own profile" ON professionals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all professionals" ON professionals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update all professionals" ON professionals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can insert professionals" ON professionals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Grant necessary permissions
GRANT ALL ON professionals TO authenticated;
GRANT ALL ON professionals TO service_role;
