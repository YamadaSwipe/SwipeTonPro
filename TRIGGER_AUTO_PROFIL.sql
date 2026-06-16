-- ========================================
-- CONFIGURATION TRIGGER AUTOMATIQUE DE CRÉATION DE PROFIL
-- ========================================
-- Ce fichier SQL configure un trigger PostgreSQL qui crée automatiquement
-- un profil dans la table 'profiles' dès qu'un utilisateur s'inscrit
-- dans la table 'auth.users' de Supabase.
--
-- FONCTIONNALITÉS :
-- ✓ Création automatique du profil lors de l'inscription
-- ✓ Attribution du rôle selon les métadonnées (artisan ou recruteur)
-- ✓ Création automatique d'une entrée dans 'professionals' pour les artisans
-- ✓ Gestion des erreurs sans bloquer l'inscription
-- ✓ Attribution de 3 crédits gratuits aux nouveaux professionnels
--
-- UTILISATION :
-- 1. Copier tout le contenu de ce fichier
-- 2. Se connecter à votre base de données Supabase
-- 3. Aller dans SQL Editor
-- 4. Coller et exécuter le script
-- ========================================

-- Étape 1 : Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Étape 2 : Créer ou remplacer la fonction de gestion des nouveaux utilisateurs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role user_role;
  v_user_type TEXT;
BEGIN
  -- Récupérer le type d'utilisateur depuis les métadonnées
  -- Les métadonnées sont passées lors de l'inscription (signUp)
  v_user_type := NEW.raw_user_meta_data->>'user_type';
  
  -- Déterminer le rôle en fonction des métadonnées et de l'email
  v_role := CASE 
    -- Priorité 1 : Si le rôle est explicitement défini dans les métadonnées
    WHEN (NEW.raw_user_meta_data->>'role') IS NOT NULL THEN 
      (NEW.raw_user_meta_data->>'role')::user_role
    
    -- Priorité 2 : Si user_type indique un professionnel/artisan
    WHEN v_user_type IN ('professional', 'artisan', 'professionnel') THEN 
      'professional'::user_role
    
    -- Priorité 3 : Si user_type indique un client/recruteur
    WHEN v_user_type IN ('client', 'recruteur', 'particulier') THEN 
      'client'::user_role
    
    -- Priorité 4 : Vérifier les emails admin (domaines swipetonpro)
    WHEN NEW.email ILIKE '%@swipetonpro.fr' THEN 
      'admin'::user_role
    WHEN NEW.email ILIKE '%@swipetonpro.com' THEN 
      'admin'::user_role
    
    -- Priorité 5 : Super admin pour des emails spécifiques
    WHEN NEW.email IN ('reda@swipetonpro.fr', 'admin@swipetonpro.fr') THEN 
      'super_admin'::user_role
    
    -- Par défaut : assigner le rôle 'client'
    ELSE 
      'client'::user_role
  END;

  -- Étape 3 : Créer le profil dans la table profiles
  INSERT INTO public.profiles (
    id,                 -- UUID de l'utilisateur (même que auth.users)
    email,              -- Email de l'utilisateur
    full_name,          -- Nom complet
    phone,              -- Numéro de téléphone
    role,               -- Rôle déterminé ci-dessus
    created_at,         -- Date de création
    updated_at          -- Date de mise à jour
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

  -- Étape 4 : Si le rôle est 'professional', créer également une entrée dans professionals
  IF v_role = 'professional' THEN
    INSERT INTO public.professionals (
      user_id,            -- Référence vers profiles.id
      siret,              -- Numéro SIRET (temporaire si non fourni)
      company_name,       -- Nom de l'entreprise
      status,             -- Statut du professionnel (en attente de validation)
      credits_balance,    -- Solde de crédits initial (3 crédits gratuits)
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
      3,  -- 3 crédits gratuits pour commencer
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO NOTHING; -- Éviter les doublons si déjà existant
  END IF;

  RETURN NEW;
  
EXCEPTION WHEN OTHERS THEN
  -- En cas d'erreur, logger mais ne pas bloquer l'inscription
  RAISE WARNING 'Erreur dans handle_new_user pour l''utilisateur % : %', NEW.email, SQLERRM;
  
  -- Tenter de créer au moins un profil basique de secours
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

-- Étape 5 : Créer le trigger sur la table auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Étape 6 : Ajouter un commentaire pour la documentation
COMMENT ON FUNCTION public.handle_new_user() IS 
'Fonction trigger qui crée automatiquement un profil dans la table profiles 
lors de l''inscription d''un utilisateur via Supabase Auth. 
Le rôle est déterminé selon les métadonnées (user_type ou role) :
- professional/artisan → rôle professional + création dans table professionals avec 3 crédits
- client/recruteur → rôle client
- emails @swipetonpro.fr/com → rôle admin
Par défaut : client';

-- Étape 7 : Vérifier et corriger les profils existants (OPTIONNEL)
-- Cette partie met à jour les profils existants qui devraient être des professionnels
DO $$
BEGIN
  -- Mettre à jour les profils qui ont une entrée dans professionals mais sont marqués comme client
  UPDATE public.profiles p
  SET role = 'professional'::user_role
  FROM public.professionals pr
  WHERE p.id = pr.user_id 
    AND p.role = 'client'::user_role;
  
  RAISE NOTICE 'Profils existants mis à jour avec succès';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erreur lors de la mise à jour des profils existants : %', SQLERRM;
END $$;

-- ========================================
-- VÉRIFICATION DE L'INSTALLATION
-- ========================================
-- Exécutez cette requête pour vérifier que le trigger est bien installé :
-- SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- ========================================
-- EXEMPLE D'UTILISATION DANS VOTRE CODE
-- ========================================
-- Lors de l'inscription d'un artisan :
/*
const { data, error } = await supabase.auth.signUp({
  email: 'artisan@example.com',
  password: 'motdepasse123',
  options: {
    data: {
      user_type: 'professional',  // ou 'artisan'
      full_name: 'Jean Dupont',
      phone: '0612345678',
      company_name: 'Entreprise Dupont',
      siret: '12345678901234'
    }
  }
});
*/

-- Lors de l'inscription d'un recruteur/client :
/*
const { data, error } = await supabase.auth.signUp({
  email: 'client@example.com',
  password: 'motdepasse123',
  options: {
    data: {
      user_type: 'client',  // ou 'recruteur' ou 'particulier'
      full_name: 'Marie Martin',
      phone: '0698765432'
    }
  }
});
*/

-- ========================================
-- FIN DU SCRIPT
-- ========================================
