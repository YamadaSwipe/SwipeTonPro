-- ========================================
-- Trigger automatique pour créer un profil lors de l'inscription
-- ========================================
-- Cette migration améliore la fonction handle_new_user pour gérer
-- automatiquement la création de profils avec les rôles appropriés
-- (artisan/professionnel ou recruteur/client) lors de l'inscription

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer ou remplacer la fonction de gestion des nouveaux utilisateurs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role user_role;
  v_user_type TEXT;
BEGIN
  -- Récupérer le type d'utilisateur depuis les métadonnées
  v_user_type := NEW.raw_user_meta_data->>'user_type';
  
  -- Déterminer le rôle en fonction des métadonnées et de l'email
  v_role := CASE 
    -- Si le rôle est explicitement défini dans les métadonnées, l'utiliser
    WHEN (NEW.raw_user_meta_data->>'role') IS NOT NULL THEN 
      (NEW.raw_user_meta_data->>'role')::user_role
    
    -- Si user_type est 'professional' ou 'artisan', assigner le rôle 'professional'
    WHEN v_user_type IN ('professional', 'artisan', 'professionnel') THEN 
      'professional'::user_role
    
    -- Si user_type est 'client' ou 'recruteur', assigner le rôle 'client'
    WHEN v_user_type IN ('client', 'recruteur', 'particulier') THEN 
      'client'::user_role
    
    -- Vérifier les emails admin (domaines swipetonpro)
    WHEN NEW.email ILIKE '%@swipetonpro.fr' THEN 
      'admin'::user_role
    WHEN NEW.email ILIKE '%@swipetonpro.com' THEN 
      'admin'::user_role
    
    -- Super admin pour des emails spécifiques
    WHEN NEW.email IN ('reda@swipetonpro.fr', 'admin@swipetonpro.fr') THEN 
      'super_admin'::user_role
    
    -- Par défaut, assigner le rôle 'client'
    ELSE 
      'client'::user_role
  END;

  -- Créer le profil dans la table profiles
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    phone,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      'Utilisateur'
    ),
    NEW.raw_user_meta_data->>'phone',
    v_role,
    NOW(),
    NOW()
  );

  -- Si le rôle est 'professional', créer également une entrée dans la table professionals
  IF v_role = 'professional' THEN
    INSERT INTO public.professionals (
      user_id,
      siret,
      company_name,
      status,
      credits_balance,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'siret', 'EN_ATTENTE'),
      COALESCE(
        NEW.raw_user_meta_data->>'company_name',
        NEW.raw_user_meta_data->>'full_name',
        'Entreprise'
      ),
      'pending'::professional_status,
      3, -- Crédits initiaux gratuits
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO NOTHING; -- Éviter les doublons
  END IF;

  RETURN NEW;
  
EXCEPTION WHEN OTHERS THEN
  -- Logger l'erreur mais ne pas bloquer l'inscription
  RAISE WARNING 'Erreur dans handle_new_user pour l''utilisateur % : %', NEW.email, SQLERRM;
  
  -- Tenter de créer au moins un profil basique
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (NEW.id, NEW.email, 'Utilisateur', 'client'::user_role)
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Impossible de créer le profil de secours : %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger sur la table auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Ajouter un commentaire pour la documentation
COMMENT ON FUNCTION public.handle_new_user() IS 
'Fonction trigger qui crée automatiquement un profil dans la table profiles 
lors de l''inscription d''un utilisateur via Supabase Auth. 
Le rôle est déterminé selon les métadonnées (user_type ou role) :
- professional/artisan → rôle professional + création dans table professionals
- client/recruteur → rôle client
- emails @swipetonpro.fr/com → rôle admin
Par défaut : client';

-- Vérifier et corriger les profils existants sans rôle approprié
-- (optionnel - à exécuter si nécessaire)
DO $$
BEGIN
  -- Mettre à jour les profils qui devraient être des professionnels
  UPDATE public.profiles p
  SET role = 'professional'::user_role
  FROM public.professionals pr
  WHERE p.id = pr.user_id 
    AND p.role = 'client'::user_role;
  
  RAISE NOTICE 'Profils mis à jour avec succès';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erreur lors de la mise à jour des profils existants : %', SQLERRM;
END $$;
