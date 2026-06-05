--- Check for profile consistency issues
-- This query identifies accounts with conflicting profile data

-- 1. Find clients with professional data (should not exist)
SELECT 
  p.id as profile_id,
  p.email,
  p.role as profile_role,
  prof.id as professional_id,
  prof.company_name,
  'Client with professional data' as issue
FROM profiles p
LEFT JOIN professionals prof ON prof.user_id = p.id
WHERE p.role = 'client' AND prof.id IS NOT NULL;

-- 2. Find professionals without professional data (should not exist)
SELECT 
  p.id as profile_id,
  p.email,
  p.role as profile_role,
  prof.id as professional_id,
  'Professional without professional data' as issue
FROM profiles p
LEFT JOIN professionals prof ON prof.user_id = p.id
WHERE p.role = 'professional' AND prof.id IS NULL;

-- 3. Find duplicate profiles for the same email
SELECT 
  email,
  COUNT(*) as profile_count,
  STRING_AGG(role::text, ', ') as roles,
  STRING_AGG(id::text, ', ') as profile_ids
FROM profiles
GROUP BY email
HAVING COUNT(*) > 1;

-- 4. Find profiles without user_id reference (orphaned)
SELECT 
  p.id as profile_id,
  p.email,
  p.role,
  'Profile without user reference' as issue
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE u.id IS NULL;
