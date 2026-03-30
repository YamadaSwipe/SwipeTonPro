-- ========================================
-- CHECK TABLES AND USER DATA
-- ========================================

-- Check if profiles table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE  table_schema = 'public'
   AND    table_name   = 'profiles'
) AS profiles_table_exists;

-- Check if the specific user exists in profiles
SELECT COUNT(*) as user_count, 
       id, 
       email, 
       role, 
       created_at
FROM profiles 
WHERE id = '55101558-7c22-45be-baff-4688b1419b3d'
GROUP BY id, email, role, created_at;

-- List all profiles (limit 5 for security)
SELECT id, email, role, created_at 
FROM profiles 
LIMIT 5;

-- Check RLS status on profiles table
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'profiles';
