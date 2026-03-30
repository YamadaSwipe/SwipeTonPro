-- Fix admin role assignment on user creation
-- This ensures admin and super_admin users get the correct role

-- Update the handle_new_user function to check for admin emails
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role user_role;
BEGIN
  -- Determine role from metadata first, then check email domain
  v_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    CASE 
      -- Admin emails ending with @swipetonpro.fr or @swipetonpro.com
      WHEN NEW.email ILIKE '%@swipetonpro.fr' THEN 'admin'::user_role
      WHEN NEW.email ILIKE '%@swipetonpro.com' THEN 'admin'::user_role
      -- Super admin check (optional - for specific emails)
      WHEN NEW.email IN ('reda@swipetonpro.fr', 'admin@swipetonpro.fr') THEN 'super_admin'::user_role
      ELSE 'client'::user_role
    END
  );

  -- Create profile with determined role
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilisateur'),
    v_role
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the registration
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update existing admin profiles if their email matches admin domain
UPDATE public.profiles
SET role = 'admin'
WHERE email ILIKE '%@swipetonpro.fr' AND role = 'client';

UPDATE public.profiles
SET role = 'admin'
WHERE email ILIKE '%@swipetonpro.com' AND role = 'client';

-- Update super admin if needed
UPDATE public.profiles
SET role = 'super_admin'
WHERE email IN ('reda@swipetonpro.fr', 'admin@swipetonpro.fr') AND role != 'super_admin';
