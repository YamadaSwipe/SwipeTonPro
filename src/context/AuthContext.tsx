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
import { supabase } from '@/integrations/supabase/client';
import { useRouter } from 'next/router';

// Types pour l'authentification
interface User {
  id: string;
  email: string;
  created_at: string;
}

interface Profile {
  id: string;
  user_id?: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  city?: string;
  postal_code?: string;
  role?:
    | 'client'
    | 'professional'
    | 'admin'
    | 'super_admin'
    | 'support'
    | 'moderator';
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
        return { success: false, error: 'Server-side rendering not supported' };
      },
      logout: async () => {},
      refreshUser: async () => {},
      hasRole: (_requiredRole: string) => false,
      isOwner: (_resourceUserId: string) => false,
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

  // Guards pour éviter les initialisations multiples
  const isInitialized = useRef(false);
  const isLoadingUserRef = useRef(false);
  const isLoadingUserData = useRef(false);

  // États globaux - SOURCE UNIQUE DE VÉRITÉ
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [role, setRole] = useState<
    'client' | 'professional' | 'admin' | 'super_admin' | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  /**
   * Charger les données complètes de l'utilisateur
   */
  const loadUserData = async (userId: string) => {
    // Empêcher les appels dupliqués
    if (isLoadingUserData.current) {
      return;
    }

    isLoadingUserData.current = true;

    try {
      // 1. Charger le profil de base
      let { data: profileData, error: profileError } = (await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()) as any;

      if (!profileData) {
        // Pas d'erreur, juste pas de profil
      } else if (profileError && profileError.code !== 'PGRST116') {
        console.error('❌ AuthContext: Profile error:', profileError);
        throw profileError;
      }

      // 2. Charger les données professionnelles SEULEMENT si le rôle est 'professional'
      let professionalData = null;
      if (profileData?.role === 'professional') {
        const { data: profData } = (await (supabase as any)
          .from('professionals')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()) as any;

        professionalData = profData;
      }

      // 3. Utiliser le rôle du profil déjà chargé (PLUS DE REQUÊTES)
      const userRole = profileData?.role || 'client'; // Par défaut = client

      // 4. Mettre à jour les états (ATOMIC) - SÉCURITÉ CRITIQUE

      setProfile(profileData);
      setProfessional(professionalData);
      setRole(userRole);
    } catch (error) {
      console.error('❌ AuthContext: Error loading user data:', error);
      // En cas d'erreur, on garde l'utilisateur mais sans profil
      setProfile(null);
      setProfessional(null);
      setRole(null);
    } finally {
      isLoadingUserData.current = false;
    }
  };

  /**
   * Initialisation au chargement du composant
   */
  useEffect(() => {
    const initializeAuth = async () => {
      // Guard pour éviter l'initialisation multiple
      if (isInitialized.current) {
        return;
      }

      isInitialized.current = true;

      try {
        // 1. Récupérer la session Supabase - sans retry bloquant
        const result = await supabase.auth.getSession();
        const session = result.data.session;
        const sessionError = result.error;

        if (sessionError && !session) {
          console.error('❌ AuthContext: Session error:', sessionError);
          setLoading(false);
          setInitialized(true);
          return;
        }

        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            created_at: session.user.created_at,
          });

          // 2. Charger les données complètes
          await loadUserData(session.user.id);
        }
      } catch (error) {
        console.error('❌ AuthContext: Initialization error:', error);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    // Timeout de sécurité pour éviter le blocage - réduit pour meilleure UX
    const timeout = setTimeout(() => {
      if (!initialized) {
        setLoading(false);
        setInitialized(true);
      }
    }, 1500); // 1.5 secondes

    initializeAuth();

    return () => {
      clearTimeout(timeout);
    };
  }, []); // <-- Dépendances vides pour n'exécuter qu'une seule fois

  // 3. Écouter les changements de session avec gestion des locks
  useEffect(() => {
    let subscription: any = null;

    try {
      const result = supabase.auth.onAuthStateChange(async (event, session) => {
        // Guard pour éviter les conflits pendant l'initialisation
        if (!isInitialized.current) return;

        try {
          if (event === 'SIGNED_IN' && session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email,
              created_at: session.user.created_at,
            });
            await loadUserData(session.user.id);
          } else if (event === 'SIGNED_OUT') {
            await resetAuthState();
          }
        } catch (error) {
          console.error(
            '❌ AuthContext: Error in auth state change handler:',
            error
          );
          // Ne pas bloquer l'application en cas d'erreur
          if (event === 'SIGNED_OUT') {
            await resetAuthState();
          }
        }
      });

      subscription = result.data.subscription;
    } catch (error) {
      console.error('❌ AuthContext: Error setting up auth listener:', error);
    }

    return () => {
      try {
        if (subscription?.unsubscribe) {
          subscription.unsubscribe();
        }
      } catch (error) {
        console.error(
          '❌ AuthContext: Error unsubscribing auth listener:',
          error
        );
      }
    };
  }, []);

  // 4. Debug logging pour éviter les mélanges de comptes
  useEffect(() => {
    if (!user) return; // Guard pour éviter les logs avant que user soit disponible

    // 🚨 ALERTE SÉCURITÉ si mélange détecté
    if (profile && professional && profile.role !== 'professional') {
      console.error(
        '🚨 SÉCURITÉ CRITIQUE: Particulier avec données professionnelles!'
      );
    }

    if (profile && profile.role === 'professional' && !professional) {
      console.error(
        '🚨 SÉCURITÉ CRITIQUE: Professionnel sans données professionnelles!'
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ AuthContext: Login error:', error);
        return { success: false, error: error.message };
      }

      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email,
          created_at: data.user.created_at,
        });

        // Charger les données utilisateur SYNCHRONEMENT avant de retourner le succès
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
   * Déconnexion utilisateur avec gestion des erreurs de lock
   */
  const logout = async (): Promise<void> => {
    try {
      // Essayer de déconnexion avec retry en cas de lock
      let retryCount = 0;
      const maxRetries = 3;
      let error = null;

      while (retryCount < maxRetries) {
        try {
          const { error: signOutError } = await supabase.auth.signOut();
          error = signOutError;

          if (!error) {
            await resetAuthState();
            router.push('/auth/login');
            return;
          }

          // Si l'erreur est un lock, attendre et réessayer
          if (
            error.message?.includes('lock') ||
            error.message?.includes('stole')
          ) {
            retryCount++;
            await new Promise((resolve) =>
              setTimeout(resolve, 500 * retryCount)
            ); // Délai croissant
            continue;
          }

          // Autre erreur, sortir de la boucle
          break;
        } catch (e) {
          error = e;
          if (
            e instanceof Error &&
            (e.message?.includes('lock') || e.message?.includes('stole'))
          ) {
            retryCount++;
            await new Promise((resolve) =>
              setTimeout(resolve, 500 * retryCount)
            );
            continue;
          }
          break;
        }
      }

      if (error) {
        console.error('❌ AuthContext: Logout error after retries:', error);
      }

      // Forcer la réinitialisation même en cas d'erreur
      await resetAuthState();
      router.push('/auth/login');
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
    setUser(null);
    setProfile(null);
    setProfessional(null);
    setRole(null);
    setLoading(false);
  };

  /**
   * Rafraîchir les données utilisateur
   */
  const refreshUser = async (): Promise<void> => {
    if (!user) {
      return;
    }

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
