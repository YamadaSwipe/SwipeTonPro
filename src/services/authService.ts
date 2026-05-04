import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { getWelcomeEmailHtml } from '@/lib/welcomeEmailTemplate';

export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  user_metadata?: UserMetadata;
  created_at?: string;
}

export interface AuthError {
  message: string;
  code?: string;
}

interface UserMetadata {
  [key: string]: string | number | boolean | null;
}

interface UpdateAttributes {
  password?: string;
  data?: UserMetadata;
}

// Dynamic URL Helper
const getURL = () => {
  // En développement, utiliser localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  // En production, utiliser l'URL du site
  let url =
    process?.env?.NEXT_PUBLIC_VERCEL_URL ??
    process?.env?.NEXT_PUBLIC_SITE_URL ??
    'https://www.swipetonpro.com';

  // Include https:// when not localhost
  url = url.includes('http') ? url : `https://${url}`;

  // Remove trailing slash
  return url.replace(/\/$/, '');
};

export const authService = {
  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user
      ? {
          id: user.id,
          email: user.email || '',
          full_name:
            user.user_metadata?.full_name || user.user_metadata?.name || '',
          user_metadata: user.user_metadata,
          created_at: user.created_at,
        }
      : null;
  },

  // Get current session
  async getCurrentSession(): Promise<Session | null> {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) {
        console.error('Erreur lors de la récupération de la session:', error);
        return null;
      }
      return session;
    } catch (err) {
      console.error('Exception dans getCurrentSession:', err);
      return null;
    }
  },

  // Sign up with email and password
  async signUp(
    email: string,
    password: string
  ): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${getURL()}/auth/confirm-email`,
        },
      });

      if (error) {
        return {
          user: null,
          error: { message: error.message, code: error.status?.toString() },
        };
      }

      const authUser = data.user
        ? {
            id: data.user.id,
            email: data.user.email || '',
            user_metadata: data.user.user_metadata,
            created_at: data.user.created_at,
          }
        : null;

      // Envoi automatique de l'email de bienvenue
      if (authUser && authUser.email) {
        await axios.post('/api/send-email', {
          to: authUser.email,
          subject: 'Bienvenue sur SwipeTonPro !',
          html: getWelcomeEmailHtml(authUser.email),
          fromType: 'noreply',
        });
      }

      return { user: authUser, error: null };
    } catch (error) {
      return {
        user: null,
        error: { message: 'An unexpected error occurred during sign up' },
      };
    }
  },

  // Sign in with email and password
  async signIn(
    email: string,
    password: string
  ): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return {
          user: null,
          error: { message: error.message, code: error.status?.toString() },
        };
      }

      const authUser = data.user
        ? {
            id: data.user.id,
            email: data.user.email || '',
            user_metadata: data.user.user_metadata,
            created_at: data.user.created_at,
          }
        : null;

      return { user: authUser, error: null };
    } catch (error) {
      return {
        user: null,
        error: { message: 'An unexpected error occurred during sign in' },
      };
    }
  },

  // Sign out
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { error: { message: error.message } };
      }

      return { error: null };
    } catch (error) {
      return {
        error: { message: 'An unexpected error occurred during sign out' },
      };
    }
  },

  // Reset password - Utilise l'API interne pour bypass le SMTP manquant
  async resetPassword(
    email: string
  ): Promise<{ error: AuthError | null; resetLink?: string; note?: string }> {
    try {
      console.log('🔗 Appel API interne pour reset password:', email);

      // Appel à notre route API qui utilise le service role (bypass SMTP)
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: {
            message: data.error || 'Erreur lors de la réinitialisation',
          },
        };
      }

      return {
        error: null,
        resetLink: data.resetLink,
        note: data.note,
      };
    } catch (error) {
      console.error('❌ Erreur resetPassword:', error);
      return {
        error: {
          message: 'Une erreur est survenue lors de la réinitialisation',
        },
      };
    }
  },

  // Update user (password, metadata, etc.)
  async updateUser(
    attributes: UpdateAttributes
  ): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.updateUser(attributes);

      if (error) {
        return { user: null, error: { message: error.message } };
      }

      const authUser = data.user
        ? {
            id: data.user.id,
            email: data.user.email || '',
            user_metadata: data.user.user_metadata,
            created_at: data.user.created_at,
          }
        : null;

      return { user: authUser, error: null };
    } catch (error) {
      return {
        user: null,
        error: { message: 'An unexpected error occurred during user update' },
      };
    }
  },

  // Confirm email (REQUIRED)
  async confirmEmail(
    token: string,
    type: 'signup' | 'recovery' | 'email_change' = 'signup'
  ): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type,
      });

      if (error) {
        return {
          user: null,
          error: { message: error.message, code: error.status?.toString() },
        };
      }

      const authUser = data.user
        ? {
            id: data.user.id,
            email: data.user.email || '',
            user_metadata: data.user.user_metadata,
            created_at: data.user.created_at,
          }
        : null;

      return { user: authUser, error: null };
    } catch (error) {
      return {
        user: null,
        error: {
          message: 'An unexpected error occurred during email confirmation',
        },
      };
    }
  },

  // Listen to auth state changes
  onAuthStateChange(
    callback: (event: string, session: Session | null) => void
  ) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserMetadata | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });
  }, [fetchProfile, setLoading, setProfile, setUser]); // Added missing dependencies

  async function fetchProfile(userId: string) {
    try {
      // Try fetching professional profile first
      // Note: Avoid select("*") with JSONB columns to prevent 406 errors
      const { data: pro } = await supabase
        .from('professionals')
        .select(
          'id, user_id, siret, company_name, specialties, experience_years, coverage_radius, credits_balance, rating_average, rating_count, total_projects, certification_badge, certification_date, insurance_expiry_date, has_rge, has_qualibat, has_qualibois, has_qualipac, has_qualipv, has_qualitenr, has_eco_artisan, other_certifications, status, created_at, updated_at'
        )
        .eq('user_id', userId)
        .single();

      if (pro) {
        setProfile({
          ...pro,
          role: 'professional',
          other_certifications: [],
        } as unknown as UserMetadata);
      } else {
        // Fetch generic profile and check role
        const { data: profileData } = await supabase
          .from('profiles')
          .select(
            'id, email, full_name, phone, avatar_url, bio, address, postal_code, city, latitude, longitude, role, created_at, updated_at'
          )
          .eq('id', userId)
          .single();

        if (profileData) {
          setProfile({
            ...profileData,
            role: profileData.role || 'particulier',
          } as UserMetadata);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }

  return { user, profile, loading };
}
