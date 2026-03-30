/**
 * @fileoverview Contexte d'Authentification Global - Source Unique de Vérité
 * @author Senior Architect
 * @version 1.0.0
 *
 * Contexte React pour gérer l'authentification, les rôles et les profils
 * Évite le mélange de comptes et les incohérences
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/router';

// Types pour l'authentification
interface User {
  id: string;
  email: string;
  created_at: string;
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  city?: string;
  postal_code?: string;
  role?: 'client' | 'professional' | 'admin' | 'super_admin';
}

interface Professional {
  id: string;
  user_id: string;
  company_name: string;
  status: 'pending' | 'verified' | 'suspended';
  specialties: string[];
  experience_years?: number;
  rating_average?: number;
}

interface AuthContextType {
  // États
  user: User | null;
  profile: Profile | null;
  professional: Professional | null;
  role: 'client' | 'professional' | 'admin' | 'super_admin' | null;
  loading: boolean;
  initialized: boolean;

  // Actions
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (requiredRole: string) => boolean;
  isOwner: (resourceUserId: string) => boolean;
}

// Initialisation Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Création du contexte
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook personnalisé pour utiliser le contexte
export const useAuth = () => {
  const context = useContext(AuthContext);
  // Gérer le cas SSR où le contexte n'existe pas encore
  if (typeof window === 'undefined' && !context) {
    // Côté serveur : retourner des valeurs par défaut
    return {
      user: null,
      profile: null,
      professional: null,
      role: null,
      loading: false,
      initialized: false,
      login: async (_email: string, _password: string) => {
        console.warn('useAuth: login appelé côté serveur - non supporté');
        return { success: false, error: 'Server-side rendering not supported' };
      },
      logout: async () => {
        console.warn('useAuth: logout appelé côté serveur - non supporté');
      },
      refreshUser: async () => {
        console.warn('useAuth: refreshUser appelé côté serveur - non supporté');
      },
      hasRole: (_requiredRole: string) => {
        console.warn('useAuth: hasRole appelé côté serveur - retourne false');
        return false;
      },
      isOwner: (_resourceUserId: string) => {
        console.warn('useAuth: isOwner appelé côté serveur - retourne false');
        return false;
      },
    } as AuthContextType;
  }
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

// Provider du contexte
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const router = useRouter();

  console.log('🚀 AuthProvider: Initialisation du provider...');

  // Guards pour éviter les initialisations multiples
  const isInitialized = useRef(false);
  const isLoadingUserRef = useRef(false);

  // États globaux - SOURCE UNIQUE DE VÉRITÉ
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [role, setRole] = useState<
    'client' | 'professional' | 'admin' | 'super_admin' | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  console.log('📊 AuthProvider: États initiaux', {
    loading,
    initialized,
    hasUser: !!user,
  });

  /**
   * Charger les données complètes de l'utilisateur
   */
  const loadUserData = async (userId: string) => {
    console.log('🔄 LOAD USER DATA ONCE for:', userId);

    try {
      // 1. Charger le profil de base
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(); // <-- maybeSingle au lieu de single

      if (!profileData) {
        console.warn('⚠️ AuthContext: No profile found for user:', userId);
        // Pas d'erreur, juste pas de profil
      } else if (profileError && profileError.code !== 'PGRST116') {
        console.error('❌ AuthContext: Profile error:', profileError);
        throw profileError;
      }

      // 2. Charger les données professionnelles SEULEMENT si le rôle est 'professional'
      let professionalData = null;
      if (profileData?.role === 'professional') {
        console.log(
          '🔍 AuthContext: Loading professional data for user:',
          userId
        );
        const { data: profData } = await supabase
          .from('professionals')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        professionalData = profData;
        console.log('✅ AuthContext: Professional data loaded:', profData);
      } else {
        console.log(
          'ℹ️ AuthContext: User is not professional, skipping professional data load'
        );
      }

      // 3. Utiliser le rôle du profil déjà chargé (PLUS DE REQUÊTES)
      const userRole = profileData?.role || 'client'; // Par défaut = client

      console.log('✅ AuthContext: Role determined from profile:', {
        userId,
        role: userRole,
        profileRole: profileData?.role,
      });

      // 4. Mettre à jour les états (ATOMIC) - SÉCURITÉ CRITIQUE
      console.log('🔒 AUTH SECURITY CHECK:', {
        userId,
        email: user?.email,
        profileRole: profileData?.role,
        finalRole: userRole,
        hasProfile: !!profileData,
        hasProfessional: !!professionalData,
        profileId: profileData?.id,
        professionalId: professionalData?.id,
        timestamp: new Date().toISOString(),
      });

      setProfile(profileData);
      setProfessional(professionalData);
      setRole(userRole);

      console.log('✅ AuthContext: User data loaded:', {
        user: userId,
        role: userRole,
        hasProfile: !!profileData,
        hasProfessional: !!professionalData,
      });
    } catch (error) {
      console.error('❌ AuthContext: Error loading user data:', error);
      // En cas d'erreur, on garde l'utilisateur mais sans profil
      setProfile(null);
      setProfessional(null);
      setRole(null);
    }
  };

  /**
   * Initialisation au chargement du composant
   */
  useEffect(() => {
    const initializeAuth = async () => {
      // Guard pour éviter l'initialisation multiple
      if (isInitialized.current) {
        console.log('⚠️ AuthContext: Already initialized, skipping...');
        return;
      }

      console.log('🚀 INIT AUTH ONCE');
      isInitialized.current = true;

      // Test de connexion Supabase
      console.log('🔧 Test de connexion Supabase...');
      console.log('🔗 URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log(
        '🔑 Anon Key:',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Présent' : '❌ Manquant'
      );

      try {
        console.log('🚀 AuthContext: Initializing authentication...');

        // 1. Récupérer la session Supabase
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        console.log('📊 Session result:', {
          session: !!session,
          error: !!sessionError,
        });

        if (sessionError) {
          console.error('❌ AuthContext: Session error:', sessionError);
          setLoading(false);
          setInitialized(true);
          return;
        }

        if (session?.user) {
          console.log(
            '✅ AuthContext: Session found for user:',
            session.user.email
          );
          setUser({
            id: session.user.id,
            email: session.user.email,
            created_at: session.user.created_at,
          });

          // 2. Charger les données complètes
          await loadUserData(session.user.id);
        } else {
          console.log('ℹ️ AuthContext: No session found');
          setLoading(false);
          setInitialized(true);
        }
      } catch (error) {
        console.error('❌ AuthContext: Initialization error:', error);
      } finally {
        setLoading(false);
        setInitialized(true);
        console.log('✅ AuthContext: Initialisation terminée');
      }
    };

    // Timeout de sécurité pour éviter le blocage
    const timeout = setTimeout(() => {
      if (!initialized) {
        console.warn("⏰ AuthContext: Timeout d'initialisation, forçage...");
        setLoading(false);
        setInitialized(true);
      }
    }, 10000); // 10 secondes

    initializeAuth();

    return () => {
      clearTimeout(timeout);
    };
  }, []); // <-- Dépendances vides pour n'exécuter qu'une seule fois

  // 3. Écouter les changements de session (SANS rappeler initializeAuth)
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);

      // Guard pour éviter les conflits pendant l'initialisation
      if (!isInitialized.current) return;

      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ AuthContext: User signed in:', session.user.email);
        setUser({
          id: session.user.id,
          email: session.user.email,
          created_at: session.user.created_at,
        });
        await loadUserData(session.user.id); // <-- PAS initializeAuth ici
      } else if (event === 'SIGNED_OUT') {
        console.log('✅ AuthContext: User signed out');
        await resetAuthState();
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // 4. Debug logging pour éviter les mélanges de comptes
  useEffect(() => {
    if (!user) return; // Guard pour éviter les logs avant que user soit disponible

    console.log('🔒 AUTH SECURITY DEBUG:', {
      userId: user?.id,
      email: user?.email,
      role: profile?.role,
      initialized,
      loading,
      profileId: profile?.id,
      professionalId: professional?.id,
      // VALIDATIONS DE SÉCURITÉ
      hasProfile: !!profile,
      hasConsistentRole: profile?.role === role,
      timestamp: new Date().toISOString(),
    });

    // 🚨 ALERTE SÉCURITÉ si mélange détecté
    if (profile && professional && profile.role !== 'professional') {
      console.error(
        '🚨 SÉCURITÉ CRITIQUE: Particulier avec données professionnelles!',
        {
          userId: user?.id,
          email: user?.email,
          profileRole: profile.role,
          hasProfessionalData: !!professional,
        }
      );
    }

    if (profile && profile.role === 'professional' && !professional) {
      console.error(
        '🚨 SÉCURITÉ CRITIQUE: Professionnel sans données professionnelles!',
        {
          userId: user?.id,
          email: user?.email,
          profileRole: profile.role,
          hasProfessionalData: !!professional,
        }
      );
    }
  }, [user, profile, professional, role, initialized, loading]);

  /**
   * Connexion utilisateur
   */
  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔐 AuthContext: Attempting login for:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ AuthContext: Login error:', error);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log('✅ AuthContext: Login successful:', data.user.email);
        setUser({
          id: data.user.id,
          email: data.user.email,
          created_at: data.user.created_at,
        });
        await loadUserData(data.user.id);
        return { success: true };
      }

      return { success: false, error: 'Erreur inconnue' };
    } catch (error) {
      console.error('❌ AuthContext: Login exception:', error);
      return { success: false, error: 'Erreur système' };
    }
  };

  /**
   * Déconnexion utilisateur
   */
  const logout = async (): Promise<void> => {
    try {
      console.log('🚪 AuthContext: Logging out user...');

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('❌ AuthContext: Logout error:', error);
      } else {
        console.log('✅ AuthContext: Logout successful');
        await resetAuthState();
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('❌ AuthContext: Logout exception:', error);
      await resetAuthState();
      router.push('/auth/login');
    }
  };

  /**
   * Réinitialiser l'état d'authentification
   */
  const resetAuthState = async (): Promise<void> => {
    console.log('🔄 AuthContext: Resetting auth state...');

    setUser(null);
    setProfile(null);
    setProfessional(null);
    setRole(null);
    setLoading(false);

    console.log('✅ AuthContext: Auth state reset complete');
  };

  /**
   * Rafraîchir les données utilisateur
   */
  const refreshUser = async (): Promise<void> => {
    if (!user) {
      console.warn('⚠️ AuthContext: Cannot refresh user - no user logged in');
      return;
    }

    console.log('🔄 AuthContext: Refreshing user data...');
    await loadUserData(user.id);
  };

  /**
   * Vérifier si l'utilisateur a un rôle spécifique
   */
  const hasRole = (requiredRole: string): boolean => {
    if (!role) return false;

    // Gestion des hiérarchies de rôles
    if (
      requiredRole === 'admin' &&
      (role === 'admin' || role === 'super_admin')
    ) {
      return true;
    }

    return role === requiredRole;
  };

  /**
   * Vérifier si l'utilisateur est le propriétaire d'une ressource
   */
  const isOwner = (resourceUserId: string): boolean => {
    if (!user) return false;
    return user.id === resourceUserId;
  };

  // Valeur du contexte
  const value: AuthContextType = {
    // États
    user,
    profile,
    professional,
    role,
    loading,
    initialized,

    // Actions
    login,
    logout,
    refreshUser,
    hasRole,
    isOwner,
  };

  // Anti-bug React: ne pas render tant que pas initialisé
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <p className="text-gray-700 text-lg font-medium">
            Chargement de l'authentification...
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Initialisation de SwipeTonPro
          </p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
