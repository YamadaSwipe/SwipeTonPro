-- Créer une fonction qui sera appelée automatiquement après l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer automatiquement un profil pour le nouvel utilisateur
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilisateur'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger qui appelle la fonction après chaque inscription
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Commenter la fonction pour documentation
COMMENT ON FUNCTION public.handle_new_user() IS 
'Trigger function qui crée automatiquement un profil dans la table profiles quand un utilisateur s''inscrit via Supabase Auth. Le rôle par défaut est client, sauf si spécifié dans les métadonnées.';