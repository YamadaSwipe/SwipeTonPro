-- Étape 1 : Supprimer la contrainte de clé étrangère qui bloque tout
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Étape 2 : Créer le profil admin maintenant
INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
) VALUES (
  '55101558-7c22-45be-baff-4688b1419b3d',
  'admin@swipetonpro.fr',
  'Super Admin',
  'super_admin',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  email = 'admin@swipetonpro.fr',
  full_name = 'Super Admin',
  updated_at = NOW();

-- Étape 3 : Créer une fonction trigger pour créer automatiquement les profils
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Étape 4 : Attacher le trigger à auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Étape 5 : Vérifier que le profil admin a bien été créé
SELECT id, email, full_name, role, created_at
FROM profiles
WHERE id = '55101558-7c22-45be-baff-4688b1419b3d';